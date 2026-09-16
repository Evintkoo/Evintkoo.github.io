// ─────────────────────────────────────────────
//  Mindmap — per-page topic concept graph
//  Ported from assets/js/mindmap.js (worktree root).
//  Renders an SVG radial graph: center → topic
//  branches → leaf nodes (project/research titles).
//  Data is now computed server-side (see
//  src/pages/research/[slug].astro) instead of the
//  old client-side buildMindmap() in assets/js/data.js.
// ─────────────────────────────────────────────

export interface MindmapBranch {
  label: string;
  nodes: string[];
}

export interface MindmapData {
  center: string;
  branches: MindmapBranch[];
}

// The old site had four accent CSS variables (--accent-warm, --accent-sage,
// --accent-secondary, --accent-tertiary) to color-rotate branches. The
// rebrand's token set (src/styles/tokens.css) defines a single --accent, so
// branches all share it — this is a deliberate simplification for the new
// token system, not a missed port.
const ACCENTS = ['--accent'];
const W = 900;
const H = 620;
const CX = 450;
const CY = 310;
const CR = 58;
const BR = 32;
const LR = 7;
const BDIST = 168;
const LDIST = 108;
const FAN = Math.PI / 9;

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      e.setAttribute(k, String(attrs[k]));
    }
  }
  return e;
}

// Multi-line text centered on (x, y)
function appendCenteredText(
  parent: SVGElement,
  str: string,
  x: number,
  y: number,
  size: number,
  weight: string,
  fill: string,
  delay: number,
): void {
  const words = str.split(' ');
  const lines =
    str.length > 9 && words.length > 1
      ? [
          words.slice(0, Math.ceil(words.length / 2)).join(' '),
          words.slice(Math.ceil(words.length / 2)).join(' '),
        ]
      : [str];
  const lh = size + 2;
  lines.forEach((line, i) => {
    const t = svgEl('text', {
      x,
      y: y + (i - (lines.length - 1) / 2) * lh,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      'font-family': 'Plus Jakarta Sans, sans-serif',
      'font-size': size,
      'font-weight': weight,
      fill,
      class: 'mindmap-node',
      style: 'animation-delay:' + delay + 'ms',
      'pointer-events': 'none',
    });
    t.textContent = line;
    parent.appendChild(t);
  });
}

// Leaf label placed outside the dot in the outward direction
function appendLeafLabel(
  parent: SVGElement,
  str: string,
  lx: number,
  ly: number,
  angle: number,
  size: number,
  weight: string,
  fill: string,
  delay: number,
): void {
  const pad = LR + 8;
  const tx = lx + pad * Math.cos(angle);
  const ty = ly + pad * Math.sin(angle);
  const cosA = Math.cos(angle);
  const anchor = Math.abs(cosA) >= 0.36 ? (cosA > 0 ? 'start' : 'end') : 'middle';
  const words = str.split(' ');
  const lines =
    str.length > 9 && words.length > 1
      ? [
          words.slice(0, Math.ceil(words.length / 2)).join(' '),
          words.slice(Math.ceil(words.length / 2)).join(' '),
        ]
      : [str];
  const lh = size + 2;
  lines.forEach((line, i) => {
    const t = svgEl('text', {
      x: tx,
      y: ty + (i - (lines.length - 1) / 2) * lh,
      'text-anchor': anchor,
      'dominant-baseline': 'middle',
      'font-family': 'Plus Jakarta Sans, sans-serif',
      'font-size': size,
      'font-weight': weight,
      fill,
      class: 'mindmap-node',
      style: 'animation-delay:' + delay + 'ms',
      'pointer-events': 'none',
    });
    t.textContent = line;
    parent.appendChild(t);
  });
}

