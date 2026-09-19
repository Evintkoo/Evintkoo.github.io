import { fetchCanvasData, type CanvasData, type CanvasNodeData } from '../lib/canvas-data';
import { renderInlineDescription } from './mindmap';

const STATUS_LABEL: Record<CanvasData['status'], string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  testing: 'Testing',
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

// Shared by both the top-level repo/paper card (its own status/title/desc)
// and a single sub-node within that same repo's canvas (looked up from
// `data.nodes[nodeId]` — see applyNodeData below). Both shapes carry the
// same status/title/description fields, just at different granularity.
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
    if (descEl) renderInlineDescription(descEl, data.description);
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

function getCanvasData(repo: string): Promise<CanvasData | null> {
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
export function initCanvasStatus(rewireConnections?: () => void): void {
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
    getCanvasData(repo).then((data) => {
      if (!data) return;
      const localNodeIds = applyNodeData(data);
      const rootData = { ...data, status: deriveLocalStatus(data, localNodeIds) };
      for (const el of els) applyCanvasData(el, rootData);
      rewireConnections?.();
    });
  }
}
