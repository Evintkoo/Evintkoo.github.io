# Astro Rebrand & Rewrite — Design Spec

**Date:** 2026-09-16
**Branch:** `worktree-astro-rebrand` (isolated git worktree at `.claude/worktrees/astro-rebrand`)
**Status:** Approved — see §11 for the post-approval correction to content scope

## 1. Why

The current site (`AGENTS.md`) is vanilla HTML/CSS/JS, no build step, ~28 hand-duplicated pages
(4 root + 10 project + 14 research), with project/research metadata living in up to three unsynced
places (`data.js`, hand-written HTML cards, `research-recommendations.js`'s `PAPERS` array). This
causes real drift risk and makes "every page follows the same wireframe" something that has to be
manually maintained rather than structurally guaranteed. The user asked for a full rebrand and
rewrite on a new branch/worktree, onto a better stack, with every project/research page (explicitly
including `torch-inference` and `kolosal-automl`) sharing one consistent standard.

## 2. Decisions made with the user

| Decision | Choice |
|---|---|
| Rebrand scope | Refreshed visual identity — same name/person, new palette/typography/layout language, not a name/positioning change |
| Framework | Astro |
| Rewrite scope | Full site, all ~24 pages, in this branch |
| Content architecture | Astro Content Collections as single source of truth (replaces `data.js` + hand-written cards + `PAPERS` array) |
| Interactivity | Vanilla TS Astro islands — no React/Vue |
| Deploy | GitHub Actions build + native GitHub Pages Actions deployment (no committed build output) |
| Feature policy | Preserve all existing interactive features, rebuilt cleanly |
| Copy | **Superseded — see §11:** verbatim content parity, not a refresh |
| Styling | Hand-authored CSS with design-token custom properties, scoped per Astro component (no Tailwind) — confirmed |
| Isolation | Git worktree (`.claude/worktrees/astro-rebrand`) + dedicated branch, per user's explicit instruction |

## 3. Visual direction — "Technical Editorial" (confirmed)

- **Palette:** ink/paper base (near-black / near-white, not the current warm neutrals) with one
  confident accent color (candidates: electric blue or amber) instead of the current two
  (pink + sage). Dark mode stays default and first-class.
- **Typography:** keep the three-part serif/sans/mono system (it's a good structure) — sharper
  editorial serif for display, JetBrains Mono takes a bigger visual role (labels, metadata, nav)
  to read as more technical/precise.
- **Layout:** tighter grid, disciplined whitespace, editorial/academic density rather than
  "portfolio-soft." One grid + one spacing scale, applied identically across every page type —
  this is what makes wireframe consistency structural rather than manually maintained.

Exact hex/type-scale values are chosen during implementation against this direction, not pinned
in this spec.

## 4. Content architecture

Two Astro Content Collections, defined in `src/content/config.ts`:

**`projects`** — one entry per project (id = slug, e.g. `torch-inference`, `kolosal-automl`).
Frontmatter: `title`, `tagline`, `tags: string[]`, `topic: string | null` (drives hero graph
inclusion, `null` excludes), `tech: string[]`, `repo?`, `demo?`, `featured: boolean`, `order`.
Body (MDX): long-form sections (overview, features, architecture) rendered into the shared
project-detail template.

**`research`** — one entry per paper/analysis. Frontmatter: `title`, `abstract`, `tags: string[]`,
`topic`, `date`, `pdf?`/`externalLink?`, `simpleSummary?` (MDX or plain text alt for "caveman"
mode, replacing the current per-page hand-written simple rewrite). "Related papers" is **computed**
(shared tags/topic ranking) instead of the hand-maintained `PAPERS` array — removes one of the
three metadata locations outright.

Homepage hero graph and topic mindmap read directly from `getCollection()` output instead of a
separate `SITE_DATA` global — collapses metadata from three sources to one.

## 5. Routing & templates

```
src/pages/
  index.astro              # home — hero graph island, featured projects/research
  about.astro
  projects/
    index.astro             # listing, generated from `projects` collection
    [slug].astro             # ONE template for every project — torch-inference and
                              # kolosal-automl (and all others) render through this,
                              # making "same standard" structural, not manual
  research/
    index.astro
    [slug].astro              # ONE template for every research page
```

Shared components (`src/components/`): `Layout.astro` (head/fonts/theme pre-paint IIFE/nav/footer),
`Nav.astro`, `Footer.astro`, `ThemeToggle`, `ProjectCard.astro`, `ResearchCard.astro`, `TagPill.astro`,
`SceneBackground.astro` (wraps the hero-scene island).

`project.css`/`research.css`-equivalent styles become component-scoped `<style>` blocks in the
relevant `.astro` templates plus a small shared `global.css` for tokens — same token system as
today (`--accent`, `--space-*`, `--radius-*`, `--ease-*`), just reorganized.

## 6. Interactive features — rebuild plan

All preserved, reimplemented as typed vanilla TS Astro islands (`src/islands/`):

- **Hero scene** (`hero-scene.ts`, Three.js r162): same dual-mode constraint as today — graph mode
  on the homepage only (reads collection data at build time, passed as a script tag or fetched
  JSON), legacy morphing-blob mode elsewhere, pixel/behavior-identical. `client:load` on pages that
  use it.
- **SOM playground** (`som-playground.ts`): `client:visible` on `projects/som-plus` and
  `research/som-tsk`.
- **Research charts**: kept on whatever charting approach the current `chart.js` file actually
  implements (hand-rolled vs. a library — confirmed during implementation by reading the current
  file); reimplemented as a typed island, `client:visible`.
- **GitHub activity feed** (`activity-feed.ts`): homepage only, `client:visible`, same client-side
  GitHub API fetch as today.
- **Caveman/"Simple mode"**: small global toggle island + `localStorage['caveman']` persistence,
  same pre-paint inline script pattern (avoids flash) reproduced in `Layout.astro`.
- **Theme toggle / dark-mode-default**: same synchronous pre-paint IIFE pattern, first thing in
  `Layout.astro`'s `<head>`, to avoid FOUC — this is a hard correctness constraint carried over
  from the current `main-theme.js`.

## 7. Build & deploy

- `astro.config.mjs`: static output, `site` set to `https://evintkoo.github.io`.
- `.github/workflows/deploy.yml`: on push to `main` — checkout, setup-node, `npm ci`,
  `astro build`, `actions/upload-pages-artifact`, `actions/deploy-pages`.
- **Manual step required from the user, not done by me:** the repo's GitHub Pages source must be
  switched from "Deploy from a branch" to "GitHub Actions" in repo Settings → Pages. This is a
  live-site-affecting settings change outside what I'll do autonomously; I'll flag it again at
  merge time.
- Old root-level static HTML files are removed as part of the migration once the Astro build
  replaces them; nothing is deployed from two sources simultaneously.

## 8. Migration & copy

**Superseded by §11: content is ported verbatim (1:1 parity), not rewritten.** Content is migrated
from existing HTML into MDX frontmatter + body per collection entry: factual fields (links, tech
stacks, dates, repo URLs) map directly to typed frontmatter, and body prose is carried over as-is,
re-marked-up as MDX. The wireframe — section order and information architecture of each page type
— is also preserved 1:1 from the current HTML. Only the UI (visual design: palette, typography,
component styling per §3) changes.

## 9. Implementation phasing (for the implementation plan)

1. **Foundation** — Astro scaffold, `Layout.astro`, design tokens/global CSS, theme pre-paint
   script, GitHub Actions deploy workflow, verified end-to-end with a trivial page before content
   work starts (de-risks the new deploy pipeline early).
2. **Content model** — `src/content/config.ts` collections + schema, migrate one project
   (`torch-inference`) and one research entry as the reference implementation of each template.
3. **Root pages** — home (incl. hero graph island), about, projects index, research index.
4. **Project pages** — `[slug].astro` template finalized, all 10 project entries migrated
   (including `kolosal-automl`), SOM playground island.
5. **Research pages** — `[slug].astro` template finalized, all 14 research entries migrated,
   charts island, caveman-mode island, related-papers computation.
6. **Cross-cutting polish** — activity feed island, full light/dark pass, responsive pass at the
   existing breakpoints (1023/767/639/479), remove legacy root HTML/CSS/JS files.
7. **QA pass** — page-by-page content/wireframe parity check against the old site (every fact,
   link, and section present and in the same order), full click-through of every interactive
   feature, cross-browser/responsive spot check, Lighthouse/build sanity check. Site is release-
   ready only after this phase.
8. **Cutover** — GitHub Pages source switched to Actions (user-performed), merge.

## 10. Open items for user review

All resolved — see §11.

## 11. Post-approval correction: content & wireframe parity

After spec approval, the user clarified the actual target: **"one on one parity of content and
wireframe with different UI, QAed and ready to release."** This overrides §2's "Copy" row and §8
as originally written:

- **Content parity:** existing project/research prose is ported verbatim, not rewritten. No new
  copywriting pass.
- **Wireframe parity:** the section-by-section structure of each page type (hero → body sections →
  feature grid → tech pills → CTA, for project pages; the equivalent for research pages) is
  preserved as-is from the current site — the rewrite does not redesign information architecture.
- **UI changes:** only the visual layer changes — palette, typography, component styling per §3's
  Technical Editorial direction, plus the framework/architecture changes in §4-§7.
- **Release readiness:** an explicit QA phase (§9 step 7) is added — this is not just a technical
  migration, it needs to be verified content-complete and functionally correct before it's
  considered done.

Styling approach (hand-authored CSS + tokens) and the Technical Editorial visual direction were
both confirmed by the user's "approve."
