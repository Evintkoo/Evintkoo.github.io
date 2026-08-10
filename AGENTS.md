# AGENTS.md

Guidance for AI agents working in this repository. A static personal portfolio + research
showcase — **vanilla HTML/CSS/JS, no build step, no framework, no test suite.**

## Commands

There is no build, test, or lint tooling. The only thing you need is a local static server:

```bash
python3 -m http.server 8080   # open http://localhost:8080
```

There is no CI. **Deployment is automatic: this is a GitHub Pages user site
(`Evintkoo.github.io`), so pushing to `main` publishes to production.** Verify changes locally
before committing.

## Critical gotchas (read first)

### 1. Project/research metadata exists in up to THREE places

When adding, renaming, or editing a project or paper, you must keep these in sync — there is no
single source of truth:

- **`assets/js/data.js`** (`window.SITE_DATA`) — structured records (id, topic, tags, href, repo).
  Feeds the homepage hero graph (`hero-scene.js`) and topic mindmap (`mindmap.js`). The `topic`
  field drives the graph; `null`-topic items are intentionally excluded from the graph.
- **Static HTML cards** on `index.html` (`.project-card`, `[data-research-item]`) and on
  `projects.html` / `research.html` — hand-curated marketing copy. `explore.js` (the search/tag
  filter on the homepage) indexes **these DOM nodes in place**, NOT `data.js`. The copy and tags
  you write in the HTML are what search sees.
- **`assets/js/research-recommendations.js`** (`PAPERS` array) — drives the "related papers"
  widget on every `research/*.html` detail page. A new paper must be added here too.

`projects.html` does **not** load `data.js` (90 hand-written cards) — it is fully static.

### 2. The live animation module is `assets/js/animations.js`

There used to be an `assets/js/main.js` (`PortfolioApp` class) that was never loaded by any page
(dead code). Its genuinely-useful research-page behaviors — section fade-in, performance-table row
hover, reading-time badge, and paper-hero parallax — were migrated into `main-theme.js`'s
`initResearchEnhancements()` and `main.js` was deleted. The remaining dead bits in it (project
filter buttons, hexagonal tech-stack) belonged to UIs that were redesigned away. The live
animation module is `assets/js/animations.js` (`PortfolioAnimations`, with per-paper classes like
`CircRNAAnimations`, `P53Animations`), loaded on `about.html` and the research detail pages.

### 3. `graphify-out/` is generated and gitignored

The `graphify-out/` directory (a code-knowledge-graph visualization) is auto-generated and
gitignored. Ignore it; never edit it.

### 4. Cache-busting query strings on every asset

All `<link>` / `<script>` asset URLs carry a `?v=N` cache-buster (e.g. `main-theme.css?v=20`,
`hero-scene.js?v=13`). **When you change an asset, bump its version number in every HTML file
that references it**, or browsers will serve the stale cached copy. Version numbers are
per-asset and independent — they are not global.

### 5. Asset paths differ by page depth

Root pages (`index.html`, `projects.html`, `research.html`, `about.html`) use `assets/...`.
Sub-pages in `projects/` and `research/` use `../assets/...` (and link back with `../index.html`).
Copy-pasting a `<script>` tag between the two without fixing the prefix is a common break.

## Architecture

### Per-page script loading

Scripts are included per-page, not globally. The two constants are:

- **`main-theme.js`** — loaded on every page. Owns all global behavior: theme toggle, mobile nav,
  smooth-scroll, `IntersectionObserver` scroll-reveal (elements with `data-reveal` get
  `fade-in-up`/`visible`), research sidebar (`#rsb`), reading-progress bar, "caveman" (simple)
  mode toggle, scroll-to-top, project carousel, category filter, card tilt, hero parallax, and the
  custom cursor (`#cursorDot` / `#cursorRing`). It runs a **single shared rAF-throttled scroll
  dispatcher** (`_scrollCbs`) — push new scroll handlers onto that array rather than adding new
  `scroll` listeners. Guarded everywhere with `if (el)` so it no-ops on pages missing elements.
