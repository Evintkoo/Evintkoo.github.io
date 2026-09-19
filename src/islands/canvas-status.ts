import { fetchCanvasData, deriveRepoLink, type CanvasData, type CanvasNodeData } from '../lib/canvas-data';
import { renderInlineDescription, applyRootCoverage } from './mindmap';

const STATUS_LABEL: Record<CanvasData['status'], string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  testing: 'Testing',
  done: 'Done',
};

// One glyph per status instead of a plain colored dot — three share a
// circle base (planned/in-progress/done) so the family reads as one
// system, each finished by a different mark (empty / clock hands /
// checkmark); testing breaks that base deliberately for a beaker, since
// "running a test" is genuinely a different kind of state than a point on
// a timeline. Same convention as every other icon in this file's own tree
// (see `FULLSCREEN_ICON`/`FULLSCREEN_EXIT_ICON` in mindmap.ts): raw inner
// markup for a `viewBox="0 0 24 24"`, `stroke="currentColor"` SVG.
const STATUS_ICON: Record<CanvasData['status'], string> = {
  planned: '<circle cx="12" cy="12" r="9"/>',
  'in-progress': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  testing: '<path d="M9 2h6"/><path d="M10 2v6.5L4.8 18a2 2 0 0 0 1.75 3h10.9a2 2 0 0 0 1.75-3L14 8.5V2"/><path d="M6.5 14h11"/>',
  done: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.3l2.3 2.3L15.5 9.5"/>',
};

// A small status CARD (icon + label on a bordered, tinted surface), not a
// bare outlined pill — floats above a note's corner (see
// `.mindmap-note__canvas-slot`), so it needs to read as its own object at
// a glance, not just a thin outline that can vanish against the canvas's
// dot-grid backdrop.
function renderPill(status: CanvasData['status']): HTMLElement {
  const card = document.createElement('span');
  card.className = `canvas-status-badge canvas-status-badge--${status}`;
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');
  icon.classList.add('canvas-status-badge__icon');
  icon.innerHTML = STATUS_ICON[status];
  card.appendChild(icon);
  card.appendChild(document.createTextNode(STATUS_LABEL[status]));
  return card;
}

// Shared by both the top-level repo/paper card (its own status/title/desc)
// and a single sub-node within that same repo's canvas (looked up from
// `data.nodes[nodeId]` — see applyNodeData below). Both shapes carry the
// same status/title/description/path fields, just at different granularity.
function applyCanvasData(el: HTMLElement, data: CanvasNodeData): void {
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
    const descEl = el.querySelector<HTMLElement>('[data-canvas-description]');
    // Uses the same `<inode id="...">` parser the initial render does
    // (src/islands/mindmap.ts's `renderInlineDescription`) instead of
    // plain `textContent` — a canvas/data.json override can carry the same
    // markup and get the same highlighted, connected phrase, on a linked
    // note or not. The caller re-wires connections afterward (see
    // `initCanvasStatus`'s `rewire` param) since this can introduce or
    // change `.mindmap-inode` spans after the initial connection pass ran.
    // `applyRootCoverage` re-runs the root's own `ensureFullCoverage` pass
    // against this override first — a repo's canvas/data.json description
    // has no reason to know about `<inode>` hub-coverage markup at all, so
    // without this the override would silently delete every root→hub
    // connector the moment live data resolves (a no-op for any element
    // that isn't the root, e.g. a leaf/hub override).
    if (descEl) renderInlineDescription(descEl, applyRootCoverage(el, data.description));
  }
  // A repo can declare/update its own `path` live in canvas/data.json,
  // instead of (or in addition to) the MDX-authored `repoPath` — see
  // mindmap.ts's `appendNote`, which stores the tools button's CURRENT
  // link in `dataset.repoLink` (read at click time, not baked into a
  // closure) plus the bare root repo in `dataset.repoRoot` specifically so
  // this can recompute and overwrite it here, live.
  if (data.path) {
    const toolsBtn = el.querySelector<HTMLElement>('.mindmap-note__tools-btn');
    const rootRepo = toolsBtn?.dataset.repoRoot;
    const link = rootRepo ? deriveRepoLink(rootRepo, data.path) : undefined;
    if (toolsBtn && link) toolsBtn.dataset.repoLink = link;
  }
}

