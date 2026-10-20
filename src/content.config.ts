import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const link = z.object({ label: z.string(), href: z.string().url() });

const projects = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
	schema: z.object({
		/** Project name, used on cards and as the page eyebrow when a headline exists. */
		title: z.string(),
		/** Optional write-up headline. Rendered as the page h1 instead of the title. */
		headline: z.string().optional(),
		description: z.string(),
		lede: z.string().optional(),
		year: z.number().int(),
		updated: isoDate.optional(),
		order: z.number().int(),
		kind: z.enum(['Product', 'Research', 'Infrastructure']),
		stack: z.array(z.string()).default([]),
		outcome: z.string().optional(),
		links: z.array(link).default([]),
		draft: z.boolean().default(false),
	}),
});

const contributions = defineCollection({
	loader: glob({ pattern: '**/*.mdx', base: './src/content/contributions' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		lede: z.string().optional(),
		project: z.string(),
		repository: z.string(),
		repositoryUrl: z.string().url(),
		issueNumber: z.string(),
		contributionType: z.string(),
		technicalArea: z.string(),
		status: z.enum(['Investigating', 'Reproduced', 'Implementation', 'PR Open', 'Merged', 'Closed']),
		/** Overrides `status` to Merged everywhere it is displayed. */
		prMerged: z.boolean().default(false),
		date: isoDate,
		complexity: z.enum(['Simple', 'Medium', 'Hard']),
		issueUrl: z.string().url().optional(),
		prUrl: z.string().url().optional(),
		commitUrl: z.string().url().optional(),
		stack: z.array(z.string()).default([]),
		shortSummary: z.string(),
		concepts: z.array(z.string()),
		draft: z.boolean().default(false),
	}),
});

export const collections = { projects, contributions };