// Returns accent if bright enough for dark bg, else falls back to textTertiary
function visibleStroke(accent: string, fallback: string): string {
  const hex = accent.replace(/^#/, '');
  if (hex.length !== 6) {
    return fallback;
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 0.18 ? fallback : accent;
}

function render(data: MindmapData, container: HTMLElement): void {
  const textPrimary = css('--ink');
  const textSecondary = css('--ink-soft');
  const textTertiary = css('--ink-faint');
  const bgSecondary = css('--paper-raised');
  const n = data.branches.length;

  const svg = svgEl('svg', {
    viewBox: '0 0 ' + W + ' ' + H,
    xmlns: 'http://www.w3.org/2000/svg',
    role: 'img',
    'aria-label': data.center + ' concept map',
  });

  // Layer order: lines → leaf nodes + labels → branch nodes + labels → center
  const lineLayer = svgEl('g', {});
  const leafLayer = svgEl('g', {});
  const branchLayer = svgEl('g', {});
  const centerLayer = svgEl('g', {});
  svg.appendChild(lineLayer);
  svg.appendChild(leafLayer);
  svg.appendChild(branchLayer);
  svg.appendChild(centerLayer);

  let lDelay = 0;
  const nOffset = n * 55 + 60;

  data.branches.forEach((branch, i) => {
    const angle = -Math.PI / 2 + Math.PI / n + i * ((2 * Math.PI) / n);
    const bx = CX + BDIST * Math.cos(angle);
    const by = CY + BDIST * Math.sin(angle);
    const accent = css(ACCENTS[i % ACCENTS.length]);

    // Center → branch: always-visible spine (border ≈ bg so use text-tertiary)
    const cp1x = CX + (bx - CX) * 0.35;
    const cp1y = CY + (by - CY) * 0.05;
    const cp2x = CX + (bx - CX) * 0.65;
    const cp2y = CY + (by - CY) * 0.95;
    lineLayer.appendChild(
      svgEl('path', {
        d: 'M' + CX + ',' + CY + ' C' + cp1x + ',' + cp1y + ' ' + cp2x + ',' + cp2y + ' ' + bx + ',' + by,
        stroke: textTertiary,
        'stroke-width': '2',
        fill: 'none',
        opacity: '0.55',
        'stroke-linecap': 'round',
        class: 'mindmap-line',
        style: 'animation-delay:' + lDelay + 'ms',
      }),
    );
    lDelay += 55;

    if (!Array.isArray(branch.nodes)) {
      return;
    }
    const ln = branch.nodes.length;
    branch.nodes.forEach((node, j) => {
      const fa = angle + (j - (ln - 1) / 2) * FAN;
      const lx = bx + LDIST * Math.cos(fa);
      const ly = by + LDIST * Math.sin(fa);

      // Branch → leaf: fall back to textTertiary if accent is too dark to see
      const lineColor = visibleStroke(accent, textTertiary);
      lineLayer.appendChild(
        svgEl('line', {
          x1: bx,
          y1: by,
          x2: lx,
          y2: ly,
          stroke: lineColor,
          'stroke-width': '1.5',
          opacity: '0.6',
          'stroke-linecap': 'round',
          class: 'mindmap-line',
          style: 'animation-delay:' + (lDelay + j * 18) + 'ms',
        }),
      );

      const nd = nOffset + i * 50 + j * 28;
      // Leaf dot — use visible stroke fallback for dark accents
      const dotColor = visibleStroke(accent, textTertiary);
      leafLayer.appendChild(
        svgEl('circle', {
          cx: lx,
          cy: ly,
          r: LR,
          fill: dotColor,
          opacity: '0.3',
          stroke: dotColor,
          'stroke-width': '1.5',
          class: 'mindmap-node',
          style: 'animation-delay:' + nd + 'ms',
        }),
      );
      // Leaf label outside the dot, pointing away from center
      const outAngle = Math.atan2(ly - CY, lx - CX);
      appendLeafLabel(leafLayer, node, lx, ly, outAngle, 8.5, '500', textSecondary, nd + 15);
    });
    lDelay += ln * 18;

    // Branch circle + label (rendered above leaves)
    const bd = nOffset + i * 50;
    branchLayer.appendChild(
      svgEl('circle', {
        cx: bx,
        cy: by,
        r: BR,
        fill: accent,
        class: 'mindmap-node',
        style: 'animation-delay:' + bd + 'ms',
      }),
    );
    appendCenteredText(branchLayer, branch.label, bx, by, 9.5, '700', '#ffffff', bd + 15);
  });

  // Center node — always on top
  centerLayer.appendChild(
    svgEl('circle', {
      cx: CX,
      cy: CY,
      r: CR,
      fill: bgSecondary,
      stroke: textTertiary,
      'stroke-width': '1.5',
      opacity: '0.5',
      class: 'mindmap-node',
      style: 'animation-delay:0ms',
    }),
  );
  appendCenteredText(centerLayer, data.center, CX, CY, 13.5, '700', textPrimary, 0);

  container.appendChild(svg);
}

export function initMindmap(container: HTMLElement, data: MindmapData): void {
  if (!data || !Array.isArray(data.branches) || data.branches.length === 0) {
    return;
  }
  render(data, container);
}