- **`hero-scene.js`** (`type="module"`) — the Three.js background. See below.

Optional modules: `animations.js` (about + research detail), `data.js` + `mindmap.js` +
`explore.js` (homepage only), `activity-feed.js` (homepage only, GitHub feed),
`research-recommendations.js` (every research detail page), `chart.js` (research pages with
charts), `som-playground.js` (`research/som-tsk.html` + `projects/som-plus.html`).

### `hero-scene.js` — dual mode (critical constraint)

Imports Three.js r162 directly from the jsdelivr CDN as an ES module (no bundler). It runs in
**two mutually exclusive modes**, decided at load time by whether `window.SITE_DATA` exists:

- **Graph mode (homepage only):** renders `SITE_DATA` as a topic/article node graph that expands
  to a fullscreen clickable explorer on click.
- **Legacy blob (every other page):** an abstract morphing icosahedron.

**Homepage-only is a hard constraint:** the graph must never render on non-homepage pages, and the
legacy blob must stay pixel/behavior identical everywhere else. If you touch this file, verify
both modes after every change. Theme colors are read from `documentElement[data-theme]` and the
module exposes an `onThemeChange` hook — respect both light and dark palettes.

### Theme system

- Default theme is **dark**. Set synchronously by an IIFE at the very top of `main-theme.js`
  (reads `localStorage['theme']`) to prevent a flash of unstyled content — keep that IIFE first.
- Driven by the `data-theme` attribute on `<html>` (values `light` / `dark`). Dark-mode CSS lives
  under the `[data-theme="dark"]` selector in `main-theme.css`.
- **"Caveman" mode** (branding: "Simple mode") swaps formal research prose for a plain-English
  rewrite via the `html.caveman` class. Research detail pages include a small pre-paint inline
  `<script>` to apply the class before first paint (avoids a flash); persisting it to
  `localStorage['caveman']` is handled in `main-theme.js`.

### Design tokens

All visual primitives are CSS custom properties defined once in `assets/css/main-theme.css`
(`:root` = light, `[data-theme="dark"]` = dark). **Use the tokens; do not hardcode colors,
spacing, radii, or font sizes.** Notably: `--accent-warm` (rose/magenta), `--accent-sage`
(violet), `--font-display` (Instrument Serif), `--font-body` (Plus Jakarta Sans),
`--font-mono` (JetBrains Mono), the `--space-*` scale, `--radius-*`, and `--ease-*` /
`--transition-*`. Max content width is `--max-width` (1200px). Responsive breakpoints: 1023,
767, 639, 479px.

### CSS files (by responsibility)

`main-theme.css` (design system + layout + components, loaded everywhere) · `components.css`
(shared UI) · `research.css` (research detail pages) · `project.css`, `playground.css`,
`chart.css`, `activity.css`, `explore.css` (section/page-specific). Class naming is **BEM-ish**
(`block__element--modifier`).

## Conventions

- **Commits:** Conventional Commits style — `feat:`, `fix:`, `docs:`, `style:`, with optional
  scope (`fix(mobile):`). Keep the subject line tight and user-facing.
- **External links:** always `target="_blank" rel="noopener noreferrer"`.
- **Icons:** inline SVG, stroke-based, `aria-hidden="true"` on decorative ones; match the existing
  `stroke-width` / `viewBox="0 0 24 24"` house style.
- **Lazy images:** use `data-src` (the theme swaps it to `src` via `IntersectionObserver`).
- **Accessibility:** decorative elements get `aria-hidden`; interactive controls get `aria-label`
  / `aria-pressed`.

## Planning & design docs

Non-trivial changes follow a documented workflow under `docs/superpowers/`:

- `specs/YYYY-MM-DD-<feature>-design.md` — the design spec (what + why).
- `plans/YYYY-MM-DD-<feature>.md` — the task-by-task implementation plan using checkbox (`- [ ]`)
  steps, referencing the spec. Plans are written to be executed one task at a time.

When tackling a larger feature, read the most recent spec/plan pair for the established structure
and constraints before starting.