// A canvas that belongs to one repo (a paper's own methodology breakdown,
// see MindmapData.repo in src/islands/mindmap.ts) can give each of its own
// sub-nodes an independent status via canvas/data.json's `nodes` map,
// keyed by the note's own id (see mindmap.ts's `slugify` fallback). There
// is only ever one such canvas per page (the homepage's site-wide map has
// no owning repo, so `data.nodes` never resolves there), so it's safe to
// scan the whole document rather than scope to a specific container.
// Returns the ids actually found on THIS page (see `deriveLocalStatus`).
function applyNodeData(data: CanvasData): string[] {
  if (!data.nodes) return [];
  const found: string[] = [];
  const nodeElements = document.querySelectorAll<HTMLElement>('[data-canvas-node-id]');
  for (const el of nodeElements) {
    const nodeId = el.dataset.canvasNodeId;
    if (!nodeId) continue;
    const nodeData = data.nodes[nodeId];
    if (nodeData) {
      applyCanvasData(el, nodeData);
      found.push(nodeId);
    }
  }
  return found;
}

// Weakest-first: a paper's own root badge should read as its LEAST
// complete listed component, not paper over it — see `deriveLocalStatus`.
const STATUS_SEVERITY: Record<CanvasData['status'], number> = {
  planned: 0,
  'in-progress': 1,
  testing: 2,
  done: 3,
};

// Multiple papers/projects can share ONE repo (e.g. two papers whose
// methodology both lives in the same library) — canvas/data.json only has
// ONE top-level `status` for that whole repo, which is only ever accurate
// for ONE of them. When THIS page renders its own node-level breakdown
// (`nodeIds` — the ids `applyNodeData` actually matched on this exact
// page), this paper's own root badge should reflect ITS OWN listed
// components' worst status, not the repo-wide blanket flag, which may
// describe a completely different paper/feature set sharing the same
// repo. Falls back to the blanket `data.status` when this page has no
// local node breakdown at all (e.g. a homepage leaf card, or a repo with
// only ever one consumer) — there's nothing more specific to prefer there.
function deriveLocalStatus(data: CanvasData, nodeIds: string[]): CanvasData['status'] {
  if (nodeIds.length === 0 || !data.nodes) return data.status;
  let worst: CanvasData['status'] = 'done';
  for (const id of nodeIds) {
    const status = data.nodes[id]?.status;
    if (status && STATUS_SEVERITY[status] < STATUS_SEVERITY[worst]) worst = status;
  }
  return worst;
}



// initCanvasStatus() can be called more than once on the same page (see
// src/islands/mindmap.ts's initMindmap, which re-triggers a scan after
// building its own data-canvas-repo elements, since Layout.astro's global
// call runs before that DOM exists). This cache makes repeat calls share
// one fetch per repo per page, instead of re-fetching on every call.
const fetchCache = new Map<string, Promise<CanvasData | null>>();

// `prefetched`: repo → CanvasData resolved at BUILD time (see
// `buildCanvasPrefetch` in src/lib/canvas-data.ts), embedded in the page by
// whichever .astro page built this mindmap. This is the ONLY way a
// PRIVATE repo's data ever reaches this island — `fetchCanvasData` is a
// plain unauthenticated request, which can't read one no matter what
// canvas/data.json contains. Seeding only fills the cache the FIRST time a
// repo is looked up (see `getCanvasData`) — a public repo not covered by
// the prefetch still gets a genuine live fetch, same as always. Exported
// so mindmap.ts's own live TREE resolution (see `initMindmap`) can seed
// the cache BEFORE `render()` runs, not just after it like the per-node
// status overlay below does.
export function seedCanvasPrefetch(prefetched: Record<string, CanvasData>): void {
  for (const [repo, data] of Object.entries(prefetched)) {
    if (!fetchCache.has(repo)) fetchCache.set(repo, Promise.resolve(data));
  }
}

