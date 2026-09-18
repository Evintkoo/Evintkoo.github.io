import { fetchCanvasData, type CanvasData } from '../lib/canvas-data';

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
  if (data.description && !el.classList.contains('mindmap-note--linked')) {
    const descEl = el.querySelector('[data-canvas-description]');
    if (descEl) descEl.textContent = data.description;
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
    });
  }
}
