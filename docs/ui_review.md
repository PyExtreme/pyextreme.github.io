# UI / UX Review: pyextreme.github.io

**Date:** 2026-10-20
**Scope:** every page, layout, component and stylesheet in `src/`, the built output in `dist/`, and the two SVG figures in `public/`.
**Method:** source and build-output inspection (no browser screenshots were taken). Measurements such as contrast ratios and diagram widths were computed from the source.
**Audience for the site:** recruiters and hiring managers evaluating a Staff AI Engineer with 7 years of experience.

---

## 0. Implementation status (branch `ui/high-severity-fixes`, 2026-10-20)

Everything rated **High** in this review has been implemented on the branch, plus the Critical items that needed no information from the author. Items still open are listed at the end.

**Done**

- Content now lives in two Astro content collections (`src/content/projects`, `src/content/contributions`) with Zod schemas. Both detail routes (`src/pages/projects/[slug].astro`, `src/pages/open-source/[slug].astro`) render the layout, metadata, a table of contents, reading time and a back link from the data. The vLLM Router #299 write-up, previously shipped with no layout, now renders like every other page at `/open-source/vllm-router-299/`.
- One `<h1>` per page everywhere. The MarketLane case studies' 25 and 27 h1 headings are now h2/h3. Both pages have a sticky table of contents on desktop.
- Stylesheet split into `src/styles/global.css`, `prose.css`, `article.css`; page-specific rules moved into scoped component styles. New components: `PageHeader`, `StatStrip`, `StatusPill`, `TableOfContents`, `SiteFooter`. Full article type scale (h2/h3/h4, blockquote, hr, tables in ink, code).
- Homepage: hero states name, "Staff AI Engineer", years, and three calls to action; a stats strip computed from the data; data-driven case-study cards with metadata chips; a merged-first open-source section; "What I work on" rewritten as five area-plus-evidence blocks that link to the case studies. "Systems in progress" and the Notes placeholder are gone.
- Open-source listing: stats strip (contributions, merged, PRs open, repositories); compact cards; filled accent "Merged" pill; status, complexity and order filters with an empty state; `dt`/`dd` markup fixed.
- Project cards use `56px 1fr auto` columns instead of `1fr 2fr auto`. The accent colour is now used for the primary CTA, the merged pill, the active nav underline and blockquote rules.
- Page titles get the "| Ankit Jha" suffix from the layout. Canonical URL, Open Graph and Twitter meta, JSON-LD Person, `@astrojs/sitemap`, `robots.txt`, a styled `404.astro`, `initial-scale=1`, a skip link, focus-visible styles, active nav state, and `--muted` darkened to 5.65:1.
- Footer and nav link to the real GitHub profile. LinkedIn, email and résumé render automatically once set in `src/data/site.ts`.
- Removed the `marketlane-daily-scan` stub and the Notes page; removed the "will be added" copy on the Projects page.

**Still open (needs input from the author)**

- LinkedIn URL, contact email and a résumé PDF (`src/data/site.ts`, marked TODO).
- About page body: biography and experience timeline.
- An Open Graph image (`og:image` is not emitted until one exists).
- Cutting the MarketLane case studies to roughly a third of their length and replacing the main ASCII diagrams with SVG figures.
- Phase 3 polish: self-hosted fonts, Shiki theme matched to the palette, monogram favicon, dark mode, README.

---

## 1. Executive summary

