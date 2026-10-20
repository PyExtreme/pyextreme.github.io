import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { externalLinksPlugin } from './src/plugins/external-links.mjs';

export default defineConfig({
  site: 'https://pyextreme.github.io',
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: satteri({ hastPlugins: [externalLinksPlugin()] }),
  },
});
