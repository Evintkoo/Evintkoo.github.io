(function () {
    var ACCENTS = ['--accent-warm', '--accent-sage', '--accent-secondary', '--accent-tertiary'];
    var W = 900, H = 520, CX = 450, CY = 255;
    var CR = 50, BR = 28, LR = 14;
    var BDIST = 170, LDIST = 110;

    function css(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
    }

    function svgEl(tag, attrs) {
        var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (var k in attrs) {
            if (Object.prototype.hasOwnProperty.call(attrs, k)) {
                e.setAttribute(k, attrs[k]);
            }
        }
        return e;
    }

    function addText(svg, str, x, y, size, weight, fill, animDelay) {
        var words = str.split(' ');
        var lines = (str.length > 9 && words.length > 1)
            ? [words.slice(0, Math.ceil(words.length / 2)).join(' '),
               words.slice(Math.ceil(words.length / 2)).join(' ')]
            : [str];
        var lh = size + 2;
        lines.forEach(function (line, i) {
            var t = svgEl('text', {
                x: x,
                y: y + (i - (lines.length - 1) / 2) * lh,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'font-family': 'Plus Jakarta Sans, sans-serif',
                'font-size': size,
                'font-weight': weight,
                fill: fill,
                class: 'mindmap-node',
                style: 'animation-delay:' + animDelay + 'ms',
                'pointer-events': 'none'
            });
            t.textContent = line;
            svg.appendChild(t);
        });
    }

    function render(data, container) {
        var textPrimary   = css('--text-primary');
        var textSecondary = css('--text-secondary');
        var bgSecondary   = css('--bg-secondary');
        var border        = css('--border-primary');
        var n = data.branches.length;
        var delay = 0;

        var svg = svgEl('svg', {
            viewBox: '0 0 ' + W + ' ' + H,
            xmlns: 'http://www.w3.org/2000/svg',
            role: 'img',
            'aria-label': data.center + ' concept map'
        });

        data.branches.forEach(function (branch, i) {
            var angle  = -Math.PI / 2 + Math.PI / n + i * (2 * Math.PI / n);
            var bx     = CX + BDIST * Math.cos(angle);
            var by     = CY + BDIST * Math.sin(angle);
            var accent = css(ACCENTS[i % ACCENTS.length]);

            var cp1x = CX + (bx - CX) * 0.4;
            var cp1y = CY + (by - CY) * 0.1;
            var cp2x = CX + (bx - CX) * 0.6;
            var cp2y = CY + (by - CY) * 0.9;

            svg.appendChild(svgEl('path', {
                d: 'M' + CX + ',' + CY + ' C' + cp1x + ',' + cp1y + ' ' + cp2x + ',' + cp2y + ' ' + bx + ',' + by,
                stroke: border, 'stroke-width': '1.5', fill: 'none',
                class: 'mindmap-line',
                style: 'animation-delay:' + delay + 'ms'
            }));
            delay += 40;

            svg.appendChild(svgEl('circle', {
                cx: bx, cy: by, r: BR, fill: accent,
                class: 'mindmap-node',
                style: 'animation-delay:' + delay + 'ms'
            }));
            addText(svg, branch.label, bx, by, 8.5, '700', '#ffffff', delay);
            delay += 40;

            if (!Array.isArray(branch.nodes)) { return; }
            var ln = branch.nodes.length;
            branch.nodes.forEach(function (node, j) {
                var fanAngle = angle + (j - (ln - 1) / 2) * (Math.PI / 8);
                var lx = bx + LDIST * Math.cos(fanAngle);
                var ly = by + LDIST * Math.sin(fanAngle);

                svg.appendChild(svgEl('line', {
                    x1: bx, y1: by, x2: lx, y2: ly,
                    stroke: border, 'stroke-width': '1',
                    class: 'mindmap-line',
                    style: 'animation-delay:' + delay + 'ms'
                }));
                delay += 20;

                svg.appendChild(svgEl('circle', {
                    cx: lx, cy: ly, r: LR,
                    fill: accent, opacity: '0.18',
                    stroke: accent, 'stroke-width': '1',
                    class: 'mindmap-node',
                    style: 'animation-delay:' + delay + 'ms'
                }));
                addText(svg, node, lx, ly, 7.5, '500', textSecondary, delay);
                delay += 20;
            });
        });

        svg.appendChild(svgEl('circle', {
            cx: CX, cy: CY, r: CR,
            fill: bgSecondary, stroke: border, 'stroke-width': '2',
            class: 'mindmap-node',
            style: 'animation-delay:0ms'
        }));
        addText(svg, data.center, CX, CY, 12.5, '700', textPrimary, 0);

        container.appendChild(svg);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var c = document.getElementById('mindmap-svg-container');
        var d = window.MINDMAP_DATA;
        if (c && d && Array.isArray(d.branches)) { render(d, c); }
    });
})();
