# Live Canvas Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a project's own GitHub repo drive a live status badge (and optional title/description override) on the site, by fetching `canvas/data.json` from the repo client-side — no rebuild needed to reflect an edit.

**Architecture:** A pure fetch/parse module (`src/lib/canvas-data.ts`) talks to `raw.githubusercontent.com`. A page-load client script (`src/islands/canvas-status.ts`), wired once in `Layout.astro`, finds every `[data-canvas-repo]` element on the page, dedupes by repo URL, fetches each once, and injects a status pill (+ optional content override) into matching elements. Three render sites get the `data-canvas-repo` markup: the `/projects` listing cards, the project detail page header, and mindmap leaf notes for project nodes.

**Tech Stack:** Astro islands (plain TS, no framework), native `fetch`, no new dependencies. This project has no test runner configured (`package.json` has no `test` script) — verification for the pure module uses throwaway Node scripts (Node 22 supports `--experimental-strip-types`, confirmed working); verification for DOM/visual behavior follows this project's existing convention of `astro build` + manual browser check (see e.g. `docs/superpowers/specs/2026-09-17-hero-mindmap-orb-design.md`'s own Verification section).

**Spec:** `docs/superpowers/specs/2026-09-18-live-canvas-status.md`

## Global Constraints

- Repos are assumed to use branch `main` (no fallback to `master`) — matches this site's own default branch, per spec's Design section.
- A repo with no `canvas/data.json`, a non-2xx response, or malformed JSON is treated as "no data": no badge, no content override, no error surfaced to the visitor — per spec's Data contract section.
- The status pill is read-only / non-interactive — the repo's JSON is the only control surface, per spec's Design section.
- Scope is the 8 project entries with a `repo:` field today: `aegis`, `orderflow-rs`, `som-plus`, `torch-inference`, `kolosal-automl`, `tribe-playground`, `chain-reaction-simulation`, `faction-app`. Research entries (`repoLink`) are out of scope, per spec's Scope section.
- No new dependencies, no build-time fetching — client-only, per spec's Non-goals section.

---

### Task 1: `canvas-data.ts` fetch/parse module

**Files:**
- Create: `src/lib/canvas-data.ts`

**Interfaces:**
- Produces: `type CanvasStatus = 'planned' | 'in-progress' | 'done'`; `interface CanvasData { status: CanvasStatus; title?: string; description?: string }`; `function parseGithubRepo(repoUrl: string): { owner: string; name: string } | null`; `function fetchCanvasData(repoUrl: string): Promise<CanvasData | null>`.

- [ ] **Step 1: Write the module**

```ts
// src/lib/canvas-data.ts
export type CanvasStatus = 'planned' | 'in-progress' | 'done';

export interface CanvasData {
  status: CanvasStatus;
  title?: string;
  description?: string;
}

const VALID_STATUSES: CanvasStatus[] = ['planned', 'in-progress', 'done'];

// Only matches the plain `https://github.com/<owner>/<repo>` shape this
// site's `repo:`/`repoLink` frontmatter fields always use (see
// src/content.config.ts) — an optional trailing slash, nothing else (no
// `.git` suffix, no subpaths).
export function parseGithubRepo(repoUrl: string): { owner: string; name: string } | null {
  const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
  if (!match) return null;
  return { owner: match[1], name: match[2] };
}

// Fetches canvas/data.json from the repo's `main` branch. Returns null for
// ANY failure mode (bad URL, network error, non-2xx, malformed/missing
// JSON, invalid status) — the caller treats null as "no canvas data yet",
// never as an error to surface.
export async function fetchCanvasData(repoUrl: string): Promise<CanvasData | null> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) return null;
  const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.name}/main/canvas/data.json`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || typeof json !== 'object' || !VALID_STATUSES.includes(json.status)) return null;
    const data: CanvasData = { status: json.status };
    if (typeof json.title === 'string') data.title = json.title;
    if (typeof json.description === 'string') data.description = json.description;
    return data;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify with a throwaway script**

Create a scratch file (not committed) at the repo root, `tmp-canvas-data-check.ts` (relative import, so it works regardless of the repo's absolute path on disk):

```ts
import { parseGithubRepo, fetchCanvasData } from './src/lib/canvas-data.ts';

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`FAIL ${label}: got ${a}, expected ${e}`);
  console.log(`PASS ${label}`);
}

