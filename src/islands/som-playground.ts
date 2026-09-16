// ─────────────────────────────────────────────
//  SOM Playground — in-browser Kohonen self-
//  organizing map on a 2D point cloud.
//  Canvas + sliders, pure JS logic, no dependencies.
//  Ported from assets/js/som-playground.js (worktree root).
//  Also reused by the som-tsk research page.
// ─────────────────────────────────────────────

type Point = [number, number];

interface GridNeuron {
  gx: number;
  gy: number;
  w: Point;
}

type DatasetType = 'blobs' | 'rings' | 'moons';

export function initSomPlayground(container: HTMLElement): void {
  const canvas = container.querySelector<HTMLCanvasElement>('#somCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sData = container.querySelector<HTMLSelectElement>('#somData');
  const sGrid = container.querySelector<HTMLInputElement>('#somGrid');
  const sLr = container.querySelector<HTMLInputElement>('#somLr');
  const sRad = container.querySelector<HTMLInputElement>('#somRad');
  const sEp = container.querySelector<HTMLInputElement>('#somEp');
  const lblGrid = container.querySelector<HTMLElement>('#somGridVal');
  const lblLr = container.querySelector<HTMLElement>('#somLrVal');
  const lblRad = container.querySelector<HTMLElement>('#somRadVal');
  const lblEp = container.querySelector<HTMLElement>('#somEpVal');
  const elEpoch = container.querySelector<HTMLElement>('#somEpoch');
  const elRun = container.querySelector<HTMLButtonElement>('#somRun');
  const elReset = container.querySelector<HTMLButtonElement>('#somReset');

  let W = 0;
  let H = 0;
  let dpr = 1;
  const PAD = 26;
  let data: Point[] = [];
  let grid: GridNeuron[] = [];
  let N = 6;
  let epoch = 0;
  let maxEpoch = 40;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function css(name: string, fb: string): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  }
  function gauss(): number {
    const u = Math.random() || 1e-9;
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp01(x: number): number {
    return Math.max(0.03, Math.min(0.97, x));
  }

  // ── datasets ──
  function genData(type: DatasetType, n = 300): Point[] {
    const d: Point[] = [];
    if (type === 'blobs') {
      const cs: Point[] = [
        [0.28, 0.32],
        [0.72, 0.3],
        [0.5, 0.74],
      ];
      for (let i = 0; i < n; i++) {
        const c = cs[i % cs.length];
        d.push([c[0] + 0.06 * gauss(), c[1] + 0.06 * gauss()]);
      }
    } else if (type === 'rings') {
      for (let i = 0; i < n; i++) {
        const r = i % 2 === 0 ? 0.22 : 0.42;
        const a = Math.random() * Math.PI * 2;
        d.push([
          0.5 + (r + 0.015 * gauss()) * Math.cos(a),
          0.5 + (r + 0.015 * gauss()) * Math.sin(a),
        ]);
      }
    } else {
      // moons
      for (let i = 0; i < n; i++) {
        const t = i % 2 === 0 ? Math.random() * Math.PI : Math.PI + Math.random() * Math.PI;
        const cx = i % 2 === 0 ? 0.34 : 0.66;
        const cy = i % 2 === 0 ? 0.42 : 0.58;
        d.push([cx + 0.32 * Math.cos(t) + 0.02 * gauss(), cy + 0.32 * Math.sin(t) + 0.02 * gauss()]);
      }
    }
    return d.map((p) => [clamp01(p[0]), clamp01(p[1])] as Point);
  }

  // ── SOM ──
  function initGrid(n: number): void {
    N = n;
    grid = [];
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        grid.push({
          gx,
          gy,
          w: [(gx + 0.5) / n + 0.05 * gauss(), (gy + 0.5) / n + 0.05 * gauss()],
        });
      }
    }
  }
  function bmu(x: Point): number {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < grid.length; i++) {
      const dx = grid[i].w[0] - x[0];
      const dy = grid[i].w[1] - x[1];
      const dd = dx * dx + dy * dy;
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    return best;
  }
  function trainEpoch(): void {
    const lr0 = parseFloat(sLr ? sLr.value : '0.3');
    const rad0 = parseFloat(sRad ? sRad.value : '3');
    const frac = epoch / Math.max(1, maxEpoch);
    const lr = lr0 * (1 - 0.75 * frac);
    const rad = Math.max(0.6, rad0 * (1 - 0.6 * frac));
    const order = data.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    for (let k = 0; k < order.length; k++) {
      const x = data[order[k]];
      const b = bmu(x);
      const bn = grid[b];
      for (let g = 0; g < grid.length; g++) {
        const ndx = grid[g].gx - bn.gx;
        const ndy = grid[g].gy - bn.gy;
        const gd = Math.sqrt(ndx * ndx + ndy * ndy);
        if (gd > rad) continue;
        const h = Math.exp(-(gd * gd) / (2 * rad * rad));
        grid[g].w[0] += lr * h * (x[0] - grid[g].w[0]);
        grid[g].w[1] += lr * h * (x[1] - grid[g].w[1]);
      }
    }
  }

  // ── rendering ──
  function px(x: number): number {
    return PAD + x * (W - 2 * PAD);
  }
  function py(y: number): number {
    return PAD + y * (H - 2 * PAD);
  }
  function colorFor(gx: number, gy: number): string {
    const hue = (300 + (gx / N) * 200 + (gy / N) * 120) % 360;
    return 'hsl(' + hue.toFixed(0) + ',68%,60%)';
  }
  function seg(a: GridNeuron, b: GridNeuron): void {
    ctx!.beginPath();
    ctx!.moveTo(px(a.w[0]), py(a.w[1]));
    ctx!.lineTo(px(b.w[0]), py(b.w[1]));
    ctx!.stroke();
  }
  function draw(): void {
    if (!W) return;
    const cBorder = css('--border', '#ddd');
    const cWarm = css('--accent', '#e11d64');
    const cBg = css('--paper', '#fff');
    ctx!.clearRect(0, 0, W, H);

    ctx!.lineWidth = 1;
    ctx!.strokeStyle = cBorder;
    ctx!.globalAlpha = 0.5;
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        const a = grid[gy * N + gx];
        if (gx < N - 1) seg(a, grid[gy * N + gx + 1]);
        if (gy < N - 1) seg(a, grid[(gy + 1) * N + gx]);
      }
    }
    ctx!.globalAlpha = 1;

    for (let i = 0; i < data.length; i++) {
      const b = bmu(data[i]);
      ctx!.fillStyle = colorFor(grid[b].gx, grid[b].gy);
      ctx!.globalAlpha = 0.85;
      ctx!.beginPath();
      ctx!.arc(px(data[i][0]), py(data[i][1]), 2.4, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;

    ctx!.lineWidth = 1.5;
    ctx!.strokeStyle = cBg;
    for (let g = 0; g < grid.length; g++) {
      ctx!.fillStyle = cWarm;
      ctx!.beginPath();
      ctx!.arc(px(grid[g].w[0]), py(grid[g].w[1]), 3.2, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.stroke();
    }
  }

  // ── loop ──
  function setRunLabel(): void {
    if (elRun) elRun.textContent = running ? 'Pause' : 'Run';
  }
  function step(): void {
    if (!running) return;
    if (epoch < maxEpoch) {
      trainEpoch();
      epoch++;
      if (elEpoch) elEpoch.textContent = epoch + ' / ' + maxEpoch;
      draw();
      timer = setTimeout(step, 45);
    } else {
      running = false;
      setRunLabel();
    }
  }
  function run(): void {
    if (epoch >= maxEpoch) {
      reset();
    }
    running = !running;
    setRunLabel();
    if (running) step();
    else if (timer) clearTimeout(timer);
  }
  function reset(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    running = false;
    setRunLabel();
    data = genData((sData ? sData.value : 'blobs') as DatasetType, 300);
    maxEpoch = sEp ? parseInt(sEp.value, 10) : 40;
    initGrid(sGrid ? parseInt(sGrid.value, 10) : 6);
    epoch = 0;
    if (elEpoch) elEpoch.textContent = '0 / ' + maxEpoch;
    draw();
  }

  function syncLabels(): void {
    if (lblGrid && sGrid) lblGrid.textContent = sGrid.value;
    if (lblLr && sLr) lblLr.textContent = parseFloat(sLr.value).toFixed(2);
    if (lblRad && sRad) lblRad.textContent = sRad.value;
    if (lblEp && sEp) lblEp.textContent = sEp.value;
  }

  // ── wiring ──
  if (sData) sData.addEventListener('change', reset);
  if (sGrid)
    sGrid.addEventListener('input', () => {
      syncLabels();
      reset();
    });
  if (sEp)
    sEp.addEventListener('input', () => {
      syncLabels();
      reset();
    });
  if (sLr) sLr.addEventListener('input', syncLabels);
  if (sRad) sRad.addEventListener('input', syncLabels);
  if (elRun) elRun.addEventListener('click', run);
  if (elReset) elReset.addEventListener('click', reset);

  function resize(): void {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas!.getBoundingClientRect();
    W = Math.max(220, Math.floor(rect.width));
    H = Math.max(220, Math.floor(W * 0.78));
    canvas!.width = W * dpr;
    canvas!.height = H * dpr;
    canvas!.style.height = H + 'px';
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  window.addEventListener('resize', resize);

  syncLabels();
  reset();
  resize();
}
