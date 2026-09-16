# Astro Rebrand & Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite Evintkoo.github.io from vanilla HTML/CSS/JS to Astro, with one shared template per page type (so every project page — explicitly including `torch-inference` and `kolosal-automl` — and every research page render through identical structure), a refreshed "Technical Editorial" visual identity, and Content Collections as the single source of truth for project/research metadata.

**Architecture:** Astro static site, TypeScript throughout, Content Collections (`projects`, `research`) driving `[slug].astro` detail templates and index pages. All interactivity (hero Three.js scene, SOM playground, research charts, GitHub activity feed, caveman mode, theme toggle) reimplemented as typed vanilla TS Astro islands — no UI framework. Hand-authored CSS with design-token custom properties, scoped per component, no Tailwind. GitHub Actions builds and deploys to GitHub Pages.

**Tech Stack:** Astro (latest, static output), TypeScript, Three.js r162 (CDN ES module, unchanged from today), MDX for content bodies, GitHub Actions (`actions/upload-pages-artifact` + `actions/deploy-pages`).

**Spec:** `docs/superpowers/specs/2026-09-16-astro-rebrand-design.md` (read §11 first — it overrides §2/§8: **content and wireframe are ported 1:1, only the UI changes**; no copy rewriting).

## Global Constraints

- **Content parity:** every fact, link, paragraph, and section from the current site must appear in the new site. Do not rewrite, trim, or "improve" prose during migration — copy it verbatim from the source HTML into MDX. (Spec §11)
- **Wireframe parity:** each page type's section order/information architecture (hero → overview → features → tech → CTA for projects; hero → mindmap → abstract → introduction → methods → results → discussion → conclusion → related for research) is preserved as-is. Only the visual styling changes. (Spec §11)
- **One template per page type:** every project renders through exactly one `src/pages/projects/[slug].astro`; every research entry through exactly one `src/pages/research/[slug].astro`. No per-page one-off markup. (Spec §5)
- **No React/Vue/UI framework.** Interactivity is vanilla TypeScript Astro islands only. (Spec §2)
- **No Tailwind.** Hand-authored CSS with `--token` custom properties, scoped per Astro component plus a shared `global.css`. (Spec §2, §11)
- **Dark mode is default**, set synchronously via a pre-paint inline script (reads `localStorage['theme']`) before first paint, first thing in `<head>` — this is a hard FOUC-prevention constraint carried over from `assets/js/main-theme.js` lines 1–10. (Spec §6)
- **Theme colors read from `documentElement[data-theme]`** wherever an island needs them (hero scene, charts) — never hardcode a light-only or dark-only color in an island.
- **Asset path discipline:** in the old site, root pages used `assets/...` and sub-pages used `../assets/...`. In Astro, all asset references use root-relative paths (e.g. `/assets/...` or imported modules) uniformly — this old footgun goes away by construction, but double-check no relative `../` paths leak into new templates.
- **Git commands in this worktree** must be prefixed with `/usr/bin/env` (e.g. `/usr/bin/env git add`, `/usr/bin/env git commit`) — a bare `git ...` is refused by a hook conflict between the RTK hook and the worktree-isolation guard. Every commit step in this plan already reflects this.
- **Working directory** for every task is the worktree root: `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/.claude/worktrees/astro-rebrand`. Never `cd` to the original repo root.
- **Never push or merge** without explicit user approval (user's global autonomy rules). The final task in this plan prepares a PR; it does not merge or switch live GitHub Pages settings.

---

## Reference material (read before starting)

- Current project-page wireframe, fully read: `projects/torch-inference.html` (223 lines) — hero (breadcrumb, tags, title, subtitle) → Overview (`proj-section`) → Features (`proj-feature-grid`, 6 `proj-feature-card`s: icon SVG, title, description) → Stack (`proj-tech-pills`) → CTA (`proj-cta`, GitHub link + "All Projects" link). Shared chrome: custom cursor, `scene-bg` canvas, `nav` (logo, links, theme toggle), `nav-overlay`, `footer`, mobile `bottom-nav`.
- Current research-page wireframe, structure extracted from `research/keynesian-abm-fiscal.html` (588 lines, shortest research page): hero (`circrna-hero`: title, summary highlights, 3 `hero-metric`s, actions) → `paper-meta-simple` (3 `meta-highlight`s, 3 `meta-detail`s, tags) → `#overview` mindmap section → `#abstract` (4 `abstract-item`s: label + text, e.g. Problem/Approach/Data/Key Result) → `#introduction` (prose + highlight callout) → `#methods` (timeline of `method-card`s: step badge, icon, title, tags) → `#results` (prose + highlight callouts) → `#discussion` (prose) → `#conclusion` (prose) → related-papers `cards` section → back-to-portfolio.
- `assets/js/data.js` (65 lines, fully read) — exact project/research list with `id`, `topic`, `tags`, `href`, `repo`; six topics: `ml`, `bio`, `fin`, `econ`, `infra`, `neuro`.
- `assets/js/main-theme.js` lines 1–10 — the pre-paint theme IIFE to reproduce exactly.
- `assets/js/hero-scene.js` lines 1–45 — dual-mode detection (`window.SITE_DATA` presence), Three.js r162 via jsdelivr ESM import, theme-color function reading `data-theme`.
- Research pages with a chart (5): `bitcoin-portfolio-allocation`, `crypto-stock-timing`, `global-gdp-patterns`, `grn-modular-vs-monolithic`, `keynesian-abm-coordination`.
- Research page with the SOM playground (1): `som-tsk` (shares `som-playground.js` with `projects/som-plus.html`).
- All other research pages (8) and project pages (9, excluding the `som-plus` playground page) have no page-specific script beyond nav/theme/hero-scene.

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore` (append `dist/`, `.astro/`, `node_modules/` if not already present), `src/pages/index.astro` (placeholder)

**Interfaces:**
- Produces: a working `npm run build` / `npm run dev` Astro project other tasks build on top of.

- [ ] **Step 1: Scaffold with the official CLI**

```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
```

Answer prompts if it falls back to interactive mode: template = minimal, TypeScript = strict, install deps = no (we'll install explicitly next), don't initialize git (this worktree already has a repo).

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Set the production site URL**

Edit `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://evintkoo.github.io',
  output: 'static',
});
```

- [ ] **Step 4: Verify the scaffold builds**

Run: `npm run build`
Expected: exits 0, produces `dist/index.html`.

- [ ] **Step 5: Commit**

```bash
/usr/bin/env git add package.json package-lock.json astro.config.mjs tsconfig.json src .gitignore
/usr/bin/env git commit -m "chore: scaffold Astro project"
```

---

### Task 2: Design tokens and global CSS ("Technical Editorial")

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`

**Interfaces:**
- Produces: CSS custom properties (`--ink`, `--paper`, `--accent`, `--space-*`, `--radius-*`, `--ease-*`, `--font-display`, `--font-body`, `--font-mono`) every later component/page imports via `global.css`.

- [ ] **Step 1: Write the token file**

```css
/* src/styles/tokens.css */
:root {
  /* Technical Editorial — light */
  --paper: #f7f6f3;
  --paper-raised: #ffffff;
  --ink: #14130f;
  --ink-soft: #4a483f;
  --ink-faint: #8a8779;
  --accent: #2952e3;        /* electric blue signal color */
  --accent-ink: #ffffff;
  --border: #e2e0d8;

  --font-display: 'Instrument Serif', serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-base: 200ms var(--ease-out);

  --max-width: 1200px;
}

:root[data-theme='dark'] {
  --paper: #0e0d0b;
  --paper-raised: #17160f;
  --ink: #f2f1ea;
  --ink-soft: #b8b6a8;
  --ink-faint: #6f6d61;
  --accent: #5b7fff;
  --accent-ink: #0e0d0b;
  --border: #2a2820;
}
```

- [ ] **Step 2: Write the global stylesheet**

```css
/* src/styles/global.css */
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  transition: background var(--transition-base), color var(--transition-base);
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.15;
  margin: 0;
}

a { color: inherit; }

.container {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--space-6);
}

@media (max-width: 767px) {
  .container { padding-inline: var(--space-4); }
}
```

- [ ] **Step 3: Verify tokens resolve**

