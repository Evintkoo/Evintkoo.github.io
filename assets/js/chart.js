// ─────────────────────────────────────────────
//  EChart — tiny dependency-free SVG line chart
//  Theme-aware (reads CSS tokens), log/linear Y,
//  legend toggle + hover crosshair/tooltip.
//  window.EChart(container, config)
// ─────────────────────────────────────────────

(function () {
  var PALETTE = ['--accent-warm', '--accent-sage', '--accent-secondary', '--accent-tertiary'];

  function css(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb || '#888';
  }

  function svgEl(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) { if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]); }
    return e;
  }

  function niceTicks(min, max, count) {
    var span = max - min;
    if (span <= 0) return [min];
    var step0 = span / count;
    var mag = Math.pow(10, Math.floor(Math.log10(step0)));
    var norm = step0 / mag;
    var step = norm < 1.5 ? 1 * mag : norm < 3 ? 2 * mag : norm < 7 ? 5 * mag : 10 * mag;
    var ticks = [];
    for (var v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v);
    return ticks;
  }

  function niceLogTicks(lo, hi) {
    var out = [];
    for (var e = Math.floor(lo); e <= Math.ceil(hi); e++) out.push(e);
    return out;
  }

  function EChart(container, cfg) {
    if (!container) return null;
    cfg = cfg || {};
    var height = cfg.height || 360;
    var logY = !!cfg.logY;
    var xs = cfg.xs || [];
    var fmtX = cfg.formatX || function (x) { return x; };
    var fmtY = cfg.formatY || function (y) { return Math.round(y); };
    var series = (cfg.series || []).map(function (s, i) {
      return { name: s.name || ('Series ' + (i + 1)), values: s.values.slice(), color: s.color || css(PALETTE[i % PALETTE.length], '#888'), visible: true };
    });
    var M = { top: 16, right: 18, bottom: 38, left: 58 };

    var cTextT = css('--text-tertiary', '#888');
    var cBorder = css('--border-primary', '#ddd');
    var cPanel = css('--bg-primary', '#fff');

    var W, H = height, plotW, plotH, n, yMin, yMax;
    var svg, tooltip, hoverLine, dots = [];
    var lastW = -1;

    function domain() {
      n = xs.length;
      var lo = Infinity, hi = -Infinity;
      series.forEach(function (s) {
        s.values.forEach(function (v) {
          var vv = logY ? Math.log(Math.max(1e-9, v)) : v;
          if (vv < lo) lo = vv;
          if (vv > hi) hi = vv;
        });
      });
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      var pad = (hi - lo) * 0.08;
      yMin = lo - pad; yMax = hi + pad;
    }
    function sy(v) { var vv = logY ? Math.log(Math.max(1e-9, v)) : v; return M.top + (1 - (vv - yMin) / (yMax - yMin)) * plotH; }
    function sx(i) { return M.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW); }

    function build() {
      container.innerHTML = '';
      W = container.clientWidth || 600;
      lastW = W;
      plotW = W - M.left - M.right;
      plotH = H - M.top - M.bottom;
      domain();

      svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'chart__svg', preserveAspectRatio: 'none' });
      // note: preserveAspectRatio none lets width:100% stretch; heights stay proportional via CSS height:auto fallback
      svg.removeAttribute('preserveAspectRatio'); // keep aspect for crisp text
      container.appendChild(svg);

      var yt = logY ? niceLogTicks(yMin, yMax) : niceTicks(yMin, yMax, 5);
      yt.forEach(function (t) {
        var yy = M.top + (1 - (t - yMin) / (yMax - yMin)) * plotH;
        if (yy < M.top - 1 || yy > M.top + plotH + 1) return;
        svg.appendChild(svgEl('line', { x1: M.left, x2: M.left + plotW, y1: yy, y2: yy, stroke: cBorder, 'stroke-width': '1', 'shape-rendering': 'crispEdges' }));
        var lab = svgEl('text', { x: M.left - 10, y: yy + 3.5, 'text-anchor': 'end', 'font-size': '10.5', 'font-family': 'JetBrains Mono, monospace', fill: cTextT });
        lab.textContent = fmtY(logY ? Math.exp(t) : t);
        svg.appendChild(lab);
      });

      var xticks = 6;
      for (var k = 0; k <= xticks; k++) {
        var i = Math.round((n - 1) * k / xticks);
        var lab = svgEl('text', { x: sx(i), y: M.top + plotH + 20, 'text-anchor': 'middle', 'font-size': '10.5', 'font-family': 'JetBrains Mono, monospace', fill: cTextT });
        lab.textContent = fmtX(xs[i], i);
        svg.appendChild(lab);
      }
      svg.appendChild(svgEl('line', { x1: M.left, x2: M.left + plotW, y1: M.top + plotH, y2: M.top + plotH, stroke: cBorder, 'stroke-width': '1.2' }));

      if (cfg.type !== 'bar') {
        series.forEach(function (s) {
          var d = '';
          for (var i = 0; i < n; i++) d += (i === 0 ? 'M' : 'L') + sx(i).toFixed(1) + ',' + sy(s.values[i]).toFixed(1);
          s.path = svgEl('path', { d: d, fill: 'none', stroke: s.color, 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
          svg.appendChild(s.path);
        });
      }

      // optional bar mode
      if (cfg.type === 'bar') {
        var sCount = series.length;
        var slot = n > 0 ? plotW / n : plotW;
        var groupW = slot * 0.62;
        var barW = Math.max(2, Math.min(36, groupW / Math.max(1, sCount)));
        var baseY = (yMin < 0 && yMax > 0) ? sy(0) : (M.top + plotH);
        var fmtV = cfg.formatValue || fmtY;
        series.forEach(function (s, k) {
          s.elems = [];
          for (var i = 0; i < n; i++) {
            var cx = sx(i) + (sCount > 1 ? (k - (sCount - 1) / 2) * barW : 0);
            var yv = sy(s.values[i]);
            var top = Math.min(yv, baseY);
            var h = Math.max(1, Math.abs(yv - baseY));
            s.elems.push(svgEl('rect', { x: (cx - barW / 2).toFixed(1), y: top.toFixed(1), width: Math.max(1, barW - 1).toFixed(1), height: h.toFixed(1), fill: s.color, rx: '2', opacity: '0.92' }));
            var lab = svgEl('text', { x: cx.toFixed(1), y: (top - 6).toFixed(1), 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'JetBrains Mono, monospace', fill: cTextT });
            lab.textContent = fmtV(s.values[i]);
            s.elems.push(lab);
          }
          s.elems.forEach(function (e) { svg.appendChild(e); });
        });
      }

      hoverLine = svgEl('line', { x1: 0, x2: 0, y1: M.top, y2: M.top + plotH, stroke: cTextT, 'stroke-width': '1', opacity: '0', 'stroke-dasharray': '3 3' });
      svg.appendChild(hoverLine);
      dots = series.map(function (s) {
        var c = svgEl('circle', { r: 3.5, fill: s.color, stroke: cPanel, 'stroke-width': '1.5', opacity: '0' });
        svg.appendChild(c);
        return c;
      });

      var legend = document.createElement('div');
      legend.className = 'chart__legend';
      series.forEach(function (s, idx) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chart__chip';
        chip.innerHTML = '<span class="chart__swatch" style="background:' + s.color + '"></span><span>' + s.name + '</span>';
        chip.addEventListener('click', function () {
          s.visible = !s.visible;
          chip.classList.toggle('is-muted', !s.visible);
          var op = s.visible ? '1' : '0.12';
          if (s.path) s.path.style.opacity = op;
          if (s.elems) s.elems.forEach(function (e) { e.style.opacity = op; });
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
        var ro = new ResizeObserver(function () {
          if (container.clientWidth === lastW) return;
          build();
        });
        ro.observe(container);
        container.__echartRO = ro;
      }
    }

    function hideHover() {
      hoverLine.setAttribute('opacity', '0');
      dots.forEach(function (d) { d.setAttribute('opacity', '0'); });
      tooltip.style.display = 'none';
    }

    function onMove(e) {
      var rect = svg.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W / rect.width);
      if (mx < M.left || mx > M.left + plotW) { hideHover(); return; }
      var i = Math.max(0, Math.min(n - 1, Math.round(((mx - M.left) / plotW) * (n - 1))));
      var px = sx(i);
      hoverLine.setAttribute('x1', px); hoverLine.setAttribute('x2', px); hoverLine.setAttribute('opacity', '0.7');
      var rows = '';
      series.forEach(function (s, idx) {
        dots[idx].setAttribute('cx', px);
        dots[idx].setAttribute('cy', sy(s.values[i]));
        dots[idx].setAttribute('opacity', s.visible ? '1' : '0');
        rows += '<div class="chart__tiprow"><span class="chart__dot" style="background:' + s.color + '"></span><span class="chart__tipname">' + s.name + '</span><span class="chart__tipval">' + fmtY(s.values[i]) + '</span></div>';
      });
      tooltip.innerHTML = '<div class="chart__tiphead">' + fmtX(xs[i], i) + '</div>' + rows;
      tooltip.style.display = 'block';
      var rect2 = container.getBoundingClientRect();
      var leftPx = (px / W) * rect.width + 12;
      if (leftPx + tooltip.offsetWidth > rect.width) leftPx = (px / W) * rect.width - tooltip.offsetWidth - 12;
      tooltip.style.left = Math.max(4, leftPx) + 'px';
      tooltip.style.top = (e.clientY - rect2.top + 12) + 'px';
    }

    build();
    return {
      destroy: function () {
        if (container.__echartRO) { container.__echartRO.disconnect(); delete container.__echartRO; }
        container.innerHTML = '';
      }
    };
  }

  window.EChart = EChart;
})();
