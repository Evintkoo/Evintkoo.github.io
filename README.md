# Evint Leovonzko — Personal Portfolio

Personal portfolio and research showcase for [evintleovonzko.com](https://evintkoo.github.io). Built with [Astro](https://astro.build) (`astro@^7.3.2`) as a static site, with `@astrojs/mdx` for MDX content authoring.

---

## Structure

```
/
├── astro.config.mjs        # output: 'static', @astrojs/mdx integration
├── src/
│   ├── content/
│   │   ├── projects/*.mdx  # One file per project — single source of truth
│   │   └── research/*.mdx  # One file per paper/analysis — single source of truth
│   ├── content.config.ts   # Zod schemas for the `projects` and `research` collections
│   ├── pages/
│   │   ├── index.astro, about.astro
│   │   ├── projects/index.astro, projects/[slug].astro
│   │   └── research/index.astro, research/[slug].astro
│   ├── components/          # Layout, Nav, Footer, ResearchHero, ProjectCTA, FeatureGrid, TechPills
│   ├── islands/              # Vanilla TypeScript interactivity (no React/Vue)
│   └── styles/               # tokens.css (design tokens), global.css
└── public/                   # Static assets served as-is (images, files, favicon)
```

## Content model

All project and research metadata lives in exactly one place: Astro Content Collections. Each project is a `src/content/projects/*.mdx` file and each paper/analysis is a `src/content/research/*.mdx` file, validated against the schemas in `src/content.config.ts`. This replaces the old site's 3-location drift problem (hand-written HTML cards + a `data.js` array + a separate recommendations file) with a single source of truth.

Pages are rendered through two shared dynamic templates — `src/pages/projects/[slug].astro` and `src/pages/research/[slug].astro` — one per content type. Every project or paper goes through the same template, so adding a new entry means adding a new `.mdx` file, not writing new page code.

## Sections

**Projects** — Open-source tools and applications including Kolosal AI, PyTorch Inference Framework, SOM Plus Clustering, Chain Reaction Simulation, and others.

**Research & Analysis** — First-author papers and analyses in ML, computational biology, and quantitative finance. Topics include GRN link prediction, circular RNA classification, GDP trajectory clustering, and crypto/equity timing.

## Interactivity

Interactive behavior lives in `src/islands/*.ts` as plain vanilla TypeScript modules (theme toggle, caveman/simple mode, scroll reveal, hero scene, mindmap, research charts, SOM playground, activity feed). There's no client-hydration framework — each Astro component or page wires up the module it needs with a small inline `<script>` block that imports the island and null-guards its DOM lookups.

## Design

- **System:** "Technical Editorial" — an ink/paper palette with a single electric-blue accent color (see `src/styles/tokens.css` for exact tokens: `--paper`, `--ink`, `--accent`, etc.), full dark mode via `[data-theme="dark"]`.
- **Fonts:** JetBrains Mono (nav, labels, metadata) — `--font-mono`; Instrument Serif (display) — `--font-display`; Plus Jakarta Sans (body) — `--font-body`.
- **Responsive:** Breakpoints at 1023px, 767px, 639px, and 479px (unchanged from the old site).

## Local Development

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds the site with `npm run build` and deploys `dist/` to GitHub Pages via the native Pages Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`), triggered on every push to `main`.

## License

Source code is MIT licensed. Written content and research are all rights reserved.
