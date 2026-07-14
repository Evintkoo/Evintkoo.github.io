// ─────────────────────────────────────────────
//  SOM Playground — in-browser Kohonen self-
//  organizing map on a 2D point cloud.
//  Canvas + sliders, pure JS, no dependencies.
// ─────────────────────────────────────────────

(function () {
  var canvas = document.getElementById('somCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var sData = document.getElementById('somData');
  var sGrid = document.getElementById('somGrid');
  var sLr = document.getElementById('somLr');
  var sRad = document.getElementById('somRad');
  var sEp = document.getElementById('somEp');
  var lblGrid = document.getElementById('somGridVal');
  var lblLr = document.getElementById('somLrVal');
  var lblRad = document.getElementById('somRadVal');
  var lblEp = document.getElementById('somEpVal');
  var elEpoch = document.getElementById('somEpoch');
  var elRun = document.getElementById('somRun');
  var elReset = document.getElementById('somReset');

  var W = 0, H = 0, dpr = 1, PAD = 26;
  var data = [], grid = [], N = 6;
  var epoch = 0, maxEpoch = 40, running = false, timer = null;

  function css(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  }
  function gauss() {
    var u = Math.random() || 1e-9, v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp01(x) { return Math.max(0.03, Math.min(0.97, x)); }

  // ── datasets ──
  function genData(type, n) {
    n = n || 300;
    var d = [];
    if (type === 'blobs') {
      var cs = [[0.28, 0.32], [0.72, 0.30], [0.5, 0.74]];
      for (var i = 0; i < n; i++) { var c = cs[i % cs.length]; d.push([c[0] + 0.06 * gauss(), c[1] + 0.06 * gauss()]); }
    } else if (type === 'rings') {
      for (var i = 0; i < n; i++) {
        var r = (i % 2 === 0) ? 0.22 : 0.42;
        var a = Math.random() * Math.PI * 2;
        d.push([0.5 + (r + 0.015 * gauss()) * Math.cos(a), 0.5 + (r + 0.015 * gauss()) * Math.sin(a)]);
      }
    } else { // moons
      for (var i = 0; i < n; i++) {
        var t = (i % 2 === 0) ? Math.random() * Math.PI : Math.PI + Math.random() * Math.PI;
        var cx = (i % 2 === 0) ? 0.34 : 0.66;
        var cy = (i % 2 === 0) ? 0.42 : 0.58;
        d.push([cx + 0.32 * Math.cos(t) + 0.02 * gauss(), cy + 0.32 * Math.sin(t) + 0.02 * gauss()]);
      }
    }
    return d.map(function (p) { return [clamp01(p[0]), clamp01(p[1])]; });
  }

  // ── SOM ──
  function initGrid(n) {
    N = n;
    grid = [];
    for (var gy = 0; gy < n; gy++) {
      for (var gx = 0; gx < n; gx++) {
        grid.push({ gx: gx, gy: gy, w: [(gx + 0.5) / n + 0.05 * gauss(), (gy + 0.5) / n + 0.05 * gauss()] });
      }
    }
  }
  function bmu(x) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < grid.length; i++) {
      var dx = grid[i].w[0] - x[0], dy = grid[i].w[1] - x[1];
      var dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = i; }
    }
    return best;
  }
  function trainEpoch() {
    var lr0 = parseFloat(sLr.value);
    var rad0 = parseFloat(sRad.value);
    var frac = epoch / Math.max(1, maxEpoch);
    var lr = lr0 * (1 - 0.75 * frac);
    var rad = Math.max(0.6, rad0 * (1 - 0.6 * frac));
    var order = data.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = order[i]; order[i] = order[j]; order[j] = t; }
    for (var k = 0; k < order.length; k++) {
      var x = data[order[k]];
      var b = bmu(x);
      var bn = grid[b];
      for (var g = 0; g < grid.length; g++) {
        var ndx = grid[g].gx - bn.gx, ndy = grid[g].gy - bn.gy;
        var gd = Math.sqrt(ndx * ndx + ndy * ndy);
        if (gd > rad) continue;
        var h = Math.exp(-(gd * gd) / (2 * rad * rad));
        grid[g].w[0] += lr * h * (x[0] - grid[g].w[0]);
        grid[g].w[1] += lr * h * (x[1] - grid[g].w[1]);
      }
    }
  }

  // ── rendering ──
  function px(x) { return PAD + x * (W - 2 * PAD); }
  function py(y) { return PAD + y * (H - 2 * PAD); }
  function colorFor(gx, gy) {
    var hue = (300 + (gx / N) * 200 + (gy / N) * 120) % 360;
    return 'hsl(' + hue.toFixed(0) + ',68%,60%)';
  }
  function seg(a, b) {
    ctx.beginPath(); ctx.moveTo(px(a.w[0]), py(a.w[1])); ctx.lineTo(px(b.w[0]), py(b.w[1])); ctx.stroke();
  }
  function draw() {
    if (!W) return;
    var cBorder = css('--border-primary', '#ddd');
    var cWarm = css('--accent-warm', '#e11d64');
    var cBg = css('--bg-primary', '#fff');
    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = 1; ctx.strokeStyle = cBorder; ctx.globalAlpha = 0.5;
    for (var gy = 0; gy < N; gy++) {
      for (var gx = 0; gx < N; gx++) {
        var a = grid[gy * N + gx];
        if (gx < N - 1) seg(a, grid[gy * N + gx + 1]);
        if (gy < N - 1) seg(a, grid[(gy + 1) * N + gx]);
      }
    }
    ctx.globalAlpha = 1;

    for (var i = 0; i < data.length; i++) {
      var b = bmu(data[i]);
      ctx.fillStyle = colorFor(grid[b].gx, grid[b].gy);
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(px(data[i][0]), py(data[i][1]), 2.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.lineWidth = 1.5; ctx.strokeStyle = cBg;
    for (var g = 0; g < grid.length; g++) {
      ctx.fillStyle = cWarm;
      ctx.beginPath(); ctx.arc(px(grid[g].w[0]), py(grid[g].w[1]), 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }

  // ── loop ──
  function setRunLabel() { if (elRun) elRun.textContent = running ? 'Pause' : 'Run'; }
  function step() {
    if (!running) return;
    if (epoch < maxEpoch) {
      trainEpoch(); epoch++; if (elEpoch) elEpoch.textContent = epoch + ' / ' + maxEpoch; draw();
      timer = setTimeout(step, 45);
    } else { running = false; setRunLabel(); }
  }
  function run() {
    if (epoch >= maxEpoch) { reset(); }
    running = !running; setRunLabel();
    if (running) step(); else if (timer) { clearTimeout(timer); }
  }
  function reset() {
    if (timer) { clearTimeout(timer); timer = null; }
    running = false; setRunLabel();
    data = genData(sData ? sData.value : 'blobs', 300);
    maxEpoch = sEp ? parseInt(sEp.value, 10) : 40;
    initGrid(sGrid ? parseInt(sGrid.value, 10) : 6);
    epoch = 0; if (elEpoch) elEpoch.textContent = '0 / ' + maxEpoch;
    draw();
  }

  function syncLabels() {
    if (lblGrid) lblGrid.textContent = sGrid.value;
    if (lblLr) lblLr.textContent = parseFloat(sLr.value).toFixed(2);
    if (lblRad) lblRad.textContent = sRad.value;
    if (lblEp) lblEp.textContent = sEp.value;
  }

  // ── wiring ──
  if (sData) sData.addEventListener('change', reset);
  if (sGrid) sGrid.addEventListener('input', function () { syncLabels(); reset(); });
  if (sEp) sEp.addEventListener('input', function () { syncLabels(); reset(); });
  if (sLr) sLr.addEventListener('input', syncLabels);
  if (sRad) sRad.addEventListener('input', syncLabels);
  if (elRun) elRun.addEventListener('click', run);
  if (elReset) elReset.addEventListener('click', reset);

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    var rect = canvas.getBoundingClientRect();
    W = Math.max(220, Math.floor(rect.width));
    H = Math.max(220, Math.floor(W * 0.78));
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  window.addEventListener('resize', resize);

  syncLabels();
  reset();
  resize();
})();