Temporarily set `src/pages/index.astro` body style to `background: var(--paper)`, run `npm run dev`, confirm the page background renders paper color in both `?theme` states by toggling `<html data-theme="dark">` in devtools. Revert the temporary style after confirming.

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/styles
/usr/bin/env git commit -m "feat: add Technical Editorial design tokens and global styles"
```

---

### Task 3: Theme pre-paint script and ThemeToggle island

**Files:**
- Create: `src/islands/theme-toggle.ts`
- Test: manual (browser), per Step 4 below — no automated test framework exists in this project (matches current site's `AGENTS.md`: "no test suite")

**Interfaces:**
- Produces: `initThemeToggle(buttonEl: HTMLElement): void`, exported default, called by `Nav.astro`'s inline script. Also documents the pre-paint inline script literal used in `Layout.astro` (Task 4).

- [ ] **Step 1: Write the pre-paint script literal**

This exact script must be inlined (not a module import — it must block-execute before first paint) as the first thing in `Layout.astro`'s `<head>` in Task 4:

```html
<script is:inline>
  (function () {
    var saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  })();
</script>
```

- [ ] **Step 2: Write the toggle island**

```ts
// src/islands/theme-toggle.ts
export function initThemeToggle(button: HTMLElement): void {
  button.addEventListener('click', () => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // localStorage unavailable (private browsing) — theme still applies for this load
    }
  });
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build` — expected: exits 0 (island isn't wired to a page yet, this just checks the TS compiles).

- [ ] **Step 4: Manual browser check (after Task 4 wires it in)**

Defer verification of actual click behavior to Task 4's Step 5, since the button doesn't exist in the DOM until `Nav.astro` is written.

- [ ] **Step 5: Commit**

```bash
/usr/bin/env git add src/islands/theme-toggle.ts
/usr/bin/env git commit -m "feat: add theme pre-paint script and toggle island"
```

---

### Task 4: Layout, Nav, and Footer components

**Files:**
- Create: `src/components/Layout.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`

**Interfaces:**
- Consumes: `initThemeToggle` from `src/islands/theme-toggle.ts` (Task 3), tokens from `src/styles/global.css` (Task 2).
- Produces: `Layout.astro` props `{ title: string; description: string }`, wraps every page. `Nav.astro` and `Footer.astro` take no props (identical on every page, matching wireframe parity).

- [ ] **Step 1: Write `Footer.astro`**

Ported verbatim in content from `projects/torch-inference.html` lines 185–198:

```astro
---
---
<footer class="footer">
  <div class="container">
    <div class="footer__content">
      <p class="footer__text">Built with curiosity. Evint Leovonzko, 2025</p>
      <div class="footer__links">
        <a href="https://github.com/Evintkoo" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://www.linkedin.com/in/evint-leovonzko" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://www.instagram.com/evint_leo/" target="_blank" rel="noopener noreferrer">Instagram</a>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer { border-top: 1px solid var(--border); padding-block: var(--space-8); }
  .footer__content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4); }
  .footer__text { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-faint); margin: 0; }
  .footer__links { display: flex; gap: var(--space-6); }
  .footer__links a { font-family: var(--font-mono); font-size: 0.85rem; text-decoration: none; color: var(--ink-soft); }
  .footer__links a:hover { color: var(--accent); }
</style>
```

- [ ] **Step 2: Write `Nav.astro`**

Content/link structure ported from `projects/torch-inference.html` lines 29–66 and the mobile `bottom-nav` at lines 203–220 (wireframe parity — same 4 nav links, same theme toggle position, same bottom tab bar on mobile):

```astro
---
---
<nav class="nav">
  <div class="nav__container container">
    <a href="/" class="nav__logo">
      <span class="nav__logo-text">Evint Leovonzko</span>
    </a>
    <div class="nav__menu">
      <a href="/projects" class="nav__link">Projects</a>
      <a href="/research" class="nav__link">Research</a>
      <a href="/about" class="nav__link">About</a>
    </div>
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"></circle>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
      </svg>
    </button>
  </div>
</nav>

<nav class="bottom-nav" aria-label="Primary">
  <a href="/" class="bottom-nav__tab">Home</a>
  <a href="/projects" class="bottom-nav__tab">Projects</a>
  <a href="/research" class="bottom-nav__tab">Research</a>
  <a href="/about" class="bottom-nav__tab">About</a>
</nav>

<style>
  .nav { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--paper) 90%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); }
  .nav__container { display: flex; align-items: center; justify-content: space-between; padding-block: var(--space-4); }
  .nav__logo { text-decoration: none; font-family: var(--font-mono); font-weight: 600; color: var(--ink); }
  .nav__menu { display: flex; gap: var(--space-6); }
  .nav__link { text-decoration: none; color: var(--ink-soft); font-family: var(--font-mono); font-size: 0.9rem; }
  .nav__link:hover { color: var(--accent); }
  .theme-toggle { background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); width: 36px; height: 36px; display: grid; place-items: center; cursor: pointer; color: var(--ink); }
  .bottom-nav { display: none; }
  @media (max-width: 767px) {
    .nav__menu { display: none; }
    .bottom-nav {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
      background: var(--paper-raised); border-top: 1px solid var(--border);
      justify-content: space-around; padding-block: var(--space-2);
    }
    .bottom-nav__tab { text-decoration: none; color: var(--ink-soft); font-family: var(--font-mono); font-size: 0.75rem; }
  }
</style>

<script>
  import { initThemeToggle } from '../islands/theme-toggle';
  const btn = document.getElementById('themeToggle');
  if (btn) initThemeToggle(btn);
</script>
```

- [ ] **Step 3: Write `Layout.astro`**

```astro
---
import Nav from './Nav.astro';
import Footer from './Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <script is:inline>
    (function () {
      var saved = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
    })();
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body>
  <div class="scene-bg" aria-hidden="true"><canvas id="heroCanvas"></canvas></div>
  <Nav />
  <main>
    <slot />
  </main>
  <Footer />
</body>
</html>
```

- [ ] **Step 4: Wire into the placeholder homepage and verify build**

Edit `src/pages/index.astro`:

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Evint Leovonzko" description="Personal portfolio and research showcase.">
  <p class="container">Homepage placeholder.</p>
</Layout>
```

Run: `npm run build` — expected: exits 0.

- [ ] **Step 5: Manual browser verification**

Run `npm run dev`, open the page, click the theme toggle button, confirm `data-theme` flips on `<html>` and persists across reload (check `localStorage.theme`).

- [ ] **Step 6: Commit**

```bash
/usr/bin/env git add src/components src/pages/index.astro
/usr/bin/env git commit -m "feat: add Layout, Nav, and Footer components"
```

---

### Task 5: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a CI workflow other tasks don't depend on programmatically, but which must be present before the Cutover task (Task 34).

- [ ] **Step 1: Write the workflow**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))" `
Expected: no output, exit 0 (confirms valid YAML; the workflow itself only runs for real once pushed and Pages is switched to Actions per spec §7, done at Cutover).

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add .github/workflows/deploy.yml
/usr/bin/env git commit -m "ci: add GitHub Actions build and deploy workflow"
```

---

### Task 6: Content Collection schemas

**Files:**
- Create: `src/content/config.ts`

**Interfaces:**
- Produces: `projects` and `research` collections, typed schemas every content-migration task (Tasks 7+) must conform to.

- [ ] **Step 1: Write the schema**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const topic = z.enum(['ml', 'bio', 'fin', 'econ', 'infra', 'neuro']);

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    tags: z.array(z.string()),
    topic: topic.nullable(),
    tech: z.array(z.string()),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number(),
  }),
});

const research = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    tags: z.array(z.string()),
    topic,
    date: z.coerce.date(),
    metrics: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .default([]),
    pdf: z.string().url().optional(),
    externalLink: z.string().url().optional(),
    simpleSummary: z.string().optional(),
  }),
});

export const collections = { projects, research };
```

- [ ] **Step 2: Verify build**