// parseGithubRepo
assertEqual(parseGithubRepo('https://github.com/Evintkoo/aegis'), { owner: 'Evintkoo', name: 'aegis' }, 'parse basic');
assertEqual(parseGithubRepo('https://github.com/Evintkoo/aegis/'), { owner: 'Evintkoo', name: 'aegis' }, 'parse trailing slash');
assertEqual(parseGithubRepo('https://gitlab.com/x/y'), null, 'parse non-github');
assertEqual(parseGithubRepo('not a url'), null, 'parse garbage');

// fetchCanvasData — stub global.fetch for each case
const realFetch = globalThis.fetch;

async function withStub(response: { ok: boolean; json?: () => Promise<unknown> } | 'throw', fn: () => Promise<void>) {
  globalThis.fetch = (async () => {
    if (response === 'throw') throw new Error('network down');
    return response as Response;
  }) as typeof fetch;
  await fn();
  globalThis.fetch = realFetch;
}

async function main() {
  await withStub({ ok: true, json: async () => ({ status: 'in-progress', title: 'Override' }) }, async () => {
    const data = await fetchCanvasData('https://github.com/Evintkoo/aegis');
    assertEqual(data, { status: 'in-progress', title: 'Override' }, 'valid response with title');
  });

  await withStub({ ok: false }, async () => {
    const data = await fetchCanvasData('https://github.com/Evintkoo/aegis');
    assertEqual(data, null, '404 response');
  });

  await withStub({ ok: true, json: async () => ({ status: 'not-a-real-status' }) }, async () => {
    const data = await fetchCanvasData('https://github.com/Evintkoo/aegis');
    assertEqual(data, null, 'invalid status value');
  });

  await withStub('throw', async () => {
    const data = await fetchCanvasData('https://github.com/Evintkoo/aegis');
    assertEqual(data, null, 'network error');
  });

  const badUrl = await fetchCanvasData('https://gitlab.com/x/y');
  assertEqual(badUrl, null, 'non-github url short-circuits before fetch');

  console.log('All canvas-data checks passed.');
}

main();
```

Run: `node --experimental-strip-types tmp-canvas-data-check.ts` (from the repo root)
Expected: five `PASS` lines from `parseGithubRepo`, then the five `PASS` lines from the `main()` cases, ending with `All canvas-data checks passed.` If anything prints `FAIL`, fix `canvas-data.ts` and re-run before moving on.

Delete the scratch file when done: `rm tmp-canvas-data-check.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/canvas-data.ts
git commit -m "feat: add canvas-data fetch/parse module"
```

---

### Task 2: `canvas-status.ts` island + shared CSS + Layout wiring

**Files:**
- Create: `src/islands/canvas-status.ts`
- Modify: `src/styles/tokens.css` (add 3 status color tokens)
- Modify: `src/styles/global.css` (add `.canvas-status-pill` rules)
- Modify: `src/components/Layout.astro:73-84` (add island import/init)

**Interfaces:**
- Consumes: `fetchCanvasData(repoUrl: string): Promise<CanvasData | null>` from Task 1 (`src/lib/canvas-data.ts`).
- Produces: `function initCanvasStatus(): void`, exported from `src/islands/canvas-status.ts`. Reads `[data-canvas-repo]` elements; each such element MAY contain a child with attribute `data-canvas-status-slot` (pill target), a child with `data-canvas-title` (text overwritten if the fetched data has a `title`), and a child with `data-canvas-description` (text overwritten if the fetched data has a `description`). Missing slots are simply skipped — `initCanvasStatus` never throws on absent children.

- [ ] **Step 1: Add status color tokens**

In `src/styles/tokens.css`, inside the existing `:root { ... }` block (same block as `--accent`, right after the `--border: #e2e0d8;` line):

