---
title: Persistent Worker State for Discovered P/D Routing in vLLM Router
description: Persistent discovery workers, generation-aware lifecycle reconciliation, cache-aware membership, and phase-correct load accounting for vLLM prefill/decode routing.
---

# Persistent Worker State for Discovered P/D Routing in vLLM Router

> Fixing worker identity, cache-aware initialization, discovery lifecycle, and in-flight load accounting for vLLM prefill/decode disaggregation.

## Contribution

| Field | Details |
| --- | --- |
| Project | vLLM Router |
| Repository | [`vllm-project/router`](https://github.com/vllm-project/router) |
| Issue | [#299 — PD discovery drops worker load state and bypasses cache-aware initialization](https://github.com/vllm-project/router/issues/299) |
| Pull request | [#311 — Fix persistent worker state for discovered P/D routing](https://github.com/vllm-project/router/pull/311) |
| Status | PR Open |
| Area | LLM inference routing / Prefill-Decode disaggregation |
| Contribution type | Routing lifecycle correctness |
| Main concepts | Service discovery, persistent worker identity, cache-aware routing, concurrency, RAII, streaming lifecycle |

## The problem

vLLM Router supports **Prefill/Decode (P/D) disaggregation**, where prompt processing and token generation can be routed to different workers.

In service-discovery mode, the router knew which backend endpoints existed, but it reconstructed new `BasicWorker` objects every time it performed policy selection.

Conceptually, the old path was:

```text
ServiceRegistry
    |
    | discovered HTTP/ZMQ endpoints
    v
Vec<(http_addr, zmq_addr)>
    |
    | create new BasicWorker for every selection
    v
temporary Worker objects
    |
    v
load-balancing policy
    |
    v
selected endpoint
```

The endpoint persisted, but the **routing state attached to the worker object did not**.

A newly created `BasicWorker` starts with fresh state such as:

```text
load = 0
processed_requests = 0
health state = fresh
circuit breaker = fresh
```

That meant a later routing decision could not see outstanding work already assigned to the same discovered endpoint.

### Why this broke cache-aware routing

`CacheAwarePolicy` uses worker load to decide when prefix affinity should yield to a less-loaded worker.

With workers recreated on every selection, the policy repeatedly saw something equivalent to:

```text
Reality:
P0 load = 20
P1 load = 0

What the next discovery selection saw:
P0 load = 0
P1 load = 0
```

The overload branch therefore could not make decisions from persistent live load.

There was a second integration gap: newly discovered workers were not properly added to the cache-aware policy lifecycle. A fresh discovery deployment could therefore have no cache tree at all and stay on the policy's missing-tree fallback path.

The issue was not primarily a cache algorithm bug. It was a broken integration boundary between:

```text
service discovery
        and
persistent Worker / policy lifecycle
```

## Design goals

The fix needed to preserve several invariants:

- One continuously registered `(role, endpoint)` should reuse one persistent worker object.
- Prefill and decode workers must remain separate scheduling resources even when their URLs are identical.
- Worker additions and removals must update cache-aware membership.
- A backend that expires and later re-registers at the same URL must receive fresh worker state.
- Discovery reconciliation must not move backwards because of stale concurrent snapshots.
- The endpoint selected for dispatch must remain paired with the exact persistent worker whose load is tracked.
- Prefill and decode load must reflect their actual execution phases.
- Streaming decode load must remain active after headers until EOF, stream error, cancellation, or body drop.
- Equal-load cold traffic should not repeatedly prefer the first snapshot entry.

## Architecture after the fix

```text
                         vLLM registrations / heartbeats
                                      |
                                      v
                              +-----------------+
                              | ServiceRegistry |
                              |-----------------|
                              | HTTP endpoint   |
                              | ZMQ endpoint    |
                              | generation      |
                              | expiry          |
                              +--------+--------+
                                       |
                                       | generation-aware snapshot
                                       v
                    +--------------------------------------+
                    | role-specific DiscoveryPool          |
                    |--------------------------------------|
                    | Prefill pool          Decode pool    |
                    |                                      |
                    | endpoint -> persistent Arc<Worker>   |
                    | endpoint -> registration generation  |
                    +------------------+-------------------+
                                       |
                      serialized snapshot / reconcile
                                       |
              +------------------------+-----------------------+
              |                                                |
              v                                                v
    +--------------------+                           +--------------------+
    | CacheAwarePolicy   |                           | Other LB policies  |
    |--------------------|                           |--------------------|
    | add worker         |                           | select persistent  |
    | remove worker      |                           | workers            |
    | prefix affinity    |                           +---------+----------+
    | load-aware routing |                                     |
    +---------+----------+                                     |
              +----------------------+--------------------------+
                                     |
                                     v
                          selected endpoint + Arc<Worker>
                                     |
                           +---------+---------+
                           |                   |
                           v                   v
                     Prefill phase       Decode phase
                     load guard          load guard
                           |                   |
                           |                   +---- streaming body
                           |                            |
                           v                            v
                         drop                       EOF / error /
                                                    client drop
```

## 1. Persistent role-specific discovery workers

The router now keeps separate persistent pools for discovered prefill and decode workers.

Conceptually:

```text
Prefill DiscoveryPool
    http://worker-a -> Arc<Worker P>
    http://worker-b -> Arc<Worker P>

Decode DiscoveryPool
    http://worker-a -> Arc<Worker D>
    http://worker-c -> Arc<Worker D>
```

The role separation is important. A prefill worker and a decode worker are different scheduling resources even if they happen to use the same HTTP URL.

For a continuously registered endpoint, later selections reuse the same `Arc<dyn Worker>`, preserving:

- live load,
- processed-request count,
- health state,
- circuit-breaker state.

The selected HTTP/ZMQ tuple stays paired with the exact worker object used by the routing policy.

## 2. Generation-aware registration lifetimes

URL identity alone is not enough.

Consider this sequence:

```text
worker at http://host:8000
        |
        | expires / process dies
        v
new worker starts at the same URL
```

Without an additional lifecycle identity, the persistent pool could mistakenly treat the replacement process as the old worker and inherit stale load, health, and cache state.

`ServiceRegistry` therefore tracks a **registration generation**.

```text
first registration       -> generation 41
heartbeat                -> generation 41
heartbeat                -> generation 41

worker expires

same URL registers again -> generation 42
```

Generation allocation and registry insertion happen atomically under the role registry lock.

An entry that is already expired is treated as a new lifetime even if the periodic cleanup pass has not removed it yet.

Reconciliation then behaves as:

```text
same URL + same generation
    -> reuse persistent Arc<Worker>

same URL + new generation
    -> remove old cache membership
    -> create fresh Worker
    -> start with fresh runtime state
```

An in-flight request can still safely own the old `Arc`; its eventual cleanup cannot mutate the replacement worker.

## 3. Serialized snapshot and reconciliation

A subtle concurrency problem appears if a request reads the registry snapshot before acquiring the discovery-pool lock.

Bad ordering:

```text
Request A reads old snapshot S1
        |
        | pauses
        v
registry changes

Request B reads S2
Request B installs newer membership
        |
        v
Request A resumes
Request A installs stale S1
```

That can resurrect an expired worker or remove a newly registered one.

The fix makes snapshot acquisition part of the role-specific discovery transaction:

```text
acquire DiscoveryPool lock
        |
        v
read ServiceRegistry snapshot
        |
        v
reconcile additions / removals / generations
        |
        v
update cache-aware membership
        |
        v
policy selection / reservation
        |
        v
release lock
```

No ordinary mutex is held across asynchronous network I/O.

The implementation also reconciles both required roles before deciding that a request cannot proceed. If a required prefill or decode pool is empty, the router returns `503` without creating false routing/cache state for work that will never start.

## 4. Cache-aware membership lifecycle

Discovered workers are now integrated into `CacheAwarePolicy` membership.

On arrival:

```text
new discovered worker
    -> persistent Worker created
    -> CacheAwarePolicy::add_worker(...)
    -> model tree exists
```

On removal or generation replacement:

```text
departed worker
    -> CacheAwarePolicy::remove_worker(...)
    -> stale affinity removed
    -> persistent worker removed from pool
```

This allows the first real discovered request to use normal cache-aware behavior instead of remaining indefinitely on the missing-tree fallback.

## 5. Phase-correct load accounting

The selected persistent worker objects are also the objects used for load accounting.

### Sequential P/D

```text
Prefill worker
load:   0 ---- 1 ==================== 0

Decode worker
load:   0 --------------------------- 1 ================ 0
```

Decode load is not counted during a long sequential prefill.

### Concurrent P/D

For MoRI-IO WRITE mode and NIXL push mode, prefill and decode may execute concurrently:

```text
Prefill:  0 ---- 1 ============ 0
Decode:   0 ------- 1 ====================== 0
```

Each phase owns an independent guard, so one phase finishing or failing does not artificially keep the other phase loaded.

## 6. Cancellation-safe RAII guards

Load reservations use an owned RAII guard.

```text
guard created
    -> worker.increment_load()

guard dropped
    -> worker.decrement_load()
```

This makes cleanup follow Rust ownership rather than a manually maintained matrix of success/error branches.

The guard is released correctly when:

- request setup fails,
- an HTTP request errors,
- an async future is cancelled,
- a phase completes,
- a response stream errors,
- a client drops the streaming body.

## 7. Streaming decode lifetime

Returning HTTP headers does not mean decode work is finished.

The decode load guard is transferred into the streaming response body:

```text
decode request begins
        |
        v
load = 1
        |
        v
response headers returned
        |
        | load is still 1
        v
streaming tokens
        |
        +--> EOF
        +--> stream error
        +--> client/body drop
                |
                v
             load = 0
```

This preserves useful load information for subsequent routing decisions while generation is still in progress.

## 8. Fair equal-load selection

For low-cache-match and imbalance paths, cache-aware routing previously chose the minimum load:

```rust
workers[idx].load()
```

When every worker had equal load, iteration order could repeatedly favor the first worker in the discovery snapshot.

The tie-break now uses:

```rust
(
    workers[idx].load(),
    workers[idx].processed_requests(),
    idx,
)
```

This preserves prefix affinity when it is meaningful while distributing unrelated equal-load traffic more fairly.

## Failure handling and lifecycle summary

```text
registration
    |
    v
persistent Worker created
    |
    +--> cache membership added
    |
    v
routing selection
    |
    v
phase reservation
    |
    +--> setup error -----------+
    |                           |
    +--> cancellation ----------+
    |                           |
    +--> normal completion -----+--> guard drop --> load--
    |
    +--> streaming headers
            |
            v
       streaming body
            |
            +--> EOF -----------+
            +--> error ---------+--> guard drop --> load--
            +--> client drop ---+

worker expiry / replacement
    |
    v
generation changes
    |
    +--> old cache membership removed
    +--> fresh Worker created
    +--> old in-flight Arc allowed to finish independently
```

## Files changed

The contribution is intentionally concentrated in three areas:

### `src/routers/http/vllm_pd_router.rs`

- persistent role-specific discovery pools,
- atomic snapshot/reconciliation/selection flow,
- endpoint/worker pairing,
- prefill/decode load guards,
- streaming body ownership,
- discovery lifecycle regression tests.

### `src/routers/http/vllm_service_discovery.rs`

- registration generations,
- heartbeat vs re-registration semantics,
- generation-aware snapshots,
- expired-but-not-yet-cleaned replacement handling.

### `src/policies/cache_aware.rs`

- equal-load fairness tie-break,
- focused cache-aware routing tests.

## Regression coverage

The tests cover the important lifecycle boundaries:

- persistent worker identity across selections,
- prefill/decode role separation,
- changed snapshot ordering while preserving endpoint/worker pairing,
- outstanding load affecting later selection,
- empty-snapshot cleanup,
- same-URL re-registration with fresh state,
- generation replacement without requiring an intermediate empty snapshot,
- heartbeat generation preservation,
- expiry followed by same-URL registration,
- cache tree initialization and stale-affinity removal,
- overloaded cache owner yielding to another worker,
- equal-load routing fairness,
- cancellation-safe guard cleanup,
- independent concurrent P/D lifetimes,
- decode error while prefill remains active,
- streaming EOF, body error, and client/body drop.

## Validation

The pull request reports the following local validation:

```text
cargo fmt --all -- --check
cargo test --locked --lib --bins --tests
git diff --check upstream/main
```

Reported Rust test result:

```text
862 passed
0 failed
1 ignored
```

Strict Clippy was blocked by three pre-existing warnings in unrelated upstream files; the #299 changes themselves introduced no reported Clippy warning.

## Why this contribution matters

The change makes service-discovered P/D routing operate on the same kind of persistent runtime state that stateful load-balancing policies assume.

The key improvement is not simply "store workers in a map."

It establishes a complete lifecycle:

```text
registration
    -> persistent scheduling identity
    -> cache-aware membership
    -> concurrent-safe reconciliation
    -> live load visibility
    -> phase-correct accounting
    -> streaming ownership
    -> removal / fresh re-registration
```

That gives routing policies meaningful information across requests instead of reconstructing an artificial zero-load world for every decision.

## What I learned

- Service discovery identity and scheduling identity are related but not identical.
- Persistent load-balancing state requires explicit lifecycle reconciliation, not just endpoint discovery.
- A URL is not enough to identify a process lifetime; re-registration needs an epoch/generation.
- Snapshot timing matters: locking a map is not sufficient if the snapshot was already stale before the lock was acquired.
- Prefill and decode are separate scheduling resources with different load lifetimes.
- Streaming HTTP responses extend backend execution well beyond response-header arrival.
- RAII is a strong model for cancellation-safe in-flight accounting.
- Cache locality and load balancing need an explicit overload escape path and deterministic fairness for cold traffic.
- Infrastructure regression tests need controlled concurrency and lifecycle failures, not only happy-path request tests.

## Links

- [vLLM Router repository](https://github.com/vllm-project/router)
- [Issue #299 — PD discovery drops worker load state and bypasses cache-aware initialization](https://github.com/vllm-project/router/issues/299)
- [Pull request #311 — Fix persistent worker state for discovered P/D routing](https://github.com/vllm-project/router/pull/311)
- [Open-source portfolio](https://pyextreme.github.io/open-source/)

---

Suggested portfolio card metadata:

```text
Project: vLLM Router
Issue: #299
Title: Persistent worker state for discovered P/D routing
Contribution type: Routing lifecycle correctness
Technical area: LLM inference routing
Status: PR Open

Summary:
Preserve discovered prefill/decode worker state across routing decisions, synchronize cache-aware membership with registration lifetimes, and track phase-correct load through cancellation and streaming response completion.

Concepts:
Persistent worker identity · P/D disaggregation · Cache-aware routing · Service discovery · Concurrency · RAII · Streaming lifecycle

Detail route:
/open-source/vllm-router-299/
```