Run: `npm run build` — expected: exits 0 (empty collections are valid until Task 7 adds entries).

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/content/config.ts
/usr/bin/env git commit -m "feat: define projects and research content collection schemas"
```

---

### Task 7: Migrate reference entries — torch-inference and keynesian-abm-fiscal

This is the reference migration every later content task (Tasks 15–16, 19–28) follows exactly. It is done in full detail here because these two pages anchor the "same standard" requirement from the user (torch-inference and kolosal-automl must be — and by construction now are — the same template).

**Files:**
- Create: `src/content/projects/torch-inference.mdx`
- Create: `src/content/research/keynesian-abm-fiscal.mdx`

**Interfaces:**
- Consumes: schema from Task 6.
- Produces: the frontmatter/body pattern documented below, reused by every subsequent content task.

- [ ] **Step 1: Migrate `torch-inference`**

Extract frontmatter directly from `projects/torch-inference.html`: title from `<h1 class="proj-hero__title">` (line 79), tagline from `<p class="proj-hero__subtitle">` (line 80), tags from `.proj-hero__tags` link text (line 76–77), tech from `.proj-tech-pills` link text (lines 157–162), repo from the GitHub CTA `href` (line 173), topic/order from `assets/js/data.js` line 20 (`topic: 'infra'`, this is the 2nd project entry so `order: 2`), `featured: false` (not marked `featured: true` in `data.js`).

Body: copy the Overview paragraphs (lines 93–94), the 6 feature cards' title+description pairs (lines 105–146, drop the inline SVGs — the template renders icons, Task 15/16 covers icon mapping) as an MDX list, verbatim, into `src/content/projects/torch-inference.mdx`:

```mdx
---
title: "PyTorch Inference Framework"
tagline: "Production-ready inference with TensorRT acceleration. Handles batching, model versioning, and GPU memory management. Built under Kolosal AI."
tags: ["Open Source", "Infrastructure"]
topic: "infra"
tech: ["PyTorch", "TensorRT", "FastAPI", "Docker", "CUDA", "Python"]
repo: "https://github.com/KolosalAI/torch-inference"
featured: false
order: 2
---

## Overview

Running PyTorch models in production is messy: GPU memory leaks, no batching, manual versioning, and no API layer. This framework wraps all of that into a clean, deployable service.

Built as part of the Kolosal AI open-source toolchain, it compiles models with TensorRT for maximum GPU throughput, exposes them via a FastAPI endpoint, and ships in Docker so deployment is a single command.

## Features

- **TensorRT Acceleration** — Compiles PyTorch models to TensorRT engines for maximum GPU throughput with minimal latency.
- **Dynamic Batching** — Automatically groups incoming requests into optimal batch sizes to saturate GPU compute.
- **Model Versioning** — Register and serve multiple model versions simultaneously, with instant rollback support.
- **GPU Memory Management** — Pools and recycles GPU memory across requests to prevent OOM errors under load.
- **FastAPI Endpoints** — Auto-generated REST API with async support, health checks, and OpenAPI docs.
- **Docker-ready** — Ships as a Docker image. Deploy to any GPU-enabled environment with a single command.
```

- [ ] **Step 2: Migrate `keynesian-abm-fiscal`**

Read `research/keynesian-abm-fiscal.html` in full (588 lines) and extract: title from `.circrna-title`, tagline/summary from `.circrna-summary`, the 3 hero metrics from `.hero-metric` elements into the `metrics` array, tags from `data.js` line 33 (`['Keynesian ABM', 'Monte Carlo', 'Rust']`), topic `econ`, date from the page's visible publish date (check `.meta-detail` elements), then copy the Abstract (4 items), Introduction, Methods (timeline steps with titles/tags), Results, Discussion, and Conclusion sections verbatim as MDX headings/prose in that exact order (matches the wireframe order documented in "Reference material" above):

```mdx
---
title: "Fiscal Stabilisers, Minsky Dynamics, and Distributional Outcomes in a Keynesian ABM"
tagline: "<verbatim from .circrna-summary>"
tags: ["Keynesian ABM", "Monte Carlo", "Rust"]
topic: "econ"
date: <verbatim date from .meta-detail>
metrics:
  - label: "<verbatim metric 1 label>"
    value: "<verbatim metric 1 value>"
  - label: "<verbatim metric 2 label>"
    value: "<verbatim metric 2 value>"
  - label: "<verbatim metric 3 label>"
    value: "<verbatim metric 3 value>"
---

## Abstract

**Problem** — <verbatim>

**Approach** — <verbatim>

**Data** — <verbatim>

**Key Result** — <verbatim>

## Introduction

<verbatim prose paragraphs, plus the highlight callout as a MDX blockquote>

## Methods

1. **<step 1 title>** — <verbatim> `tags: <verbatim method-tags>`
2. **<step 2 title>** — <verbatim>
3. **<step 3 title>** — <verbatim>
4. **<step 4 title>** — <verbatim>

## Results

<verbatim prose, highlight callouts as blockquotes>

## Discussion

<verbatim prose>

## Conclusion

<verbatim prose>
```

(The `<verbatim ...>` placeholders above mark exactly what to copy from the source file — they are not left in the final file; replace each with the actual text found at the cited location in `research/keynesian-abm-fiscal.html`.)

- [ ] **Step 3: Verify collections parse**

Run: `npm run build` — expected: exits 0, no Zod validation errors (confirms both entries satisfy the Task 6 schema).

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/content/projects/torch-inference.mdx src/content/research/keynesian-abm-fiscal.mdx
/usr/bin/env git commit -m "content: migrate reference entries (torch-inference, keynesian-abm-fiscal)"
```

---

### Task 8: Project detail template — `src/pages/projects/[slug].astro`

**Files:**
- Create: `src/pages/projects/[slug].astro`
- Create: `src/components/FeatureGrid.astro`, `src/components/TechPills.astro`, `src/components/ProjectCTA.astro`

**Interfaces:**
- Consumes: `projects` collection (Task 6/7), `Layout.astro` (Task 4).
- Produces: the one template every project page (Tasks 15–18) renders through. Verified against `torch-inference`.

- [ ] **Step 1: Write `getStaticPaths` and the template**

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../components/Layout.astro';
import FeatureGrid from '../../components/FeatureGrid.astro';
import TechPills from '../../components/TechPills.astro';
import ProjectCTA from '../../components/ProjectCTA.astro';

export async function getStaticPaths() {
  const entries = await getCollection('projects');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);
const { data } = entry;
---
<Layout title={`${data.title} | Evint Leovonzko`} description={data.tagline}>
  <section class="proj-hero container">
    <a href="/projects" class="proj-breadcrumb">Back to Portfolio</a>
    <div class="proj-hero__tags">
      {data.tags.map((t) => <a class="tag" href={`/projects?tag=${encodeURIComponent(t)}`}>{t}</a>)}
    </div>
    <h1>{data.title}</h1>
    <p class="proj-hero__subtitle">{data.tagline}</p>
  </section>

  <div class="proj-body container">
    <article class="proj-content">
      <Content />
    </article>
    <TechPills tech={data.tech} />
    <ProjectCTA repo={data.repo} demo={data.demo} />
  </div>
</Layout>

<style>
  .proj-hero { padding-block: var(--space-16) var(--space-8); }
  .proj-breadcrumb { font-family: var(--font-mono); font-size: 0.85rem; color: var(--ink-faint); text-decoration: none; }
  .proj-hero__tags { display: flex; gap: var(--space-2); margin-block: var(--space-4); }
  .tag { font-family: var(--font-mono); font-size: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2); text-decoration: none; color: var(--ink-soft); }
  .proj-hero__subtitle { color: var(--ink-soft); max-width: 640px; margin-top: var(--space-4); }
  .proj-body { padding-block: var(--space-8) var(--space-24); }
  .proj-content :global(h2) { margin-top: var(--space-12); font-size: 1.75rem; }
  .proj-content :global(ul) { padding-left: var(--space-6); }
</style>
```

- [ ] **Step 2: Write `FeatureGrid.astro`**

Renders an MDX `<ul>` of `**Title** — description` bullets (the pattern established in Task 7 Step 1) with card styling — takes no props, relies on `Content`'s own `<ul>`/`<li>` markup from the MDX body's Features section:

```astro
---
---
<style is:global>
  .proj-content ul { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); }
  .proj-content li { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); background: var(--paper-raised); }
</style>
```

(This is a global style hook, not a wrapper component with props — MDX content flows through `<Content />` directly, so `FeatureGrid.astro` only needs to exist as documented CSS scoping for the feature list produced by every project's MDX body.)

- [ ] **Step 3: Write `TechPills.astro`**

```astro
---
interface Props { tech: string[] }
const { tech } = Astro.props;
---
<div class="proj-tech-pills">
  {tech.map((t) => <a class="proj-tech-pill" href={`/projects?tag=${encodeURIComponent(t)}`}>{t}</a>)}
