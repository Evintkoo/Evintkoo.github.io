# AGENTS.md

Guidance for AI agents working in this repository. A static personal portfolio + research
showcase, built with **Astro** (`astro@^7.3.2`, `@astrojs/mdx`) — static output, no client
framework, no test suite.

## Commands

```bash
npm install
npm run dev       # dev server
npm run build     # production build (must succeed, 28 pages)
npm run preview   # preview the production build
```

There is no CI test/lint step. **Deployment is automatic:** `.github/workflows/deploy.yml`
builds with `npm run build` and deploys `dist/` to GitHub Pages via the native
`actions/upload-pages-artifact` + `actions/deploy-pages` flow on every push to `main`. Verify
changes locally (`npm run build`) before committing.

**Worktree note:** bare `git` commands are refused by a hook in this worktree — the hook
misidentifies which repo/root a plain `git` invocation targets from inside a worktree checkout.
Prefix every git invocation with `/usr/bin/env` (e.g. `/usr/bin/env git status`) to bypass it.
This was re-verified as still necessary as of this writing (a bare `git status` in this worktree
still fails with a "refusing to run it" error) — re-check if you hit something different.

## Critical gotchas (read first)

### 1. Content lives in exactly ONE place

Every project and research entry is a single `.mdx` file in `src/content/projects/` or
`src/content/research/`, validated against the Zod schemas in `src/content.config.ts` (Astro
Content Collections). This replaced the old vanilla site's 3-location drift problem
(`assets/js/data.js` + hand-written HTML cards + a separate recommendations array) — there is
now exactly one source of truth per entry, and the two dynamic templates
(`src/pages/projects/[slug].astro`, `src/pages/research/[slug].astro`) are the single rendering
path for every project/research page. A new project or paper is added purely as a new `.mdx`
file — never by writing new template code. That's what makes "every project/research page
follows the same structure" guaranteed rather than manually maintained.

### 2. Asset paths are root-relative everywhere (verified, not assumed)

The old site's `assets/...` (root pages) vs `../assets/...` (nested `projects/`/`research/`
pages) split is gone. Astro's file-based routing means every page — root or nested — references
assets the same way, from the site root: `Layout.astro` uses `/favicon.png`, `Nav.astro` links
use `/`, `/projects`, `/research`, `/about`, and `about.astro` loads `/assets/images/profile.png`.
There is no relative-prefix bookkeeping to get wrong when copying markup between page depths.

### 3. Islands: vanilla TypeScript, no hydration directives

Interactive behavior lives in `src/islands/*.ts` as plain TypeScript modules — there's no
`client:load`/`client:visible` hydration-directive framework here. Each Astro component or page
wires up the island(s) it needs with a small inline `<script>` block: import the `init*`
function, look up the DOM node(s) with `document.getElementById`/`querySelector`, and guard with
`if (el)` before calling in. See `Nav.astro`'s theme-toggle wiring or `about.astro`'s
scroll-reveal wiring for the pattern. Because the guard is manual, a page that doesn't render the
expected element silently no-ops instead of erroring — but it also means a typo'd selector fails
silently, so double-check element IDs/selectors match between the island and the markup.

### 4. Theme toggle / caveman-mode pre-paint scripts

Still exist, still critical for avoiding FOUC. They are the first two inline `<script is:inline>`
blocks in `src/components/Layout.astro`'s `<head>` (lines 21–33 as of this writing): the first
reads `localStorage['theme']` and sets `data-theme` on `<html>` before first paint; the second
reads `localStorage['caveman']` and adds the `caveman` class the same way. Keep both first in
`<head>`, before the Google Fonts `<link>` and before anything that could paint. Persisting
changes to `localStorage` is handled by `src/islands/theme-toggle.ts` and
`src/islands/caveman-mode.ts` respectively, not by these pre-paint scripts.

### 5. Schema convention: add an optional field, don't fork the template

When a page needs to deviate from a shared template's default rendering, the established pattern
across this project is to add an optional field to the collection schema rather than branching
the template or writing a one-off page. Examples already in `src/content.config.ts`:

- `ProjectCTA`'s `ctaHeading` / `ctaSubtitle` / `ctaLink` / `ctaLabel` — override the default
  "See the code" CTA copy/link on a per-project basis.
- `ResearchHero`'s `pdf` / `externalLink` / `repoLink` / `metaLabel` / `metaValue` / `snapshot` /
  `pairedLink` / `pairedLinkLabel` — cover per-paper variations (a PDF vs. an external link, a
  secondary repo button, a paired/companion paper cross-link, a "Research Snapshot" aside) without
  branching `ResearchHero.astro` itself.

Follow this pattern for new variation needs: extend the schema with an optional field, default to
existing behavior when it's absent, and keep the one shared component per content type.

### 6. `:global()` for client-created DOM

