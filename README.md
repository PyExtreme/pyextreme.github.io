# pyextreme.github.io

Portfolio of Ankit Jha, Staff AI Engineer. Live at [pyextreme.github.io](https://pyextreme.github.io).

The site covers AI systems built end to end: agents, retrieval and evaluation, down to LLM inference, request routing and the infrastructure underneath.

- **Projects**: case studies with the architecture, the trade-offs and the measured results.
- **Open source**: write-ups of upstream contributions to vLLM, llm-d, NVIDIA Dynamo and LiteLLM, each with the root cause and the test that reproduces it.
- **About**: experience, toolkit and contact details.

## How it is built

A static [Astro](https://astro.build) site deployed to GitHub Pages by the workflow in `.github/workflows/deploy.yml`.

```text
src/
├── content/
│   ├── projects/        Case studies (MDX, validated by a Zod schema)
│   └── contributions/   Open-source write-ups (MDX, validated by a Zod schema)
├── components/          Cards, navigation, stat strip, interactive explainers
├── layouts/             Base layout: metadata, Open Graph tags, theme
├── pages/               Home, listings, detail routes, About
├── styles/              Design tokens (light and dark), prose and article styles
└── data/site.ts         Name, role and contact links used across the site
public/                  Favicon, Open Graph image, diagrams
```

Projects and contributions are content collections defined in `src/content.config.ts`. Listing pages, statistics, metadata tables and reading times are generated from the frontmatter, so adding a write-up is a single MDX file.

## Local development

Requires Node 22.12 or newer.

| Command           | Action                                    |
| :---------------- | :---------------------------------------- |
| `npm install`     | Install dependencies                      |
| `npm run dev`     | Start the dev server at `localhost:4321`  |
| `npm run build`   | Build the production site into `dist/`    |
| `npm run preview` | Preview the production build locally      |