</div>
<style>
  .proj-tech-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-8); }
  .proj-tech-pill { font-family: var(--font-mono); font-size: 0.8rem; border: 1px solid var(--border); border-radius: 999px; padding: var(--space-1) var(--space-3); text-decoration: none; color: var(--ink-soft); }
</style>
```

- [ ] **Step 4: Write `ProjectCTA.astro`**

```astro
---
interface Props { repo?: string; demo?: string }
const { repo, demo } = Astro.props;
---
<div class="proj-cta">
  <div>
    <h3>See the code</h3>
    <p>Full source, docs, and usage examples on GitHub.</p>
  </div>
  <div class="proj-cta__actions">
    {repo && <a href={repo} target="_blank" rel="noopener noreferrer" class="btn btn--primary">View on GitHub</a>}
    {demo && <a href={demo} target="_blank" rel="noopener noreferrer" class="btn btn--secondary">Live demo</a>}
    <a href="/projects" class="btn btn--secondary">All Projects</a>
  </div>
</div>
<style>
  .proj-cta { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4); margin-top: var(--space-16); padding-top: var(--space-8); border-top: 1px solid var(--border); }
  .btn { display: inline-block; padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm); text-decoration: none; font-family: var(--font-mono); font-size: 0.85rem; }
  .btn--primary { background: var(--accent); color: var(--accent-ink); }
  .btn--secondary { border: 1px solid var(--border); color: var(--ink); }
</style>
```

- [ ] **Step 5: Build and verify the reference page renders**

Run: `npm run build`
Then: `npm run preview` and open `/projects/torch-inference/` — confirm hero title/subtitle/tags, all 6 feature cards, all 6 tech pills, and the GitHub CTA link (`https://github.com/KolosalAI/torch-inference`) all match `projects/torch-inference.html`'s content exactly (content-parity check for this one page — the full parity QA pass across all pages is Task 32).

- [ ] **Step 6: Commit**

```bash
/usr/bin/env git add src/pages/projects src/components/FeatureGrid.astro src/components/TechPills.astro src/components/ProjectCTA.astro
/usr/bin/env git commit -m "feat: add project detail template"
```

---

### Task 9: Research detail template — `src/pages/research/[slug].astro`

**Files:**
- Create: `src/pages/research/[slug].astro`
- Create: `src/components/ResearchHero.astro`

**Interfaces:**
- Consumes: `research` collection (Task 6/7), `Layout.astro` (Task 4).
- Produces: the one template every research page (Tasks 21–28) renders through. Verified against `keynesian-abm-fiscal`.

- [ ] **Step 1: Write `ResearchHero.astro`**

```astro
---
interface Props { title: string; tagline: string; metrics: { label: string; value: string }[] }
const { title, tagline, metrics } = Astro.props;
---
<section class="research-hero container">
  <h1>{title}</h1>
  <p class="research-hero__tagline">{tagline}</p>
  {metrics.length > 0 && (
    <div class="research-hero__metrics">
      {metrics.map((m) => (
        <div class="hero-metric">
          <span class="hero-metric__value">{m.value}</span>
          <span class="hero-metric__label">{m.label}</span>
        </div>
      ))}
    </div>
  )}
</section>
<style>
  .research-hero { padding-block: var(--space-16) var(--space-8); }
  .research-hero__tagline { color: var(--ink-soft); max-width: 700px; margin-top: var(--space-4); }
  .research-hero__metrics { display: flex; gap: var(--space-8); margin-top: var(--space-8); }
  .hero-metric { display: flex; flex-direction: column; }
  .hero-metric__value { font-family: var(--font-display); font-size: 2rem; }
  .hero-metric__label { font-family: var(--font-mono); font-size: 0.75rem; color: var(--ink-faint); }
</style>
```

- [ ] **Step 2: Write the template**

```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../components/Layout.astro';
import ResearchHero from '../../components/ResearchHero.astro';

export async function getStaticPaths() {
  const entries = await getCollection('research');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const { data } = entry;
---
<Layout title={`${data.title} | Evint Leovonzko`} description={data.tagline}>
  <ResearchHero title={data.title} tagline={data.tagline} metrics={data.metrics} />
  <div class="research-body container">
    <div class="research-tags">
      {data.tags.map((t) => <span class="tag">{t}</span>)}
    </div>
    <article class="research-content">
      <Content />
    </article>
    <a href="/research" class="back-to-portfolio">Back to Research</a>
  </div>
</Layout>

<style>
  .research-body { padding-block: var(--space-8) var(--space-24); }
  .research-tags { display: flex; gap: var(--space-2); margin-bottom: var(--space-8); }
  .research-content :global(h2) { margin-top: var(--space-16); font-size: 1.75rem; border-top: 1px solid var(--border); padding-top: var(--space-8); }
  .back-to-portfolio { display: inline-block; margin-top: var(--space-16); font-family: var(--font-mono); text-decoration: none; color: var(--ink-soft); }
</style>
```

- [ ] **Step 3: Build and verify the reference page renders**

Run: `npm run build`, `npm run preview`, open `/research/keynesian-abm-fiscal/` — confirm title, tagline, 3 metrics, tags, and all 6 sections (Abstract → Introduction → Methods → Results → Discussion → Conclusion) appear in that order, matching `research/keynesian-abm-fiscal.html`.

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/pages/research src/components/ResearchHero.astro
/usr/bin/env git commit -m "feat: add research detail template"
```

---

### Task 10: Hero scene island — legacy blob mode

**Files:**
- Create: `src/islands/hero-scene.ts`

**Interfaces:**
- Produces: default export `initHeroScene(canvas: HTMLCanvasElement, graphData?: GraphData): void`, where `GraphData` is defined in this file and consumed by Task 11 (graph mode).
- Consumes: none yet (graph mode wiring is Task 11).

- [ ] **Step 1: Port the existing blob-mode logic**

Copy `assets/js/hero-scene.js` into `src/islands/hero-scene.ts` in full. Required changes only (preserve all rendering/physics/animation logic byte-for-byte otherwise):

1. Wrap the file's top-level IIFE body in `export function initHeroScene(canvas: HTMLCanvasElement, graphData?: GraphData) { ... }` — replace `document.getElementById('heroCanvas')` + its `if (!canvas) return;` guard with the `canvas` parameter (caller already guarantees it exists).
2. Replace `window.SITE_DATA` references with the `graphData` parameter — `hasGraphData = !!graphData`.
3. Add TypeScript types for the `GraphData` shape: `export interface GraphData { projects: Array<{ id: string; label: string; topic: string | null; href: string }>; research: Array<{ id: string; label: string; topic: string; href: string }>; }`.
4. Keep the `THREE` import as the CDN ESM import (`https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js`) — do not switch to an npm-installed Three.js; this matches the existing constraint (spec §6) and avoids a bundling change that risks altering visual output.

- [ ] **Step 2: Wire blob mode into `Layout.astro`**

Add to `Layout.astro`'s bottom (after `<Footer />`):

```astro
<script>
  import { initHeroScene } from '../islands/hero-scene';
  const canvas = document.getElementById('heroCanvas') as HTMLCanvasElement | null;
  if (canvas) initHeroScene(canvas);
</script>
```

- [ ] **Step 3: Verify build and visual behavior**

Run: `npm run build` — expected: exits 0.
Run: `npm run preview`, open `/projects/torch-inference/` (a non-homepage page) — confirm the morphing wireframe blob renders behind the content, matches the current site's legacy-blob look (compare against the live behavior of `projects/torch-inference.html` open in a second tab).

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/islands/hero-scene.ts src/components/Layout.astro
/usr/bin/env git commit -m "feat: add hero scene island (legacy blob mode)"
```

---

### Task 11: Hero scene graph mode and homepage

**Files:**
- Modify: `src/islands/hero-scene.ts` (already handles `graphData` per Task 10 — this task supplies real data)
- Create: `src/pages/index.astro` (replaces the Task 4 placeholder)

**Interfaces:**
- Consumes: `initHeroScene`, `GraphData` (Task 10); `projects`/`research` collections (Task 6).
- Produces: the homepage. No later task depends on this one beyond the QA pass.

- [ ] **Step 1: Write the homepage, passing collection data into the island as JSON**

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../components/Layout.astro';

const projects = await getCollection('projects');
const research = await getCollection('research');

const graphData = {
  projects: projects.map((p) => ({ id: p.id, label: p.data.title, topic: p.data.topic, href: `/projects/${p.id}/` })),
  research: research.map((r) => ({ id: r.id, label: r.data.title, topic: r.data.topic, href: `/research/${r.id}/` })),
};