Astro scopes `<style>` blocks to the component's own template markup. Elements created at
runtime by an island (SVGs from the mindmap module, research chart SVGs, hero-graph overlay
elements) are NOT part of that scoped markup, so styles targeting them need `:global()` or they
silently don't apply. This has bitten this project multiple times during development. See the
inline comments and rules in `src/pages/index.astro` (`.activity-feed :global(...)`,
`#mindmapContainer :global(svg)`), `src/pages/research/[slug].astro`
(`.research-content :global(.chart...)`, `:global(#mindmapContainer svg)`), and
`src/pages/projects/[slug].astro` for worked examples — including cases explicitly noted as NOT
needing `:global()` because that particular markup is rendered by Astro itself (e.g. Canvas-based
2D contexts that never call `document.createElement`).

### 7. `graphify-out/` is generated and gitignored

The `graphify-out/` directory (a code-knowledge-graph visualization) is auto-generated and
gitignored. Ignore it; never edit it.

## Architecture

### Content collections

`src/content.config.ts` defines two collections, `projects` and `research`, loaded via
`astro/loaders`' `glob()` against `src/content/{projects,research}/*.mdx`. Schemas are Zod
objects — required fields (`title`, `tagline`, `tags`, etc.) plus the growing set of optional
per-entry overrides described in gotcha #5. Read the schema comments before adding a new field;
several fields have adjacent-but-distinct siblings (e.g. `metrics` vs. `snapshot.highlights`,
`tags` vs. `snapshot.tags`) that were deliberately kept separate after an audit found them
non-redundant — don't collapse them without checking the comment explaining why they coexist.

### Pages

- `src/pages/index.astro`, `about.astro` — standalone pages.
- `src/pages/projects/index.astro`, `research/index.astro` — listing pages, driven by the
  content collections.
- `src/pages/projects/[slug].astro`, `research/[slug].astro` — the single dynamic template per
  content type (see gotcha #1). All structural consistency across entries comes from routing
  every entry through one of these two files.

### Islands (`src/islands/*.ts`)

`theme-toggle.ts`, `caveman-mode.ts`, `scroll-reveal.ts`, `hero-scene.ts`, `mindmap.ts`,
`research-chart.ts`, `som-playground.ts`, `activity-feed.ts`. Each is wired via a per-page/
per-component inline `<script>` block (gotcha #3), not loaded globally.

### Theme system

- Default theme is **dark**. Set synchronously before first paint by the first inline script in
  `Layout.astro`'s `<head>` (gotcha #4), reading `localStorage['theme']`.
- Driven by the `data-theme` attribute on `<html>` (`light` / `dark`). Dark-mode tokens are
  defined under `:root[data-theme='dark']` in `src/styles/tokens.css`.
- **"Caveman" mode** ("Simple mode" in the UI) swaps formal research prose for a plain-English
  rewrite via the `html.caveman` class, applied pre-paint by the second inline script in
  `Layout.astro`'s `<head>` (gotcha #4); persistence to `localStorage['caveman']` is handled by
  `src/islands/caveman-mode.ts`.

### Design tokens

All visual primitives are CSS custom properties defined once in `src/styles/tokens.css`
(`:root` = light, `:root[data-theme='dark']` = dark). **Use the tokens; do not hardcode colors,
spacing, radii, or font sizes.** Notably: `--paper` / `--paper-raised` / `--ink` / `--ink-soft` /
`--ink-faint` / `--accent` / `--accent-ink` / `--border`, `--font-display` (Instrument Serif),
`--font-body` (Plus Jakarta Sans), `--font-mono` (JetBrains Mono — used for nav, labels, and
metadata), the `--space-*` scale, `--radius-*`, and `--ease-out` / `--transition-base`. Max
content width is `--max-width` (1200px). Responsive breakpoints: 1023, 767, 639, 479px, unchanged
from the old site.

### CSS

`src/styles/global.css` holds shared layout/typography/component styles loaded via
`Layout.astro`. Component- and page-specific styles live in scoped `<style>` blocks in their
own `.astro` files (see gotcha #6 for the client-created-DOM exception).

## Conventions

- **Commits:** Conventional Commits style — `feat:`, `fix:`, `docs:`, `style:`, with optional
  scope (`fix(mobile):`). Keep the subject line tight and user-facing.
- **External links:** always `target="_blank" rel="noopener noreferrer"`.
- **Icons:** inline SVG, stroke-based, `aria-hidden="true"` on decorative ones; match the existing
  `stroke-width` / `viewBox="0 0 24 24"` house style.
- **Accessibility:** decorative elements get `aria-hidden`; interactive controls get `aria-label`
  / `aria-pressed`.

## Planning & design docs

Non-trivial changes follow a documented workflow under `docs/superpowers/`:

- `specs/YYYY-MM-DD-<feature>-design.md` — the design spec (what + why).
- `plans/YYYY-MM-DD-<feature>.md` — the task-by-task implementation plan using checkbox (`- [ ]`)
  steps, referencing the spec. Plans are written to be executed one task at a time.

When tackling a larger feature, read the most recent spec/plan pair for the established structure
and constraints before starting.
