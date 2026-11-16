import type { CollectionEntry } from 'astro:content';

type Contribution = CollectionEntry<'contributions'>;

/** Outcome upstream, out of 35. */
const statusPoints: Record<Contribution['data']['status'], number> = {
	Merged: 35,
	'Upstream Recognised': 28,
	'PR Open': 20,
	Implementation: 8,
	Reproduced: 6,
	Investigating: 4,
	Closed: 0,
};

/** Reach and visibility of the upstream project, out of 25. Unlisted repositories get 15. */
const repositoryPoints: Record<string, number> = {
	'vllm-project/vllm': 25,
	'ai-dynamo/dynamo': 24,
	'ai-dynamo/nixl': 22,
	'BerriAI/litellm': 22,
	'llm-d/llm-d-router': 20,
	'vllm-project/router': 18,
	'vllm-project/semantic-router': 17,
	'vllm-project/aibrix': 17,
	'llm-d/llm-d-inference-sim': 15,
};

/** Technical depth, out of 25. */
const complexityPoints: Record<Contribution['data']['complexity'], number> = { Hard: 25, Medium: 16, Simple: 8 };

/**
 * Ranking score out of 100: outcome (35) + project reach (25) + complexity (25) + impact (15, set per write-up).
 * Status is read live, so a PR that merges moves up without re-scoring.
 */
export function contributionScore(contribution: Contribution): number {
	const d = contribution.data;
	const status = d.prMerged ? 'Merged' : d.status;
	return statusPoints[status] + (repositoryPoints[d.repository] ?? 15) + complexityPoints[d.complexity] + d.impact;
}

/** Highest score first, newest first on ties. */
export function byScore(a: Contribution, b: Contribution): number {
	return contributionScore(b) - contributionScore(a) || b.data.date.localeCompare(a.data.date);
}