// Exported so mindmap.ts's `initMindmap` can resolve a repo's live
// `branches` tree (see `buildMindmapBreakdown`) through the SAME cache this
// module's own per-node status overlay uses below — one fetch per repo per
// page load, not two.
export function getCanvasData(repo: string): Promise<CanvasData | null> {
  let promise = fetchCache.get(repo);
  if (!promise) {
    promise = fetchCanvasData(repo);
    fetchCache.set(repo, promise);
  }
  return promise;
}

// `rewireConnections`: src/islands/mindmap.ts's own connector-redraw pass
// (the same one dragging a card triggers), passed in by `initMindmap` after
// `render()` builds the map. A canvas/data.json override can introduce or
// change `<inode>` markup in a description (see `applyCanvasData` above)
// after the initial, synchronous connection-wiring pass already ran — this
// is what picks that up, so an overridden description's links actually get
// drawn rather than just sitting there as an inert highlighted span.
// `prefetched`: see `seedCanvasPrefetch` above.
export function initCanvasStatus(rewireConnections?: () => void, prefetched?: Record<string, CanvasData>): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-canvas-repo]'));
  if (elements.length === 0) return;

  if (prefetched) seedCanvasPrefetch(prefetched);

  const byRepo = new Map<string, HTMLElement[]>();
  for (const el of elements) {
    const repo = el.dataset.canvasRepo;
    if (!repo) continue;
    const list = byRepo.get(repo) ?? [];
    list.push(el);
    byRepo.set(repo, list);
  }

  for (const [repo, els] of byRepo) {
    getCanvasData(repo).then((data) => {
      if (!data) return;
      const localNodeIds = applyNodeData(data);
      const rootData = { ...data, status: deriveLocalStatus(data, localNodeIds) };
      for (const el of els) {
        applyCanvasData(el, rootData);
        // The FULL `data.nodes` (every sub-feature this repo lists, not
        // just `localNodeIds` — the ones rendered on THIS page), so the
        // "go to repo" popup's progress readout (see `getCanvasProgress`,
        // mindmap.ts's `createGoToPopup`) reflects the repo's whole
        // breakdown even from a page that only shows a subset of it (a
        // homepage leaf card, which has no node-level cards of its own).
        if (data.nodes) nodesByWrapper.set(el, data.nodes);
      }
      rewireConnections?.();
    });
  }
}

// wrapper element → that repo's FULL `nodes` map, for `getCanvasProgress`
// below. A WeakMap, not a plain object: these wrappers can be dropped
// (rebuilt on re-render), and a plain map would hold onto every one that
// ever existed for the page's whole lifetime.
const nodesByWrapper = new WeakMap<HTMLElement, Record<string, CanvasNodeData>>();

export interface CanvasProgress {
  total: number;
  byStatus: Record<CanvasData['status'], number>;
}

// The status breakdown across every sub-feature this card's own repo
// lists — "like a ticketing system", per the feature request this exists
// for: not just "what's the headline status" but "how much of this is
// actually done". Returns null when this card's repo either hasn't
// resolved yet or never published a per-feature breakdown at all (a
// `status`-only canvas/data.json) — the caller treats null as "nothing to
// show", same as a card with no repo in the first place.
export function getCanvasProgress(wrapper: HTMLElement): CanvasProgress | null {
  const nodes = nodesByWrapper.get(wrapper);
  if (!nodes) return null;
  const byStatus: Record<CanvasData['status'], number> = { planned: 0, 'in-progress': 0, testing: 0, done: 0 };
  let total = 0;
  for (const node of Object.values(nodes)) {
    byStatus[node.status]++;
    total++;
  }
  return total > 0 ? { total, byStatus } : null;
}