const featured = projects.filter((p) => p.data.featured).concat(projects).slice(0, 6);
---
<Layout title="Evint Leovonzko" description="Personal portfolio and research showcase — ML infrastructure, computational biology, and quantitative finance.">
  <section class="hero container">
    <h1>Evint Leovonzko</h1>
    <p>Founder of Kolosal AI. Independent quant researcher.</p>
  </section>

  <section class="container">
    <h2>Featured projects</h2>
    <ul class="project-list">
      {featured.map((p) => (
        <li><a href={`/projects/${p.id}/`}>{p.data.title}</a><p>{p.data.tagline}</p></li>
      ))}
    </ul>
  </section>

  <script type="application/json" id="graph-data" set:html={JSON.stringify(graphData)} />
</Layout>

<style>
  .hero { padding-block: var(--space-24) var(--space-12); }
  .project-list { list-style: none; padding: 0; display: grid; gap: var(--space-6); }
</style>
```

- [ ] **Step 2: Read the embedded JSON in the hero-scene init script**

Modify `Layout.astro`'s hero-scene wiring script (added in Task 10 Step 2) to read the graph data if present on the page:

```astro
<script>
  import { initHeroScene } from '../islands/hero-scene';
  const canvas = document.getElementById('heroCanvas') as HTMLCanvasElement | null;
  const graphEl = document.getElementById('graph-data');
  const graphData = graphEl ? JSON.parse(graphEl.textContent || '{}') : undefined;
  if (canvas) initHeroScene(canvas, graphData);
</script>
```

- [ ] **Step 3: Verify dual-mode constraint holds**

Run: `npm run build && npm run preview`. Open `/` — confirm the graph mode (topic/article node graph) renders, not the blob. Open `/projects/torch-inference/` again — confirm it still shows the legacy blob, unchanged from Task 10. This is the hard constraint from spec §6/AGENTS.md #2: graph mode must never leak onto non-homepage pages.

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/pages/index.astro src/components/Layout.astro
/usr/bin/env git commit -m "feat: wire hero graph mode into homepage"
```

---

### Task 12: Mindmap island (per-research-page topic graph)

**Files:**
- Create: `src/islands/mindmap.ts`

**Interfaces:**
- Consumes: `research`/`projects` collection data (topic taxonomy), passed as props from the research template.
- Produces: `initMindmap(container: HTMLElement, data: MindmapData): void`, consumed by Task 9's template (this task retrofits an `#overview` mindmap section into it) and every research content migration.

- [ ] **Step 1: Port `assets/js/mindmap.js`**

Read `assets/js/mindmap.js` in full, then port into `src/islands/mindmap.ts` with the same required-changes pattern as Task 10: wrap in `export function initMindmap(container: HTMLElement, data: MindmapData)`, replace any `window.MINDMAP_DATA` read with the `data` parameter, add TS types matching the `{ center: string; branches: { label: string; nodes: string[] }[] }` shape built by the old `data.js`'s `buildMindmap()` (spec §4 — this replaces that function; the shape is now computed server-side in Step 2 below instead of client-side).

- [ ] **Step 2: Add an `#overview` section to the research template**

Modify `src/pages/research/[slug].astro` (Task 9): compute `mindmapData` server-side from the full `projects`+`research` collections (mirroring the old `buildMindmap()` logic — group by `topic`, six branches from the `topic` enum, filter empty branches), embed as `<script type="application/json" id="mindmap-data">`, add:

```astro
<section id="overview" class="mindmap-section container">
  <div id="mindmapContainer"></div>
</section>
<script>
  import { initMindmap } from '../../islands/mindmap';
  const el = document.getElementById('mindmapContainer');
  const dataEl = document.getElementById('mindmap-data');
  if (el && dataEl) initMindmap(el, JSON.parse(dataEl.textContent || '{}'));
</script>
```

placed immediately after `<ResearchHero />` and before the tags/content article (matches the wireframe order documented in "Reference material": hero → `#overview` mindmap → abstract → ...).

- [ ] **Step 3: Verify**

Run: `npm run build && npm run preview`, open `/research/keynesian-abm-fiscal/`, confirm a topic mindmap renders in the Overview section, matching the current page's mindmap.

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/islands/mindmap.ts src/pages/research/[slug].astro
/usr/bin/env git commit -m "feat: add per-page topic mindmap island"
```

---

### Task 13: Related-papers computation

**Files:**
- Create: `src/lib/related-research.ts`
- Modify: `src/pages/research/[slug].astro`

**Interfaces:**
- Produces: `getRelatedResearch(current: CollectionEntry<'research'>, all: CollectionEntry<'research'>[], limit = 3): CollectionEntry<'research'>[]`, consumed by the research template.

- [ ] **Step 1: Write the ranking function**

Replaces the hand-maintained `PAPERS` array in `assets/js/research-recommendations.js` (spec §4) with a computed ranking: entries sharing more tags/topic rank higher.

```ts
// src/lib/related-research.ts
import type { CollectionEntry } from 'astro:content';

