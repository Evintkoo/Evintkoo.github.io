// ─────────────────────────────────────────────
//  Research chart — hand-rolled, dependency-free
//  SVG line/bar chart (no charting library).
//  Ported from assets/js/chart.js (worktree root),
//  a self-contained window.EChart(container, cfg)
//  factory. Theme-aware (reads CSS tokens),
//  supports linear/log Y-axis, a legend with
//  click-to-toggle series visibility, and a hover
//  crosshair + tooltip.
// ─────────────────────────────────────────────

// The old site rotated series color across four accent CSS variables
// (--accent-warm, --accent-sage, --accent-secondary, --accent-tertiary).
// The rebrand's token set (src/styles/tokens.css) defines a single
// --accent, so all series fall back to it when no explicit `color` is
// given — the same "Technical Editorial" single-accent simplification
// ruling already applied to the mindmap's branch colors in
// src/islands/mindmap.ts. This is a deliberate simplification, not a
// missed port.
const PALETTE = ['--accent'];

export interface ResearchChartSeriesConfig {
  name?: string;
  values: number[];
  /** Explicit series color (CSS color string). Falls back to the
   *  palette (currently just --accent) when omitted. */
  color?: string;
}

export interface ResearchChartConfig {
  /** Chart height in px. Default 360. */
  height?: number;
  /** Use a logarithmic Y-axis scale. Default false (linear). */
  logY?: boolean;
  /** Render mode. Default 'line'. */
  type?: 'line' | 'bar';
  /** X-axis values, one per data point. Points are spaced evenly by
   *  index — xs[i] is only read for axis/tooltip labels via formatX,
   *  not used for horizontal positioning. */
  xs: number[];
  series: ResearchChartSeriesConfig[];
  /** Formats an x-axis / tooltip-header label. Default: identity. */
  formatX?: (x: number, i: number) => string | number;
  /** Formats a y-axis tick / tooltip value. Default: Math.round. */
  formatY?: (y: number) => string | number;
  /** Bar-mode value label formatter. Falls back to formatY. */
  formatValue?: (v: number) => string | number;
}

export interface ResearchChartHandle {
  destroy: () => void;
}

interface Series {
  name: string;
  values: number[];
  color: string;
  visible: boolean;
  path?: SVGPathElement;
  elems?: SVGElement[];
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Tracks each chart's ResizeObserver by container so destroy() can
// disconnect it without stashing an ad-hoc property on the DOM node.
const resizeObservers = new WeakMap<HTMLElement, ResizeObserver>();

function css(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
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

function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = norm < 1.5 ? 1 * mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
}

function niceLogTicks(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let e = Math.floor(lo); e <= Math.ceil(hi); e++) out.push(e);
  return out;
}