```css
  --status-planned: #9a9a9a;
  --status-in-progress: #e0a72e;
  --status-done: #34c281;
```

These are intentionally the same values in both the light and dark `:root[data-theme='dark']` blocks — they're decorative dot colors, not text, so no separate dark-mode override is needed (see Step 2, which never uses these as text color).

- [ ] **Step 2: Add pill CSS**

In `src/styles/global.css`, append at the end of the file:

```css
/* Live canvas status pill — read-only indicator injected client-side by
   src/islands/canvas-status.ts once a repo's canvas/data.json resolves.
   Colored dot only; label text uses --ink-faint so it never needs its own
   per-theme contrast pass (see tokens.css's --status-* comment). */
.canvas-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--ink-faint);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 8px;
  white-space: nowrap;
}
.canvas-status-pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.canvas-status-pill--planned .canvas-status-pill__dot { background: var(--status-planned); }
.canvas-status-pill--in-progress .canvas-status-pill__dot { background: var(--status-in-progress); }
.canvas-status-pill--done .canvas-status-pill__dot { background: var(--status-done); }
```

- [ ] **Step 3: Write the island**

```ts
// src/islands/canvas-status.ts
import { fetchCanvasData, type CanvasData } from '../lib/canvas-data';

const STATUS_LABEL: Record<CanvasData['status'], string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  done: 'Done',
};

function renderPill(status: CanvasData['status']): HTMLElement {
  const pill = document.createElement('span');
  pill.className = `canvas-status-pill canvas-status-pill--${status}`;
  const dot = document.createElement('span');
  dot.className = 'canvas-status-pill__dot';
  pill.appendChild(dot);
  pill.appendChild(document.createTextNode(STATUS_LABEL[status]));
  return pill;
}

function applyCanvasData(el: HTMLElement, data: CanvasData): void {
  const slot = el.querySelector('[data-canvas-status-slot]');
  if (slot) {
    slot.innerHTML = '';
    slot.appendChild(renderPill(data.status));
  }
  if (data.title) {
    const titleEl = el.querySelector('[data-canvas-title]');
    if (titleEl) titleEl.textContent = data.title;
  }
  if (data.description) {
    const descEl = el.querySelector('[data-canvas-description]');
    if (descEl) descEl.textContent = data.description;
  }
}

export function initCanvasStatus(): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-canvas-repo]'));
  if (elements.length === 0) return;

  const byRepo = new Map<string, HTMLElement[]>();
  for (const el of elements) {
    const repo = el.dataset.canvasRepo;
    if (!repo) continue;
    const list = byRepo.get(repo) ?? [];
    list.push(el);
    byRepo.set(repo, list);
  }

  for (const [repo, els] of byRepo) {
    fetchCanvasData(repo).then((data) => {
      if (!data) return;
      for (const el of els) applyCanvasData(el, data);
    });
  }
}
```

- [ ] **Step 4: Wire into Layout.astro**