export function getRelatedResearch(
  current: CollectionEntry<'research'>,
  all: CollectionEntry<'research'>[],
  limit = 3
): CollectionEntry<'research'>[] {
  const currentTags = new Set(current.data.tags);
  return all
    .filter((r) => r.id !== current.id)
    .map((r) => {
      const sharedTags = r.data.tags.filter((t) => currentTags.has(t)).length;
      const sameTopic = r.data.topic === current.data.topic ? 1 : 0;
      return { entry: r, score: sharedTags * 2 + sameTopic };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}
```

- [ ] **Step 2: Wire into the template**

Modify `src/pages/research/[slug].astro`: fetch `getCollection('research')`, call `getRelatedResearch(entry, allResearch)`, render a "Related papers" `<section class="cards">` (matching the wireframe's final content section, before "back-to-portfolio") with each related entry's title/tagline linking to `/research/${id}/`.

- [ ] **Step 3: Verify**

Run: `npm run build && npm run preview`, open `/research/keynesian-abm-fiscal/`, confirm 3 related papers render, and they share tags/topic with the current entry (sanity check by reading the rendered titles against `data.js`'s tag lists).

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/lib/related-research.ts src/pages/research/[slug].astro
/usr/bin/env git commit -m "feat: compute related papers from shared tags/topic"
```

---

### Task 14: Caveman ("Simple mode") island

**Files:**
- Create: `src/islands/caveman-mode.ts`
- Modify: `src/components/Layout.astro`, `src/pages/research/[slug].astro`

**Interfaces:**
- Produces: `initCavemanToggle(button: HTMLElement): void`, and documents the pre-paint inline script pattern (same FOUC-avoidance approach as Task 3's theme script).

- [ ] **Step 1: Write the pre-paint script**

Add to `Layout.astro`'s `<head>`, immediately after the theme pre-paint script from Task 4:

```html
<script is:inline>
  (function () {
    if (localStorage.getItem('caveman') === 'true') {
      document.documentElement.classList.add('caveman');
    }
  })();
</script>
```

- [ ] **Step 2: Write the toggle island**

```ts
// src/islands/caveman-mode.ts
export function initCavemanToggle(button: HTMLElement): void {
  button.addEventListener('click', () => {
    const html = document.documentElement;
    const next = !html.classList.contains('caveman');
    html.classList.toggle('caveman', next);
    try {
      localStorage.setItem('caveman', String(next));
    } catch {
      // localStorage unavailable — toggle still applies for this load
    }
  });
}
```

- [ ] **Step 3: Add the toggle button and `simpleSummary` rendering to the research template**

Modify `src/pages/research/[slug].astro`: add a toggle button near the tags row, and — where `data.simpleSummary` is set — render it as an alternate abstract shown only when `.caveman` is active (CSS: `.research-content { display: block } html.caveman .research-content { display: none } html.caveman .simple-summary { display: block }`, and vice versa for the default state).

- [ ] **Step 4: Add `simpleSummary` to the reference entry**

Modify `src/content/research/keynesian-abm-fiscal.mdx` (Task 7): read the current site's caveman-mode rewrite for this page (check `research/keynesian-abm-fiscal.html` for a `data-caveman` or `.caveman-text` block, or inspect `assets/js/animations.js`'s per-paper caveman classes for this page's plain-English text) and add it as `simpleSummary: "<verbatim>"` frontmatter.

- [ ] **Step 5: Verify**

Run: `npm run build && npm run preview`, open `/research/keynesian-abm-fiscal/`, click the simple-mode toggle, confirm the plain-English summary replaces the formal content, and reload confirms it persisted via `localStorage`.

- [ ] **Step 6: Commit**

```bash
/usr/bin/env git add src/islands/caveman-mode.ts src/components/Layout.astro src/pages/research/[slug].astro src/content/research/keynesian-abm-fiscal.mdx
/usr/bin/env git commit -m "feat: add caveman/simple-mode toggle island"
```

---

### Task 15: Index pages — projects and research listings, and About page

**Files:**
- Create: `src/pages/projects/index.astro`, `src/pages/research/index.astro`, `src/pages/about.astro`

**Interfaces:**
- Consumes: `projects`/`research` collections.

- [ ] **Step 1: Write `src/pages/projects/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../components/Layout.astro';

const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
---
<Layout title="Projects | Evint Leovonzko" description="Open-source tools and applications.">
  <section class="container">
    <h1>Projects</h1>
    <ul class="project-grid">
      {projects.map((p) => (
        <li>
          <a href={`/projects/${p.id}/`}>
            <h2>{p.data.title}</h2>
            <p>{p.data.tagline}</p>
          </a>
        </li>
      ))}
    </ul>
  </section>
</Layout>
<style>
  .project-grid { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6); }
  .project-grid a { text-decoration: none; color: inherit; display: block; border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6); }
</style>
```

- [ ] **Step 2: Write `src/pages/research/index.astro`**

Same pattern as Step 1, sourced from the `research` collection, sorted by `date` descending, linking to `/research/${id}/`.

- [ ] **Step 3: Write `src/pages/about.astro`**

Read `about.html` in full and migrate its body content verbatim into this page using the same `<Layout>` wrapper pattern as other pages — preserve section order and all prose exactly (content parity, spec §11).

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`, open `/projects/`, `/research/`, `/about/` — confirm all entries list correctly and links resolve to real detail pages.

- [ ] **Step 5: Commit**

```bash
/usr/bin/env git add src/pages/projects/index.astro src/pages/research/index.astro src/pages/about.astro
/usr/bin/env git commit -m "feat: add projects/research index pages and about page"
```

---

### Task 16: Migrate kolosal-automl

The second page the user explicitly named — must match `torch-inference`'s template exactly (Task 8).

**Files:**
- Create: `src/content/projects/kolosal-automl.mdx`

- [ ] **Step 1: Extract and migrate**

Read `projects/kolosal-automl.html` in full. Following the exact pattern from Task 7 Step 1 (same frontmatter fields, same Overview/Features/Stack MDX body structure), extract: title, tagline, tags, tech, repo (`data.js` line 21: `KolosalAI/kolosal_automl`, `topic: 'infra'`, `order: 3`), and copy the Overview paragraphs and all feature cards' title+description verbatim.

- [ ] **Step 2: Verify against the shared template**

Run: `npm run build && npm run preview`, open `/projects/kolosal-automl/`, confirm it renders through the same `[slug].astro` template as `/projects/torch-inference/` with correct content — same hero/overview/features/stack/CTA structure, different data. This is the literal fulfillment of "torch inference and automl as the same standard."

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/content/projects/kolosal-automl.mdx
/usr/bin/env git commit -m "content: migrate kolosal-automl project page"
```

---

### Task 17: Migrate plain project pages (apt-fitness, chain-reaction-simulation, faction-app, tribe-playground)

**Files:**
- Create: `src/content/projects/apt-fitness.mdx`, `src/content/projects/chain-reaction-simulation.mdx`, `src/content/projects/faction-app.mdx`, `src/content/projects/tribe-playground.mdx`

- [ ] **Step 1: Migrate each, following the Task 7/16 pattern**

For each of the 4 files: read the corresponding `projects/<slug>.html` in full, extract frontmatter (title/tagline/tags/tech/repo from the page + matching `data.js` entry for `topic`/`order` — `apt-fitness`: topic `null`, `chain-reaction-simulation`(`id: chain-reaction`): topic `null`, `faction-app`(`id: faction`): topic `fin`, `tribe-playground`(`id: tribe`): topic `neuro`), copy Overview/Features/Stack body content verbatim in MDX.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run preview`, open all 4 pages, confirm each renders through `[slug].astro` with correct, complete content matching its source HTML.

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/content/projects/apt-fitness.mdx src/content/projects/chain-reaction-simulation.mdx src/content/projects/faction-app.mdx src/content/projects/tribe-playground.mdx
/usr/bin/env git commit -m "content: migrate apt-fitness, chain-reaction-simulation, faction-app, tribe-playground"
```

---

### Task 18: Migrate plain project pages (orderflow-rs, psychidn, rebirth)

**Files:**
- Create: `src/content/projects/orderflow-rs.mdx`, `src/content/projects/psychidn.mdx`, `src/content/projects/rebirth.mdx`

- [ ] **Step 1: Migrate each, following the Task 7/16 pattern**

`orderflow-rs`: topic `fin`. `psychidn`: topic `null` (no repo in `data.js`, so omit `repo` field — `ProjectCTA.astro`'s Task 8 conditional already handles a missing `repo`). `rebirth`: topic `null`, no repo.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run preview`, open all 3 pages, confirm correct rendering. For `psychidn` and `rebirth` specifically, confirm the CTA section gracefully omits the "View on GitHub" button (no repo) and still shows "All Projects".

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/content/projects/orderflow-rs.mdx src/content/projects/psychidn.mdx src/content/projects/rebirth.mdx
/usr/bin/env git commit -m "content: migrate orderflow-rs, psychidn, rebirth"
```

---

### Task 19: SOM playground island and som-plus project migration

**Files:**
- Create: `src/islands/som-playground.ts`, `src/content/projects/som-plus.mdx`
- Modify: `src/pages/projects/[slug].astro`

**Interfaces:**
- Produces: `initSomPlayground(container: HTMLElement): void`, also consumed by Task 26 (`som-tsk` research page).

- [ ] **Step 1: Port `assets/js/som-playground.js`**

Read the file in full, port into `src/islands/som-playground.ts` with the same pattern as Task 10: wrap in `export function initSomPlayground(container: HTMLElement)`, replace direct `document.getElementById` calls for its canvas/controls with `container.querySelector(...)`, add TS types for its internal state. Preserve all clustering-demo logic unchanged.

- [ ] **Step 2: Migrate `som-plus` content**

Read `projects/som-plus.html` in full. Follow the Task 7/16 pattern for frontmatter (topic `ml`, `order: 4`) and the Overview/Features/Stack sections, but also note the extra `.pg` playground section (lines identified via the earlier structural grep) — its markup is NOT part of the MDX body; it's added as a fixed block in the template (Step 3).

- [ ] **Step 3: Add a conditional playground slot to the project template**

Modify `src/pages/projects/[slug].astro`: add `hasPlayground: z.boolean().default(false)` to the `projects` schema in `src/content/config.ts`, set it `true` in `som-plus.mdx`'s frontmatter, and conditionally render:

```astro
{data.hasPlayground && (
  <div class="pg" id="somPlayground"></div>
  <script>
    import { initSomPlayground } from '../../islands/som-playground';
    const el = document.getElementById('somPlayground');
    if (el) initSomPlayground(el);
  </script>
)}
```

placed after the `<Content />` article, before `<TechPills>` (matches wireframe order from the original structural grep: Overview → Features → playground → Stack section... verify exact position against `projects/som-plus.html`'s actual DOM order before finalizing placement).

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`, open `/projects/som-plus/`, confirm the SOM clustering playground renders and its controls are interactive (add points, run clustering), matching `projects/som-plus.html`'s current behavior.

- [ ] **Step 5: Commit**

```bash
/usr/bin/env git add src/islands/som-playground.ts src/content/projects/som-plus.mdx src/pages/projects/[slug].astro src/content/config.ts
/usr/bin/env git commit -m "feat: add SOM playground island, migrate som-plus"
```

---

### Task 20: Research chart island

**Files:**
- Create: `src/islands/research-chart.ts`

**Interfaces:**
- Produces: `initResearchChart(container: HTMLElement, config: unknown): void` — exact `config` type determined by Step 1 below.

- [ ] **Step 1: Read `assets/js/chart.js` in full and determine its approach**

Confirm whether it hand-rolls canvas drawing or wraps a library (per spec §6, this was left open pending inspection). Document the finding as a one-line comment at the top of the new file.

- [ ] **Step 2: Port it**

Port into `src/islands/research-chart.ts` following the Task 10 pattern: wrap in `export function initResearchChart(container: HTMLElement, config: <inferred type>)`, replace global DOM queries with `container`-scoped ones, add TS types for whatever config shape the original file expects (read from how the 5 chart-using pages invoke it in their inline `<script>` blocks).

- [ ] **Step 3: Verify build**

Run: `npm run build` — expected: exits 0. Full visual verification happens per-page in Tasks 22 and 23 once real chart data is wired in.

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/islands/research-chart.ts
/usr/bin/env git commit -m "feat: add research chart island"
```

---

### Task 21: Migrate plain research pages (circular-rna, grasp, grn-dual-vs-cross-encoder)

**Files:**
- Create: `src/content/research/circular-rna.mdx`, `src/content/research/grasp.mdx`, `src/content/research/grn-dual-vs-cross-encoder.mdx`

- [ ] **Step 1: Migrate each, following the Task 7 Step 2 pattern**

For each: read the source HTML in full, extract frontmatter (title, tagline, metrics, tags/topic from `data.js` — `circular-rna`: `bio`; `grasp`: `ml`; `grn-dual-vs-cross-encoder`(`id: grn-dual-vs-cross`): `bio`), copy Abstract/Introduction/Methods/Results/Discussion/Conclusion verbatim in MDX, and `simpleSummary` from the page's caveman-mode text (per Task 14 Step 4's approach).

- [ ] **Step 2: Verify**

Run: `npm run build && npm run preview`, open all 3 pages, confirm full section-by-section content match against their source HTML, mindmap renders, related papers render, caveman toggle works.

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/content/research/circular-rna.mdx src/content/research/grasp.mdx src/content/research/grn-dual-vs-cross-encoder.mdx
/usr/bin/env git commit -m "content: migrate circular-rna, grasp, grn-dual-vs-cross-encoder"
```

---

### Task 22: Migrate plain research pages (grn-two-tower, neuron-activation-analysis, p53-mutation, functional-group-analysis)

**Files:**
- Create: `src/content/research/grn-two-tower.mdx`, `src/content/research/neuron-activation-analysis.mdx`, `src/content/research/p53-mutation.mdx`, `src/content/research/functional-group-analysis.mdx`

- [ ] **Step 1: Migrate each, following the Task 7 Step 2 pattern**

Topics from `data.js`: `grn-two-tower`: `bio`; `neuron-activation-analysis`(`id: neuron-activation`): `neuro`; `p53-mutation`: `bio`; `functional-group-analysis`(`id: functional-group`): `ml`. `functional-group-analysis.html` is the largest of this group (1143 lines) — read it fully and budget extra care in copying its Methods timeline (likely more steps than the 4-step reference).

- [ ] **Step 2: Verify**

Run: `npm run build && npm run preview`, open all 4 pages, confirm full content parity, mindmap, related papers, caveman toggle.

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/content/research/grn-two-tower.mdx src/content/research/neuron-activation-analysis.mdx src/content/research/p53-mutation.mdx src/content/research/functional-group-analysis.mdx
/usr/bin/env git commit -m "content: migrate grn-two-tower, neuron-activation-analysis, p53-mutation, functional-group-analysis"
```

---

### Task 23: Add chart rendering to the research template, migrate bitcoin-portfolio-allocation and crypto-stock-timing

**Files:**
- Create: `src/content/research/bitcoin-portfolio-allocation.mdx`, `src/content/research/crypto-stock-timing.mdx`
- Modify: `src/pages/research/[slug].astro`, `src/content/config.ts`

**Interfaces:**
- Consumes: `initResearchChart` (Task 20).

- [ ] **Step 1: Add chart config to the schema**

Add to `research` schema in `src/content/config.ts`: `chart: z.unknown().optional()` (typed to whatever concrete shape Task 20 Step 2 determined — replace `z.unknown()` with the real Zod shape once known).

- [ ] **Step 2: Wire chart rendering into the template**

Modify `src/pages/research/[slug].astro`: where `data.chart` is set, render a chart container + inline script invoking `initResearchChart`, positioned in the Results section (verify exact position against the source pages' DOM — charts typically sit inside `#results`).

- [ ] **Step 3: Migrate both entries**

Read `research/bitcoin-portfolio-allocation.html` (1378 lines — the largest page in the site; budget real time here) and `research/crypto-stock-timing.html` (851 lines) in full. Both are `topic: 'fin'`. Follow the Task 7 Step 2 pattern for all sections, plus extract the chart's data/config from each page's inline chart-init script into the `chart` frontmatter field.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`, open both pages, confirm all sections match source content, and the chart renders with correct data (visually compare against the live old page).

- [ ] **Step 5: Commit**

```bash
/usr/bin/env git add src/content/config.ts src/pages/research/[slug].astro src/content/research/bitcoin-portfolio-allocation.mdx src/content/research/crypto-stock-timing.mdx
/usr/bin/env git commit -m "feat: wire chart rendering into research template, migrate bitcoin-portfolio-allocation and crypto-stock-timing"
```

---

### Task 24: Migrate remaining chart research pages (global-gdp-patterns, grn-modular-vs-monolithic, keynesian-abm-coordination)

**Files:**
- Create: `src/content/research/global-gdp-patterns.mdx`, `src/content/research/grn-modular-vs-monolithic.mdx`, `src/content/research/keynesian-abm-coordination.mdx`

- [ ] **Step 1: Migrate each, following Task 23's pattern**

Topics: `global-gdp-patterns`(`id: global-gdp`): `econ`; `grn-modular-vs-monolithic`(`id: grn-modular`): `bio`; `keynesian-abm-coordination`: `econ`. Read each source file in full, extract all sections plus chart config.

- [ ] **Step 2: Verify**

Run: `npm run build && npm run preview`, open all 3 pages, confirm content and chart parity against source.

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/content/research/global-gdp-patterns.mdx src/content/research/grn-modular-vs-monolithic.mdx src/content/research/keynesian-abm-coordination.mdx
/usr/bin/env git commit -m "content: migrate global-gdp-patterns, grn-modular-vs-monolithic, keynesian-abm-coordination"
```

---

### Task 25: Migrate som-tsk (research page using the SOM playground island)

**Files:**
- Create: `src/content/research/som-tsk.mdx`
- Modify: `src/pages/research/[slug].astro`, `src/content/config.ts`

- [ ] **Step 1: Add the playground flag to the research schema**

Add `hasPlayground: z.boolean().default(false)` to the `research` schema (same field name/pattern as the `projects` schema in Task 19 Step 3, for consistency).

- [ ] **Step 2: Wire the playground into the research template**

Modify `src/pages/research/[slug].astro`: same conditional block pattern as Task 19 Step 3, reusing `initSomPlayground` from `src/islands/som-playground.ts` — position matches `research/som-tsk.html`'s actual DOM location (verify against the source file; likely inside or near Methods/Results).

- [ ] **Step 3: Migrate content**

Read `research/som-tsk.html` (706 lines) in full, topic `ml`, `hasPlayground: true`, follow the Task 7 Step 2 pattern for all sections.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`, open `/research/som-tsk/`, confirm all content sections and the interactive SOM playground both render and work.

- [ ] **Step 5: Commit**

```bash
/usr/bin/env git add src/content/config.ts src/pages/research/[slug].astro src/content/research/som-tsk.mdx
/usr/bin/env git commit -m "content: migrate som-tsk with SOM playground"
```

---

### Task 26: GitHub activity feed island

**Files:**
- Create: `src/islands/activity-feed.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces: `initActivityFeed(container: HTMLElement, username: string): void`.

- [ ] **Step 1: Port `assets/js/activity-feed.js`**

Read the file in full, port into `src/islands/activity-feed.ts` with the Task 10 pattern: wrap in `export function initActivityFeed(container: HTMLElement, username: string)`, replace hardcoded GitHub username/DOM queries with the parameter/`container`-scoped queries, add TS types for the GitHub API response fields actually used.

- [ ] **Step 2: Wire into homepage**

Modify `src/pages/index.astro`: add `<div id="activityFeed"></div>` in a new "Recent activity" section, with an inline script calling `initActivityFeed(el, 'Evintkoo')` (username per the user's GitHub links in `Footer.astro`).

- [ ] **Step 3: Verify**

Run: `npm run build && npm run preview`, open `/`, confirm recent GitHub activity loads and renders (network tab shows a request to the GitHub API).

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add src/islands/activity-feed.ts src/pages/index.astro
/usr/bin/env git commit -m "feat: add GitHub activity feed island to homepage"
```

---

### Task 27: Responsive pass

**Files:**
- Modify: `src/styles/global.css`, `src/components/Nav.astro`, `src/components/Layout.astro`, `src/pages/projects/[slug].astro`, `src/pages/research/[slug].astro`, `src/pages/index.astro`

- [ ] **Step 1: Audit every template against the existing breakpoints**

The current site uses 1023px, 767px, 639px, 479px (spec §5/AGENTS.md). For each template file listed above, add/verify `@media` rules at these exact breakpoints covering: nav collapse to bottom-tab-bar (already done in Task 4, re-verify), hero type-scale reduction, feature-grid/project-grid column collapse to 1 column below 639px, metric row wrapping below 479px.

- [ ] **Step 2: Manual verification at each breakpoint**

Run `npm run dev`, use browser devtools responsive mode at exactly 1023px, 767px, 639px, and 479px widths, on `/`, `/projects/torch-inference/`, and `/research/keynesian-abm-fiscal/`. Confirm no horizontal overflow, nav switches to bottom-tab-bar below 767px, grids collapse appropriately.

- [ ] **Step 3: Commit**

```bash
/usr/bin/env git add src/styles src/components src/pages
/usr/bin/env git commit -m "fix: responsive pass at 1023/767/639/479 breakpoints"
```

---

### Task 28: Remove legacy static files

**Files:**
- Delete: `index.html`, `about.html`, `projects.html`, `research.html`, `projects/*.html`, `research/*.html`, `assets/css/*`, `assets/js/*` (excluding anything still referenced, none expected after this migration), `graphify-out/` references if hardcoded anywhere (it's gitignored, per AGENTS.md #3 — confirm nothing in `src/` references it)

- [ ] **Step 1: Confirm nothing in `src/` still references the legacy files**

Run: `grep -rn "assets/css\|assets/js\|\.html\"" src/ --include="*.astro" --include="*.ts" | grep -v "node_modules"`
Expected: no matches referencing the old root-level HTML files or the old `assets/css`/`assets/js` paths (Astro's own asset handling in `src/styles`/`src/islands` is unrelated and expected to appear if the grep pattern is too broad — review each hit).

- [ ] **Step 2: Delete the legacy files**

```bash
/usr/bin/env git rm index.html about.html projects.html research.html
/usr/bin/env git rm -r projects/*.html research/*.html
/usr/bin/env git rm -r assets/css assets/js
```

(Use `git rm` — not plain `rm` — so the deletion is staged correctly.)

- [ ] **Step 3: Verify the build still succeeds with legacy files gone**

Run: `npm run build` — expected: exits 0, `dist/` contains only Astro-generated output.

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git commit -m "chore: remove legacy static HTML/CSS/JS superseded by Astro rewrite"
```

---

### Task 29: Content and wireframe parity QA pass

**Files:** none created — this is a verification task with a written checklist artifact.

**Files:**
- Create: `docs/superpowers/plans/2026-09-16-astro-rebrand-qa-checklist.md`

- [ ] **Step 1: Build a page inventory checklist**

Create the checklist file listing all 28 pages (4 root + 10 project + 14 research) with two columns: "content parity" and "wireframe parity", each starting unchecked.

- [ ] **Step 2: Check every page against its pre-migration source**

For each of the 28 pages: open the new Astro-built page (`npm run preview`) side-by-side with the corresponding original file's content (the original files were deleted from the working tree in Task 28 — check them out via `/usr/bin/env git show HEAD~<n>:<path>` for the last commit before Task 28's deletion, or reference the plan's own reading notes for pages fully read during migration tasks). Confirm: every paragraph/fact present, same section order, all links resolve, all images/icons present. Mark both checklist columns for that page.

- [ ] **Step 3: Fix any gap found**

For each page failing a check, fix the corresponding `.mdx`/`.astro` file directly (not a new task — fix inline, matching the pattern established by that page's original migration task), then re-verify and check it off.

- [ ] **Step 4: Commit the completed checklist**

```bash
/usr/bin/env git add docs/superpowers/plans/2026-09-16-astro-rebrand-qa-checklist.md
/usr/bin/env git add -u
/usr/bin/env git commit -m "docs: complete content/wireframe parity QA checklist"
```

---

### Task 30: Interactive-features and cross-browser QA pass

**Files:** none — verification task.

- [ ] **Step 1: Click-through every interactive feature**

Using `npm run preview`, manually verify: theme toggle (persists across reload), caveman-mode toggle (persists, shows/hides correct content) on at least 2 research pages, hero graph mode on `/` (fullscreen expand on click, node click navigates), hero blob mode on at least 2 non-home pages, SOM playground on `/projects/som-plus/` and `/research/som-tsk/` (interactive controls work), charts on all 5 chart-bearing research pages (render with correct data), GitHub activity feed on `/` (loads real data), mobile nav (bottom tab bar) at a 375px viewport width, related-papers links on 2 research pages.

- [ ] **Step 2: Record and fix any failures**

For each failure, identify the owning file from the task that created it (cross-reference this plan's task list), fix directly, re-verify.

- [ ] **Step 3: Commit any fixes**

```bash
/usr/bin/env git add -A
/usr/bin/env git commit -m "fix: interactive feature QA fixes"
```

(Skip this commit if Step 2 found nothing to fix.)

---

### Task 31: Build sanity and link check

**Files:** none — verification task.

- [ ] **Step 1: Full production build**

Run: `npm run build` — expected: exits 0, no warnings about missing collection fields or broken `getStaticPaths`.

- [ ] **Step 2: Internal link check**

Run: `npx linkinator dist --recurse --silent` (installed on-demand via `npx`, not added as a permanent dependency)
Expected: no broken internal links reported. External links (GitHub, LinkedIn, Instagram, repo links) may be skipped with `--skip "^https://(github|linkedin|instagram)\.com"` if the sandbox has no outbound network access to verify them — note in the QA checklist (Task 29) that external links were verified by manual read-through of frontmatter instead.

- [ ] **Step 3: Fix any broken internal link found**

Fix directly in the owning `.astro`/`.mdx` file, re-run the check.

- [ ] **Step 4: Commit any fixes**

```bash
/usr/bin/env git add -A
/usr/bin/env git commit -m "fix: broken internal links found during link check"
```

(Skip this commit if Step 3 found nothing to fix.)

---

### Task 32: Update project documentation and open the PR

**Files:**
- Modify: `README.md`, `AGENTS.md` (rewrite both to describe the Astro architecture, replacing the vanilla-HTML description)

- [ ] **Step 1: Rewrite `README.md`**

Replace the "Built with vanilla HTML, CSS, and JavaScript — no build step, no framework" framing and file structure with the new Astro structure (`src/pages`, `src/content`, `src/components`, `src/islands`), new local-dev instructions (`npm install && npm run dev`), and the refreshed design section (Technical Editorial palette/type, same breakpoints).

- [ ] **Step 2: Rewrite `AGENTS.md`**

Replace the "no build step, no framework" framing and the 5 "critical gotchas" with their Astro-era equivalents: content lives in `src/content/{projects,research}/*.mdx` (single source of truth — the old 3-location drift problem no longer exists), islands live in `src/islands/`, asset paths are root-relative everywhere (the old `assets/...` vs `../assets/...` split no longer exists), theme/caveman pre-paint scripts live inline in `Layout.astro`, and note the `/usr/bin/env git` workaround for this worktree if still relevant at that point.

- [ ] **Step 3: Verify**

Run: `npm run build` one final time — expected: exits 0.

- [ ] **Step 4: Commit**

```bash
/usr/bin/env git add README.md AGENTS.md
/usr/bin/env git commit -m "docs: update README and AGENTS.md for the Astro architecture"
```

- [ ] **Step 5: Push the branch and open a PR (requires explicit user approval before running)**

Do not run this step autonomously. Surface to the user: "Ready to push `worktree-astro-rebrand` and open a PR against `main`. This also requires a manual step on your end before merge: switch GitHub Pages source to 'GitHub Actions' in repo Settings → Pages (spec §7) — otherwise the deploy workflow will build but nothing will serve from it." Only push/open the PR after the user says yes.

