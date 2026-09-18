import { fetchCanvasData, type CanvasData, type CanvasNodeData } from '../lib/canvas-data';

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
  if (data.description && !el.classList.contains('mindmap-note--linked')) {
    const descEl = el.querySelector('[data-canvas-description]');
    if (descEl) descEl.textContent = data.description;
  }
}

// A canvas that belongs to one repo (a paper's own methodology breakdown,
// see MindmapData.repo in src/islands/mindmap.ts) can give each of its own
// sub-nodes an independent status via canvas/data.json's `nodes` map,
// keyed by the note's own id (see mindmap.ts's `slugify` fallback). There
// is only ever one such canvas per page (the homepage's site-wide map has
// no owning repo, so `data.nodes` never resolves there), so it's safe to
// scan the whole document rather than scope to a specific container.
function applyNodeData(data: CanvasData): void {
  if (!data.nodes) return;
  const nodeElements = document.querySelectorAll<HTMLElement>('[data-canvas-node-id]');
  for (const el of nodeElements) {
    const nodeId = el.dataset.canvasNodeId;
    if (!nodeId) continue;
    const nodeData = data.nodes[nodeId];
    if (nodeData) applyCanvasData(el, nodeData);
  }
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
    getCanvasData(repo).then((data) => {
      if (!data) return;
      for (const el of els) applyCanvasData(el, data);
      applyNodeData(data);
    });
  }
}