In `src/components/Layout.astro`, add a new `<script>` block right after the existing micro-interactions block (after line 84's closing `</script>`, before `</body>`):

```astro
  <script>
    import { initCanvasStatus } from '../islands/canvas-status';
    initCanvasStatus();
  </script>
```

- [ ] **Step 5: Verify in a browser with a scratch fixture**

Create a temporary file `src/pages/canvas-status-check.astro` (not committed — deleted at the end of this step):

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Canvas status check" description="scratch">
  <div id="fixture-planned" data-canvas-repo="https://github.com/fixture/planned">
    <span data-canvas-title>Original title</span>
    <span data-canvas-status-slot></span>
  </div>
  <div id="fixture-missing" data-canvas-repo="https://github.com/fixture/missing">
    <span data-canvas-status-slot></span>
  </div>
  <script is:inline>
    window.__origFetch = window.fetch;
    window.fetch = async (url) => {
      if (String(url).includes('/fixture/planned/')) {
        return new Response(JSON.stringify({ status: 'in-progress', title: 'Live title' }), { status: 200 });
      }
      return new Response('', { status: 404 });
    };
  </script>
</Layout>
```

Run `node_modules/.bin/astro dev` in the background, then use the claude-in-chrome tool to navigate to `http://localhost:4321/canvas-status-check`, wait briefly, and confirm via `get_page_text`/`read_page`: `#fixture-planned` shows title text "Live title" and a pill reading "In Progress"; `#fixture-missing` shows no pill content (its status slot stays empty). Stop the dev server, then delete the fixture: `rm src/pages/canvas-status-check.astro`.

- [ ] **Step 6: Commit**

```bash
git add src/islands/canvas-status.ts src/styles/tokens.css src/styles/global.css src/components/Layout.astro
git commit -m "feat: add live canvas-status island wired into Layout"
```

---

### Task 3: Wire into `/projects` listing cards

**Files:**
- Modify: `src/pages/projects/index.astro:19-32` (the `project-grid` `<li>` markup)

**Interfaces:**
- Consumes: the `data-canvas-repo` / `data-canvas-status-slot` / `data-canvas-title` / `data-canvas-description` contract from Task 2 (`initCanvasStatus`, wired globally via `Layout.astro` — no per-page import needed here).

- [ ] **Step 1: Add the data attributes and slot**

In `src/pages/projects/index.astro`, change the `<li>` block (currently):

```astro
        <li>
          <div class="project-grid__tags">
            {p.data.tags.map((t) => <span class="tag"><Fragment set:html={getTagIconSvg(t)} />{t}</span>)}
          </div>
          <h2><a href={`/projects/${p.id}/`}>{p.data.title}</a></h2>
          <p>{p.data.tagline}</p>
```

to:

```astro
        <li data-canvas-repo={p.data.repo}>
          <div class="project-grid__tags">
            {p.data.tags.map((t) => <span class="tag"><Fragment set:html={getTagIconSvg(t)} />{t}</span>)}
            {p.data.repo && <span data-canvas-status-slot></span>}
          </div>
          <h2><a href={`/projects/${p.id}/`} data-canvas-title>{p.data.title}</a></h2>
          <p data-canvas-description>{p.data.tagline}</p>
```

`data-canvas-repo={p.data.repo}` is `undefined` for the 2 entries with no `repo` field (`psychidn`, `rebirth`) — Astro omits the attribute entirely in that case, so `initCanvasStatus`'s `querySelectorAll('[data-canvas-repo]')` never selects those `<li>`s. Only the pill slot is conditional on `p.data.repo` truthiness for clarity, since the empty span is meaningless without a repo to fetch.

- [ ] **Step 2: Verify with a build + browser check**

Run: `node_modules/.bin/astro build`
Expected: build succeeds, `dist/projects/index.html` exists.

Run `node_modules/.bin/astro preview` in the background, use the claude-in-chrome tool to open `http://localhost:4321/projects`, and confirm via `read_page`/`get_page_text` that all 8 repo-bearing cards (aegis, orderflow-rs, som-plus, torch-inference, kolosal-automl, tribe-playground, chain-reaction-simulation, faction-app) render exactly as before (no visible pill, since none of these repos actually have `canvas/data.json` yet — this proves the "no data" path is silent, not broken) and that `psychidn`/`rebirth` cards are unaffected. Stop the preview server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/projects/index.astro
git commit -m "feat: wire canvas-status data attributes into project listing cards"
```

---

### Task 4: Wire into project detail page header

**Files:**
- Modify: `src/pages/projects/[slug].astro:22-29` (the `proj-hero` section)

**Interfaces:**
- Consumes: same `data-canvas-*` contract as Task 3.

- [ ] **Step 1: Add the data attributes and slot**

In `src/pages/projects/[slug].astro`, change:

```astro
  <section class="proj-hero container">
    <a href="/projects" class="proj-breadcrumb">Back to Portfolio</a>
    <div class="proj-hero__tags">
      {data.tags.map((t) => <Tag label={t} />)}
    </div>
    <h1>{data.title}</h1>
    <p class="proj-hero__subtitle">{data.tagline}</p>
  </section>
```

to:

```astro
  <section class="proj-hero container" data-canvas-repo={data.repo}>
    <a href="/projects" class="proj-breadcrumb">Back to Portfolio</a>
    <div class="proj-hero__tags">
      {data.tags.map((t) => <Tag label={t} />)}
      {data.repo && <span data-canvas-status-slot></span>}
    </div>
    <h1 data-canvas-title>{data.title}</h1>
    <p class="proj-hero__subtitle" data-canvas-description>{data.tagline}</p>
  </section>
```

- [ ] **Step 2: Verify with a build + browser check**

Run: `node_modules/.bin/astro build`
Expected: build succeeds, output reports `28 page(s) built` (this task only edits markup on an existing page, it doesn't add or remove pages — 28 is the current total, confirmed by this session's last successful build).

Run `node_modules/.bin/astro preview` in the background, use claude-in-chrome to open `http://localhost:4321/projects/aegis`, and confirm the `.proj-hero` section renders unchanged (no pill, since `aegis` has no `canvas/data.json` yet) and `data-canvas-repo` is present in the page source (via `read_page`) with value `https://github.com/Evintkoo/aegis`. Also open `http://localhost:4321/projects/psychidn` and confirm no `data-canvas-repo` attribute is present (no `repo` field). Stop the preview server.

- [ ] **Step 3: Commit**

```bash
git add "src/pages/projects/[slug].astro"
git commit -m "feat: wire canvas-status data attributes into project detail header"
```

---

### Task 5: Thread `repo` through the mindmap and wire leaf notes

**Files:**
- Modify: `src/islands/mindmap.ts:16-42` (`MindmapLeaf` interface), `:183-282` (`appendNote`)
- Modify: `src/pages/index.astro:66-71` (`MindmapLeafData` interface + `byTopic` push)

**Interfaces:**
- Consumes: same `data-canvas-repo`/`data-canvas-status-slot`/`data-canvas-title`/`data-canvas-description` contract as Tasks 3–4, applied to DOM nodes created by `appendNote` instead of server-rendered Astro markup.
- Produces: `MindmapLeaf.repo?: string` (new optional field), read by `appendNote`.

- [ ] **Step 1: Add `repo` to `MindmapLeaf`**

In `src/islands/mindmap.ts`, in the `MindmapLeaf` interface (around line 39-42), add a new field after `description`:

```ts
  description?: string;
  // GitHub repo URL, e.g. "https://github.com/Evintkoo/aegis" — only set on
  // project leaves with a `repo:` frontmatter field. When present,
  // appendNote tags the rendered card with data-canvas-repo so
  // src/islands/canvas-status.ts can inject a live status pill.
  repo?: string;
  href?: string;
  id?: string;
```

- [ ] **Step 2: Tag the rendered card in `appendNote`**

In `src/islands/mindmap.ts`, inside `appendNote` (around line 207-238, right after `card.className = classes.join(' ');`), add:

```ts
  const card = document.createElement('div');
  card.className = classes.join(' ');
  if (entry.repo) card.dataset.canvasRepo = entry.repo;
```

Then, in the same function, right after `header.appendChild(title);` (around line 237), add the status slot and mark the title element so `canvas-status.ts` can find it:

```ts
  const title = document.createElement('div');
  title.className = 'mindmap-note__title';
  title.textContent = entry.title;
  if (entry.repo) title.dataset.canvasTitle = '';
  header.appendChild(title);
  if (entry.repo) {
    const statusSlot = document.createElement('span');
    statusSlot.dataset.canvasStatusSlot = '';
    header.appendChild(statusSlot);
  }
  card.appendChild(header);
```

The description element (`desc`) is created once, before the `hasLink` branch splits into inline-node parsing vs. plain text — tag it there so both branches are covered by one line. Change:

```ts
    const desc = document.createElement('div');
    desc.className = 'mindmap-note__desc';
```

to:

```ts
    const desc = document.createElement('div');
    desc.className = 'mindmap-note__desc';
    if (entry.repo) desc.dataset.canvasDescription = '';
```

(this line goes immediately before the existing `if (hasLink) { ... } else { ... }` block, around line 244-245).

- [ ] **Step 3: Add a header flex layout so the pill sits beside the title**

In `src/styles/global.css`, modify the existing `#mindmapContainer .mindmap-note__header` rule (around line 295-300) to lay its children out horizontally:

```css
#mindmapContainer .mindmap-note__header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 5px 10px;
  background: color-mix(in srgb, var(--accent) 16%, var(--paper-raised));
  border-bottom: 1px solid var(--border);
}
```

- [ ] **Step 4: Pass `repo` from `index.astro` into the leaf data**

In `src/pages/index.astro`, change the `MindmapLeafData` interface (line 66):

```ts
interface MindmapLeafData { title: string; description: string; href: string; repo?: string }
```

And the push into `byTopic` (line 71):

```ts
    byTopic[p.data.topic].push({ title: p.data.title, description: p.data.tagline, href: `/projects/${p.id}/`, repo: p.data.repo });
```

- [ ] **Step 5: Verify with a build + browser check**

Run: `node_modules/.bin/astro build`
Expected: build succeeds.

Run `node_modules/.bin/astro preview` in the background, use claude-in-chrome to open `http://localhost:4321/`, expand the hero mindmap, and inspect one project leaf note (e.g. "orderflow-rs" under the Finance branch) via `read_page`: confirm its rendered `<div>` carries `data-canvas-repo="https://github.com/Evintkoo/orderflow-rs"`, its title element carries `data-canvas-title`, and an empty `data-canvas-status-slot` span sits in the header (no visible pill, since the repo has no `canvas/data.json` yet). Confirm a research leaf note (no `repo` field on that data path at all) has none of these attributes. Stop the preview server.

- [ ] **Step 6: Commit**

```bash
git add src/islands/mindmap.ts src/pages/index.astro src/styles/global.css
git commit -m "feat: thread repo through mindmap leaves for live canvas status"
```

---

### Task 6: Final integration check

**Files:** none (verification only)

- [ ] **Step 1: Full build**

Run: `node_modules/.bin/astro build`
Expected: 0 errors, same page count as the pre-feature build (28 pages, per Task 4's note) plus no new pages.

- [ ] **Step 2: Cross-surface dedup check**

Run `node_modules/.bin/astro preview` in the background. Use claude-in-chrome's `read_network_requests` after loading `http://localhost:4321/projects/orderflow-rs` (which has both the detail-page header `data-canvas-repo` AND, if the homepage mindmap were on the same page load, would double-fetch — but since the detail page alone only has one `data-canvas-repo="https://github.com/Evintkoo/orderflow-rs"` element, this instead confirms exactly one request to `raw.githubusercontent.com/Evintkoo/orderflow-rs/main/canvas/data.json` fires, not zero and not more than one).

Then load `http://localhost:4321/` (homepage) and expand the mindmap: confirm from `read_network_requests` that each distinct project repo shown in the mindmap fires exactly one `raw.githubusercontent.com` request even though `canvas-status.ts` runs once globally per page — this is the dedup path (`byRepo` Map in `initCanvasStatus`) doing its job when a repo's card and its mindmap leaf ever coexist on one page load (they don't today on any single page, but this confirms the mechanism holds for when they do).

Stop the preview server.

- [ ] **Step 3: Confirm no regressions in existing pages**

Use claude-in-chrome to spot-check `http://localhost:4321/projects` and `http://localhost:4321/projects/psychidn` (a no-repo project) render identically to before this feature (no console errors, no layout shift from the pill markup on entries without a repo).

This task has no commit of its own — it's a verification gate over Tasks 1-5's commits.