The site has a defensible visual direction (editorial, monochrome, big type) and some genuinely strong content (the Incident Commander write-up, the llm-d #801 case study). What holds it back is not the aesthetic. It is that the site reads as **unfinished and anonymous**: placeholders are visible on four of five top-level sections, there is no name, title, seniority, contact, résumé, GitHub or LinkedIn link anywhere that works, and two content pages ship with no layout at all. A recruiter spending 30 seconds on the homepage learns "AI Systems Engineer" and nothing else.

The ten issues that matter most, in order:

| # | Issue | Severity |
|---|---|---|
| 1 | GitHub and LinkedIn footer links are `href="#"` placeholders; no email, résumé or contact anywhere on the site | Critical |
| 2 | Two pages (`vllm-router-299-portfolio`, `marketlane-daily-scan`) render with **no layout, no nav, no CSS** (raw browser default HTML) | Critical |
| 3 | About page, Notes page, and the homepage "Latest" section are literally labelled placeholders | Critical |
| 4 | Homepage hero says only "AI Systems Engineer". No "Staff", no years, no location, no proof points, no call to action | Critical |
| 5 | The two MarketLane case studies use 25 and 27 `<h1>` headings each, rendered at up to 110px, and are 1000+ lines with no table of contents | High |
| 6 | ASCII diagrams in code blocks are up to 69 characters wide: they fit the desktop column but scroll sideways on phones | Medium |
| 7 | Open-source listing gives "Merged" the same visual weight as "Investigating"; there are no summary stats (merged count, projects touched) | High |
| 8 | Homepage section heading "Systems in progress" and projects page copy "case studies will be added" signal unfinished work | High |
| 9 | No Open Graph / Twitter card metadata, no canonical URL, no sitemap, no 404 page, no JSON-LD Person schema | High |
| 10 | Mobile nav is 10px monospace text with touch targets well under 24px; viewport meta lacks `initial-scale=1` | Medium |

---

## 2. Findings by area

Severity key: **Critical** = broken or actively damages credibility. **High** = clearly below a senior/staff bar. **Medium** = polish. **Low** = nice to have.

### 2.1 Positioning and content (what a recruiter actually reads)

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| Critical | Footer "GitHub" and "LinkedIn" links go to `#`. The `aria-label` even says "placeholder". | `src/layouts/BaseLayout.astro:32-33` | Link to the real profiles. Add an email and a résumé (PDF) link. These must be reachable from every page. |
| Critical | There is no email, résumé, or contact path on any page. `grep` for `mailto`, `resume`, `linkedin`, `github.com/PyExtreme` across `src/` finds nothing real. | site-wide | Add a persistent contact block in the hero and footer. A "Download résumé" and "Email me" pair is the single highest-value addition. |
| Critical | About page is a stub: "Biography, experience, and contact details will be added here." | `src/pages/about/index.astro:12` | Either write it (headline, 3-4 paragraph narrative, experience timeline with companies and dates, skills, contact) or remove it from the nav until it exists. |
| Critical | Notes page is a stub: "Notes coming soon." Homepage "03 / Latest" links to it with "Writing placeholder". | `src/pages/notes/index.astro:14`, `src/pages/index.astro:50-57` | Remove Notes from nav and homepage until there are at least 2-3 real posts. Shipping visible "coming soon" sections is the single clearest "junior portfolio" signal. |
| Critical | Hero copy is generic. "AI Systems Engineer" with four keywords. No seniority, years, location, current/previous employers, availability, or a single quantified achievement. | `src/pages/index.astro:8-12` | Rewrite the hero as a positioning statement. Example shape: name, "Staff AI Engineer, 7 years", one sentence on what you have shipped, 2-3 proof chips (e.g. "Merged in vLLM / llm-d", "Pre-registered multi-agent study, $33 budget"), then two CTAs (résumé, email). |
| High | Section heading "Systems in progress" under "Selected work". | `src/pages/index.astro:17` | Rename to "Selected work" or "Case studies". Do not frame your portfolio as in-progress. |
| High | Projects page intro: "Detailed case studies will be added as each project is documented." | `src/pages/projects/index.astro:11` | Delete. Three case studies already exist. |
| High | Homepage lists "Open Source Contributions" as project 04, but the Projects page lists three. The numbering and set differ between the two pages. | `src/pages/index.astro:21-26` vs `src/pages/projects/index.astro:14-16` | Keep one source of truth (a data file or content collection) and render both pages from it. Open source should be its own section on the homepage, with a stats strip, not a project card. |
| High | "What I work on" is seven bare nouns ("RAG", "Routing", "Scheduling"). For a staff profile it reads like a keyword list and carries no evidence. | `src/pages/index.astro:36-43` | Replace with 3-4 short "area + evidence" blocks, each linking to the case study that proves it. |
| High | Naming is inconsistent: nav says "Open source", homepage says "Open Source Contributions", listing h1 says "Contributions", list sub-heading says "Issues, systems, and fixes". | nav, home, `src/pages/open-source/index.astro:117-125` | Pick one label and use it in nav, headings and page titles. |
| Medium | Identity drifts: homepage says "AI Systems Engineer", MarketLane AI page ends with "AI / ML Engineer focused on production AI systems", About says "AI Systems Engineer". None say Staff. | `src/pages/projects/marketlane-ai.mdx:1020-1024` | One title, used everywhere. Remove the "Built by" sign-off blocks inside case studies; the site already attributes authorship. |
| Medium | Case-study cards have no metadata (year, role, stack, status, outcome). Every card looks the same regardless of scale. | `src/components/ProjectCard.astro` | Add 2-3 metadata chips per card: year, stack, and one outcome line. |
| Medium | Favicon is the default Astro rocket. | `public/favicon.svg` | Replace with a simple monogram matching the "AJ." wordmark. |

### 2.2 Broken or inconsistent rendering

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| Critical | `vllm-router-299-portfolio.md` is a plain `.md` page with no layout. The built HTML is `<!DOCTYPE html><meta charset="utf-8"><h1>…` with no `<html>`, `<head>`, nav, footer or CSS. It renders in Times New Roman with default browser styles. It is linked from the open-source listing as a "Hard" contribution, so recruiters will click it. | `src/pages/open-source/vllm-router-299-portfolio.md`, `dist/open-source/vllm-router-299-portfolio/index.html` | Convert to `.mdx` wrapped in `BaseLayout` like the sibling pages, or (better) move all write-ups into a content collection with a shared `[slug].astro` route so this class of bug cannot recur. |
| Critical | `marketlane-daily-scan.mdx` has no layout and is a placeholder ("Case study placeholder."). It is not linked but it is built and crawlable at `/projects/marketlane-daily-scan/`. | `src/pages/projects/marketlane-daily-scan.mdx` | Delete it or move it out of `src/pages/` until it has content. |
| High | Page `<title>` suffixes are inconsistent: project pages use "… \| Ankit Jha", open-source pages have no suffix, the 299 page has none. | all `.mdx` frontmatter + `BaseLayout` props | Have `BaseLayout` append the suffix automatically; pass only the page-specific title. |
| High | The layout is wrapped in MDX with a hand-written `<div class="article contribution-note">` on every page, and the frontmatter `title`/`description` are duplicated as `BaseLayout` props. Four pages copy this boilerplate. | every `.mdx` under `src/pages/` | Use `layout:` frontmatter or a content collection. Boilerplate per page is where the two unlayouted pages came from. |
| Medium | Shiki's inline `style="background-color:#24292e"` overrides `.article pre { background: #1f2927 }`, so code blocks are a different dark than the stylesheet intends. The `github-dark` theme also clashes with the paper/sage palette. | `src/layouts/BaseLayout.astro:71`, `dist/**/index.html` | Set `markdown.shikiConfig.theme` in `astro.config.mjs` to a theme matched to the palette (or a light theme), and stop overriding `pre` colours in CSS. |

### 2.3 Long-form article pages (case studies and contribution write-ups)

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| High | MarketLane AI uses **25 `<h1>`** and MarketLane Research uses **27 `<h1>`**. Each one is styled by the global `h1` rule: `clamp(58px, 9vw, 110px)` with `-0.08em` letter-spacing. Each section header is therefore as large as the page title. The pages are also 1027 and 1282 lines long. | `src/pages/projects/marketlane-ai.mdx`, `src/pages/projects/marketlane-research-rag.mdx`; `h1` rule at `BaseLayout.astro:62` | Demote `# Section` to `##` and `###`, keep one h1 per page. Cut each case study to roughly 1/3 the length with a TL;DR, an architecture figure, and 4-6 sections. Move the full text to a linked "deep dive" if you want to keep it. |
| Medium | ASCII box diagrams inside ```` ```text ```` blocks are up to **64, 69 and 75 characters wide** (an earlier draft of this review reported 192/222; that measurement counted UTF-8 bytes, not characters). At 13px DM Mono that is 420 to 500px, which fits the desktop column but scrolls sideways on a 390px phone. MarketLane AI has 35 code blocks, MarketLane Research 42, the 299 page 24; most are diagrams, not code. | same three files | Replace the main architecture diagrams with real SVG figures (as the Incident Commander page already does). Keep ASCII only for short flows. |
| High | No table of contents, reading time, or sticky section nav on 1000+ line pages. No "back to top". Two of the long pages also lack the "← Back to …" link that the others have. | long `.mdx` pages | Generate a ToC from headings (Astro exposes `headings` from MDX). Add a short meta line: date, reading time, status. |
| High | The global `.article td { color: var(--muted) }` greys out table cells. The best numbers on the site (the before/after metrics table on the llm-d #801 page: 69 races → 0, 6-7 failures → 0) are rendered in muted grey at 14px. | `BaseLayout.astro:76`, `src/pages/open-source/llm-d-inference-sim-801.mdx:30-37` | Table body text should be `--ink`; use muted only for the first column or captions. Consider a dedicated "key results" component. |
| Medium | `h3`, `h4`, `blockquote`, `hr` have no styles. MarketLane pages use 28 and 32 `---` rules (default bevelled grey browser `<hr>`) and 16 blockquotes (default indent, no bar). The #801 page has 15 h3 headings at browser default size. | `BaseLayout.astro` (missing rules) | Add a complete article type scale: h2/h3/h4, blockquote with a left rule, a thin `hr` in `--line`, figure/figcaption. |
| Medium | Three different measures on the same page: `.article` 760px, `.contribution-note` 820px, paragraphs 680px, lede 640px. | `BaseLayout.astro:66-84` | One content width (around 68-72ch) for text; allow only figures, tables and code to extend wider. |
| Medium | The article lede is set in 15px monospace. Monospace at paragraph length hurts readability, and the lede is the second thing a reader sees. | `.article-lede` at `BaseLayout.astro:81` | Set the lede in Manrope at 19-20px with `--muted`, keep mono for labels only. |
| Medium | The Incident Commander SVG figures use `-apple-system, Segoe UI, Helvetica` while the page uses Manrope/DM Mono, so the figure typography does not match the page. | `public/images/ai-incident-commander/*.svg` | Set `font-family` in the SVGs to match, or inline the SVGs so they inherit page fonts and colours. |
| Medium | Images have no `<figure>`/`<figcaption>`; the only caption is the alt text, which sighted readers never see. | `ai-incident-commander.mdx:30, 98` | Wrap figures with captions. |
| Low | `_Bug report and initial root-cause analysis by the issue reporter…_` attribution is italic body text floating between sections. | `llm-d-inference-sim-801.mdx` tail | Style as a small `<aside>` or move into the metadata table. |

### 2.4 Open-source contribution listing

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| High | The status pill differs only by a 1px border colour between near-identical greys/greens (`#b8c3be`, `#adbca4`, `#9caaa5`, `#819a78`). A merged upstream PR in llm-d is the strongest credential on the site and it is visually indistinguishable from "Investigating". | `src/components/ContributionCard.astro:103-108` | Give "Merged" a filled pill (ink on accent, or a check icon). Put merged contributions first by default, or add a "Merged" filter. |
| High | No summary strip: number of contributions, number merged, projects touched (vLLM, llm-d, vLLM Router). Recruiters scan for this before reading cards. | `src/pages/open-source/index.astro` | Add a 3-4 stat row above the list, computed from the data. |
| High | Each card is a 6-field definition grid plus a 2-field summary grid. Four cards take roughly 4 screens. "Issue", "Type", "Technical area", "Complexity" are low-information fields shown at equal weight with the summary. | `ContributionCard.astro:38-78` | Collapse to: repo, title, status pill, date, one-line summary, concept chips, links. Move "Type/Area/Complexity" to the detail page. |
| Medium | Sort and complexity filters have no empty state. Selecting "Simple" hides every card and leaves a blank area with no message. | `src/pages/open-source/index.astro:155-170` | Render a "No contributions match" row, or hide filter options with zero matches. |
| Medium | `<dt>`/`<dd>` are used without a wrapping `<dl>` (the `div`s sit directly in `.contribution-fields`). This is invalid HTML and screen readers lose the term/definition association. | `ContributionCard.astro:38-78` | Wrap the grid in `<dl>`; `div` children of `dl` are allowed. |
| Medium | The `Contribution` type and status/complexity unions are copy-pasted between `index.astro` and `ContributionCard.astro`. Data lives inline in the page. | `src/pages/open-source/index.astro:5-27` and `ContributionCard.astro:2-24` | Move contributions to `src/content/` with a Zod schema. Detail pages then derive their metadata table from the same record. |
| Low | The filter `<select>` elements use the native arrow with a square border; they look like unstyled form controls next to the editorial type. | `index.astro:151` | Replace with segmented buttons (Latest / Oldest, All / Hard / Medium) or style the select with a custom chevron. |

### 2.5 Layout and visual design

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| High | `.project-card` is `grid-template-columns: 1fr 2fr auto`. On the 1120px frame the two-digit number column is ~350px wide, so a third of every row is empty. The same happens in `.section-heading` (eyebrow gets 1/3). | `BaseLayout.astro:93, 90` | Use `auto 1fr auto` or `56px 1fr auto`. Reserve the 1/3 : 2/3 split for the section heading only if the left column carries real content. |
| High | `--accent: #d6ef62` is declared and **never used** (0 references). The whole site is `--ink`, `--muted`, `--line`, `--paper`. Nothing draws the eye to CTAs, merged status, or key numbers. | `BaseLayout.astro:45`, site-wide | Decide on one accent (the lime works on this palette for fills, not for text: it has 1.2:1 contrast on paper) and use it deliberately for primary CTA, merged status, active nav, and selection. |
| Medium | Headline letter-spacing is `-0.08em` at up to 110px (≈ -9px per pair) and `-0.065em` on h2. At that size the glyphs touch; "AI Systems" looks crushed. | `BaseLayout.astro:62, 92` | `-0.03em` to `-0.045em` is the usual range for Manrope display sizes. |
| Medium | Hero is 80-168px top padding + a 110px headline + 100-180px bottom padding. On a 1440×900 laptop the first screen shows only the words "AI Systems Engineer" and a keyword line; the work is below the fold. | `BaseLayout.astro:60` | Tighten the hero to ~60vh and surface proof (stats, two featured cards, or the contribution strip) above the fold. |
| Medium | Homepage "Engineering notes" uses a bespoke `.notes-placeholder` that duplicates the `.project-card` grid with different sizes (18px vs 20px title). | `src/pages/index.astro:63-70` | Delete with the Notes section, or reuse `ProjectCard`. |
| Medium | Nav has no active-page state and no hover affordance beyond underline. The wordmark "AJ." is the only brand element and is not explained anywhere (the name appears only in a tiny eyebrow). | `src/components/Navigation.astro`, `BaseLayout.astro:53-56` | Mark the current section (`aria-current="page"` + style). Consider full name in the wordmark. |
| Medium | Footer tagline "AI systems, thoughtfully engineered." is a slogan with no information. | `BaseLayout.astro:30` | Replace with name, email, location/time zone, and the profile links. |
| Low | No dark mode. The favicon already adapts to `prefers-color-scheme`, but the page does not. | `BaseLayout.astro` | Optional, but cheap with the existing token setup: redefine the five tokens under `prefers-color-scheme: dark`. |
| Low | Every link uses `color: inherit` with default underline; visited, hover and focus states are not differentiated for body links. | `BaseLayout.astro:50` | Define `a:hover`, `a:focus-visible`, and underline offset/thickness once. |

### 2.6 Responsive behaviour

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| Medium | `<meta name="viewport" content="width=device-width">` omits `initial-scale=1`. iOS Safari can render landscape at the wrong zoom. | `BaseLayout.astro:20` | `width=device-width, initial-scale=1`. |
| Medium | Mobile nav links are **10px** DM Mono with 14px gaps. Four links fit, but the tap targets are roughly 40×12px, under the WCAG 2.5.8 24px minimum, and 10px is below the common 12px legibility floor. | `BaseLayout.astro:107-108` | 13-14px with 12px vertical padding, or a compact menu. |
| Medium | `.article table` becomes `display:block; white-space:nowrap` on mobile: the metadata tables and the metrics table in #801 become one long scrolling line. | `BaseLayout.astro:120` | Allow wrapping in the second column; stack key/value tables as a definition list under 640px. |
| Medium | Code blocks are 13px with 24px padding on mobile; combined with the ASCII diagram widths, almost every block on the MarketLane pages scrolls sideways. | `BaseLayout.astro:71` | Follows from fixing 2.3. Also reduce padding to 16px under 640px. |
| Low | Hero h1 minimum is 58px; on a 360px phone "AI Systems" at 58px with -0.08em tracking wraps and looks heavy. | `BaseLayout.astro:62` | Drop the clamp floor to ~44px. |

### 2.7 Accessibility

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| Medium | No skip-to-content link; `main` has no `id` to target. | `BaseLayout.astro` | Add `<a class="skip-link" href="#main">` as the first element. |
| Medium | No `:focus-visible` styles anywhere; keyboard users get the browser default blue ring on a sage palette. | site-wide | Define a focus ring in `--ink` or the accent with 2px offset. |
| Medium | Muted text `#68716e` on `#f7f8f5` is 4.72:1. That passes AA for normal text but it is used at 11px (eyebrows, dt labels, status pills) and 12-13px (nav, footer, descriptions) where the margin is thin. | tokens at `BaseLayout.astro:42-43` | Darken `--muted` to about `#5a635f` (≥5.5:1) or stop using it below 13px. |
| Medium | Decorative `↗` glyphs are mostly `aria-hidden`, but in `ContributionCard` the arrows inside links ("Issue ↗", "PR ↗") are read aloud. | `ContributionCard.astro:34, 64-66` | Wrap the glyph in `<span aria-hidden="true">` or use an SVG icon. |
| Low | Headings skip levels on the open-source listing: page h1 → section h2 → each card h2 → detail tables. On MDX pages, the `.eyebrow` paragraph precedes the h1 which is fine, but the long pages' 25 h1s break the outline entirely. | listing + long pages | Follows from 2.3. |
| Low | `lang="en"` is set, but there is no `<html>` at all on the two unlayouted pages. | see 2.2 | Fix via layout. |

### 2.8 SEO, sharing and metadata

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| High | No Open Graph or Twitter card tags. Sharing a case study link on LinkedIn or Slack produces a bare URL with no title, description or image. For a recruiter-facing site this is the most common way the link is seen. | `BaseLayout.astro:16-23` | Add `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `twitter:card`. Generate one default OG image and per-page images for case studies. |
| High | No canonical URL, no sitemap, no `robots.txt`, no `404.astro`. GitHub Pages will serve its own 404. | `astro.config.mjs`, `public/` | Add `@astrojs/sitemap`, a `robots.txt`, a styled `404.astro`, and `<link rel="canonical">` from `Astro.url`. |
| Medium | No JSON-LD `Person` schema (name, jobTitle, sameAs for GitHub/LinkedIn). | `BaseLayout.astro` | Add once in the layout. |
| Medium | `<meta name="generator" content="Astro …">` is shipped; harmless but adds nothing. | `BaseLayout.astro:22` | Remove. |
| Low | No `theme-color`, no `apple-touch-icon`. | `BaseLayout.astro` | Add. |

### 2.9 Performance

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| Medium | Fonts are loaded via `@import` inside a `<style is:global>` block. The browser must download and parse the CSS before it discovers the font request, which delays first paint and causes a visible font swap. No `preconnect` to Google Fonts. | `BaseLayout.astro:40` | Self-host Manrope and DM Mono (woff2, two weights each) with `font-display: swap` and `<link rel="preload">`, or at minimum move to `<link>` tags with `preconnect`. |
| Low | Shiki emits inline colour spans for every token on 8-84 code blocks per page; on the MarketLane pages most blocks are `text` diagrams that gain nothing from highlighting but still carry the markup. | long pages | Fixing the diagrams (2.3) resolves this. |
| Low | The built site is small and static; no other performance concerns were found. | | |

### 2.10 Code structure (affects how quickly the above can be fixed)

| Sev | Finding | Where | Recommendation |
|---|---|---|---|
| High | All page styling lives in one 120-line global `<style>` in the layout, mixing page-specific rules (`.hero`, `.project-card`, `.contribution-note`) with base styles. Three listing pages copy the same `.listing-page` / `.page-header` block. | `BaseLayout.astro:39-126`; `projects/index.astro`, `open-source/index.astro`, `notes/index.astro` | Split into `global.css` (tokens, reset, typography), `prose.css` (article), and component-scoped styles. Create a `PageHeader` component. |
| High | Content pages are hand-wrapped MDX under `src/pages/`. No schema, no shared route, no derived metadata (dates, reading time, ToC). | `src/pages/**/*.mdx` | Move to `src/content/projects` and `src/content/contributions` collections with Zod schemas; render through `src/pages/projects/[slug].astro` and `src/pages/open-source/[slug].astro`. |
| Medium | `README.md` is the untouched Astro starter ("Seasoned astronaut? Delete this file"). Recruiters who open the repo see it first. | `README.md` | Replace with a short description of the site and how it is built. |
| Low | Three source-brief markdown files sit untracked at the repo root (`801_llm-d.md`, `ai-incident-commander.md`, plus two gitignored MarketLane briefs). | repo root | Move to `docs/briefs/` or keep gitignored consistently. |

---

## 3. Recommended order of work

**Phase 1: stop the bleeding (half a day).** Everything a recruiter would notice in the first minute.

1. Real GitHub, LinkedIn, email and résumé links in hero and footer.
2. Remove Notes from nav and homepage; remove the Notes "Latest" section; delete or hide `marketlane-daily-scan`.
3. Wrap `vllm-router-299-portfolio` in the layout (or convert to a collection, see Phase 2).
4. Rewrite the hero: name, "Staff AI Engineer · 7 years", one-line value statement, proof chips, two CTAs.
5. Rename "Systems in progress"; delete the "will be added" sentences.
6. Write the About page (even a tight 200-word version plus an experience list).
7. Add OG/Twitter meta, canonical, sitemap, `404.astro`, `initial-scale=1`.

**Phase 2: make the content legible (1-2 days).**

8. Move projects and contributions into content collections with schemas; generate listing pages, metadata tables, ToC and reading time from the data.
9. Fix heading hierarchy on the MarketLane pages (one h1), cut them to a third, and replace the main ASCII diagrams with SVG figures.
10. Add the article type scale (h2/h3/h4, blockquote, hr, figure, table body in ink).
11. Redesign the contribution card (compact) and add a stats strip; make "Merged" visually primary.
12. Fix `.project-card` / `.section-heading` column ratios; add card metadata chips.

**Phase 3: polish (1 day).**

13. Self-host fonts; adopt a Shiki theme matched to the palette.
14. Use the accent colour deliberately (CTA, merged, active nav, focus ring).
15. Active nav state, skip link, focus styles, darker `--muted`, mobile nav sizing.
16. Monogram favicon, JSON-LD Person, optional dark mode, new README.

---

## 4. What a staff-level portfolio page needs that this one lacks

For reference when rewriting the homepage and About page:

- **Who and what in one line**: name, title with seniority, years, domain. Visible without scrolling.
- **Evidence above the fold**: 3-4 quantified outcomes or credentials (merged upstream PRs in vLLM/llm-d; a pre-registered study with a reported null result; a production platform live at a URL).
- **A path to contact**: email and résumé on every page.
- **Curated, not exhaustive**: three excellent case studies beat three long ones. Each should open with a TL;DR, the problem, the decision, the result, and your specific role.
- **An experience timeline**: companies, roles, dates, one line each on scope. Recruiters look for this before anything else.
- **Nothing that says "placeholder", "coming soon", "in progress", or "will be added".**
