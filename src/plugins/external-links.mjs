/**
 * Sätteri hast plugin: absolute http(s) links in rendered Markdown/MDX open in a
 * new tab. Relative (internal) links are left untouched.
 */
export function externalLinksPlugin() {
	return {
		name: 'external-links',
		element: {
			filter: ['a'],
			visit(node, ctx) {
				const href = node.properties?.href;
				if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
				ctx.setProperty(node, 'target', '_blank');
				ctx.setProperty(node, 'rel', 'noopener noreferrer');
			},
		},
	};
}
