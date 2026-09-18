# Live canvas status badges

**Date:** 2026-09-18

## Goal

Let each project's own GitHub repo drive a live status badge (and optional content override) on the site, with no rebuild/redeploy needed. Editing `canvas/data.json` in a repo updates the site on next page load.

## Data contract

Any project repo can add `canvas/data.json` at the root of its default branch (`main`):

```json
{
  "status": "planned" | "in-progress" | "done",
  "title": "optional override of the mdx title",
  "description": "optional override of the mdx tagline"
}
```

`status` is the only required field. A repo with no `canvas/data.json` (404) is treated as "no data" — no badge, no override, nothing broken.

## Scope

Applies to the 8 project entries that currently have a `repo:` field in frontmatter: `aegis`, `orderflow-rs`, `som-plus`, `torch-inference`, `kolosal-automl`, `tribe-playground`, `chain-reaction-simulation`, `faction-app`. Research entries (`repoLink`) are out of scope for this pass.

Rendered in three places, all reading the same fetched data:
- `/projects` listing cards (`src/pages/projects/index.astro`)
- Project detail page header (`src/pages/projects/[slug].astro`)
- Mindmap leaf notes for project nodes (`src/islands/mindmap.ts`)

## Design

- `src/lib/canvas-data.ts`: pure helper module.
  - `parseGithubRepo(repoUrl): { owner, name } | null` — parses a `https://github.com/<owner>/<repo>` URL.
  - `type CanvasData = { status: 'planned' | 'in-progress' | 'done'; title?: string; description?: string }`.
  - `fetchCanvasData(repoUrl): Promise<CanvasData | null>` — fetches `https://raw.githubusercontent.com/<owner>/<repo>/main/canvas/data.json`, returns `null` on any non-2xx/parse failure. No retries, no branch fallback (repos are expected to use `main`, consistent with this site's own default branch).
- `src/islands/canvas-status.ts`: a page-load client script.
  - Finds all elements with `data-canvas-repo="<repo-url>"`.
  - Dedupes by repo URL, fetches each once via `Promise.allSettled` (a slow/missing repo never blocks the others).
  - For each matching element: if data resolved, injects a status pill into its `[data-canvas-status-slot]` child and, if `title`/`description` are present, overwrites the text content of that element's `[data-canvas-title]`/`[data-canvas-description]` children. If not resolved, leaves the element exactly as server-rendered.
  - Status pill: colored dot + label — gray "Planned", amber "In Progress", green "Done". Read-only (no interactivity) — the repo's JSON is the only control surface.
- Markup changes: the three render sites above add `data-canvas-repo`, an empty `data-canvas-status-slot` span, and (where they don't already have a stable child element for the title/description) wrap those in `data-canvas-title`/`data-canvas-description` spans so the island can target them.
- The island script is included once per page (via `Layout.astro`, following the existing pattern used by `theme-toggle.ts`/`scroll-reveal.ts`) and no-ops harmlessly on pages with no `data-canvas-repo` elements.

## Non-goals

- Not writing `canvas/data.json` into the actual GitHub repos as part of this change — that's a separate follow-up once git auth is working (`gh auth status` currently reports an invalid keyring token for two of the repos, which are private).
- No editing UI on the site itself; status changes only via committing to the repo.
- No build-time fetch/caching — this is intentionally live and client-only, accepting that a visitor loads a page before GitHub responds sees stale/no badge for a moment.

## Verification

- Build all pages; confirm no errors.
- In a browser: seed one repo temporarily (or mock the fetch) to confirm the pill renders with each of the three statuses, and confirm a repo with no `canvas/data.json` renders cleanly with no badge.
- Confirm dedup: a repo referenced from both the listing card and the mindmap note is fetched once.