export function initResearchChart(
  container: HTMLElement,
  config: ResearchChartConfig,
): ResearchChartHandle | null {
  if (!container) return null;
  const cfg = config || ({ xs: [], series: [] } as ResearchChartConfig);
  const height = cfg.height || 360;
  const logY = !!cfg.logY;
  const xs = cfg.xs || [];
  const fmtX = cfg.formatX || ((x: number) => x);
  const fmtY = cfg.formatY || ((y: number) => Math.round(y));
  const fmtValue = cfg.formatValue || fmtY;
  const series: Series[] = (cfg.series || []).map((s, i) => ({
    name: s.name || `Series ${i + 1}`,
    values: s.values.slice(),
    color: s.color || css(PALETTE[i % PALETTE.length], '#888'),
    visible: true,
  }));

  const M: Margin = { top: 16, right: 18, bottom: 38, left: 58 };

  const cTextT = css('--ink-faint', '#888');
  const cBorder = css('--border', '#ddd');
  const cPanel = css('--paper-raised', '#fff');

  const H = height;
  let W = 0;
  let plotW = 0;
  let plotH = 0;
  let n = 0;
  let yMin = 0;
  let yMax = 0;
  let lastW = -1;

  let svg: SVGSVGElement;
  let tooltip: HTMLDivElement;
  let hoverLine: SVGLineElement;
  let dots: SVGCircleElement[] = [];

  function domain(): void {
    n = xs.length;
    let lo = Infinity;
    let hi = -Infinity;
    series.forEach((s) => {
      s.values.forEach((v) => {
        const vv = logY ? Math.log(Math.max(1e-9, v)) : v;
        if (vv < lo) lo = vv;
        if (vv > hi) hi = vv;
      });
    });
    if (!isFinite(lo)) {
      lo = 0;
      hi = 1;
    }
    const pad = (hi - lo) * 0.08;
    yMin = lo - pad;
    yMax = hi + pad;
  }

  function sy(v: number): number {
    const vv = logY ? Math.log(Math.max(1e-9, v)) : v;
    return M.top + (1 - (vv - yMin) / (yMax - yMin)) * plotH;
  }

  function sx(i: number): number {
    return M.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  }

  function build(): void {
    container.innerHTML = '';
    W = container.clientWidth || 600;
    lastW = W;
    plotW = W - M.left - M.right;
    plotH = H - M.top - M.bottom;
    domain();

    // Original set preserveAspectRatio:'none' then immediately removed
    // it (to keep axis text crisp while CSS width:100% stretches the
    // SVG) — net effect is no preserveAspectRatio attribute at all, so
    // it's simply omitted here.
    svg = svgEl('svg', {
      viewBox: `0 0 ${W} ${H}`,
      width: W,
      height: H,
      class: 'chart__svg',
    });
    container.appendChild(svg);

    const yt = logY ? niceLogTicks(yMin, yMax) : niceTicks(yMin, yMax, 5);
    yt.forEach((t) => {
      const yy = M.top + (1 - (t - yMin) / (yMax - yMin)) * plotH;
      if (yy < M.top - 1 || yy > M.top + plotH + 1) return;
      svg.appendChild(
        svgEl('line', {
          x1: M.left,
          x2: M.left + plotW,
          y1: yy,
          y2: yy,
          stroke: cBorder,
          'stroke-width': '1',
          'shape-rendering': 'crispEdges',
        }),
      );
      const lab = svgEl('text', {
        x: M.left - 10,
        y: yy + 3.5,
        'text-anchor': 'end',
        'font-size': '10.5',
        'font-family': 'JetBrains Mono, monospace',
        fill: cTextT,
      });
      lab.textContent = String(fmtY(logY ? Math.exp(t) : t));
      svg.appendChild(lab);
    });

    const xticks = 6;
    for (let k = 0; k <= xticks; k++) {
      const i = Math.round(((n - 1) * k) / xticks);
      const lab = svgEl('text', {
        x: sx(i),
        y: M.top + plotH + 20,
        'text-anchor': 'middle',
        'font-size': '10.5',
        'font-family': 'JetBrains Mono, monospace',
        fill: cTextT,
      });
      lab.textContent = String(fmtX(xs[i], i));
      svg.appendChild(lab);
    }
    svg.appendChild(
      svgEl('line', {
        x1: M.left,
        x2: M.left + plotW,
        y1: M.top + plotH,
        y2: M.top + plotH,
        stroke: cBorder,
        'stroke-width': '1.2',
      }),
    );

    if (cfg.type !== 'bar') {
      series.forEach((s) => {
        let d = '';
        for (let i = 0; i < n; i++) {
          d += (i === 0 ? 'M' : 'L') + sx(i).toFixed(1) + ',' + sy(s.values[i]).toFixed(1);
        }
        s.path = svgEl('path', {
          d,
          fill: 'none',
          stroke: s.color,
          'stroke-width': '2.4',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        });
        svg.appendChild(s.path);
      });
    }

    if (cfg.type === 'bar') {
      const sCount = series.length;
      const slot = n > 0 ? plotW / n : plotW;
      const groupW = slot * 0.62;
      const barW = Math.max(2, Math.min(36, groupW / Math.max(1, sCount)));
      const baseY = yMin < 0 && yMax > 0 ? sy(0) : M.top + plotH;
      series.forEach((s, k) => {
        s.elems = [];
        for (let i = 0; i < n; i++) {
          const cx = sx(i) + (sCount > 1 ? (k - (sCount - 1) / 2) * barW : 0);
          const yv = sy(s.values[i]);
          const top = Math.min(yv, baseY);
          const h = Math.max(1, Math.abs(yv - baseY));
          s.elems.push(
            svgEl('rect', {
              x: (cx - barW / 2).toFixed(1),
              y: top.toFixed(1),
              width: Math.max(1, barW - 1).toFixed(1),
              height: h.toFixed(1),
              fill: s.color,
              rx: '2',
              opacity: '0.92',
            }),
          );
          const lab = svgEl('text', {
            x: cx.toFixed(1),
            y: (top - 6).toFixed(1),
            'text-anchor': 'middle',
            'font-size': '10',
            'font-family': 'JetBrains Mono, monospace',
            fill: cTextT,
          });
          lab.textContent = String(fmtValue(s.values[i]));
          s.elems.push(lab);
        }
        s.elems.forEach((e) => svg.appendChild(e));
      });
    }

    hoverLine = svgEl('line', {
      x1: 0,
      x2: 0,
      y1: M.top,
      y2: M.top + plotH,
      stroke: cTextT,
      'stroke-width': '1',
      opacity: '0',
      'stroke-dasharray': '3 3',
    });
    svg.appendChild(hoverLine);
    dots = series.map((s) => {
      const c = svgEl('circle', {
        r: 3.5,
        fill: s.color,
        stroke: cPanel,
        'stroke-width': '1.5',
        opacity: '0',
      });
      svg.appendChild(c);
      return c;
    });

    const legend = document.createElement('div');
    legend.className = 'chart__legend';
    series.forEach((s) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chart__chip';
      chip.innerHTML = `<span class="chart__swatch" style="background:${s.color}"></span><span>${s.name}</span>`;
      chip.addEventListener('click', () => {
        s.visible = !s.visible;
        chip.classList.toggle('is-muted', !s.visible);
        const op = s.visible ? '1' : '0.12';
        if (s.path) s.path.style.opacity = op;
        if (s.elems) {
          s.elems.forEach((e) => {
            e.style.opacity = op;
          });
        }
      });
      legend.appendChild(chip);
    });
    container.appendChild(legend);

    tooltip = document.createElement('div');
    tooltip.className = 'chart__tooltip';
    tooltip.style.display = 'none';
    container.appendChild(tooltip);

    svg.style.cursor = 'crosshair';
    svg.addEventListener('mousemove', onMove);
    svg.addEventListener('mouseleave', hideHover);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (container.clientWidth === lastW) return;
        build();
      });
      ro.observe(container);
      resizeObservers.set(container, ro);
    }
  }

  function hideHover(): void {
    hoverLine.setAttribute('opacity', '0');
    dots.forEach((d) => d.setAttribute('opacity', '0'));
    tooltip.style.display = 'none';
  }

  function onMove(e: MouseEvent): void {
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    if (mx < M.left || mx > M.left + plotW) {
      hideHover();
      return;
    }
    const i = Math.max(0, Math.min(n - 1, Math.round(((mx - M.left) / plotW) * (n - 1))));
    const px = sx(i);
    hoverLine.setAttribute('x1', String(px));
    hoverLine.setAttribute('x2', String(px));
    hoverLine.setAttribute('opacity', '0.7');
    let rows = '';
    series.forEach((s, idx) => {
      dots[idx].setAttribute('cx', String(px));
      dots[idx].setAttribute('cy', String(sy(s.values[i])));
      dots[idx].setAttribute('opacity', s.visible ? '1' : '0');
      rows += `<div class="chart__tiprow"><span class="chart__dot" style="background:${s.color}"></span><span class="chart__tipname">${s.name}</span><span class="chart__tipval">${fmtY(s.values[i])}</span></div>`;
    });
    tooltip.innerHTML = `<div class="chart__tiphead">${fmtX(xs[i], i)}</div>${rows}`;
    tooltip.style.display = 'block';
    const rect2 = container.getBoundingClientRect();
    let leftPx = (px / W) * rect.width + 12;
    if (leftPx + tooltip.offsetWidth > rect.width) {
      leftPx = (px / W) * rect.width - tooltip.offsetWidth - 12;
    }
    tooltip.style.left = `${Math.max(4, leftPx)}px`;
    tooltip.style.top = `${e.clientY - rect2.top + 12}px`;
  }

  build();

  return {
    destroy(): void {
      const ro = resizeObservers.get(container);
      if (ro) {
        ro.disconnect();
        resizeObservers.delete(container);
      }
      container.innerHTML = '';
    },
  };
}
