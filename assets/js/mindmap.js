(function () {
    var ACCENTS = ['--accent-warm', '--accent-sage', '--accent-secondary', '--accent-tertiary'];
    var W = 900, H = 620, CX = 450, CY = 310;
    var CR = 58, BR = 32, LR = 7;
    var BDIST = 168, LDIST = 108;
    var FAN = Math.PI / 9;

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

    // Multi-line text centered on (x, y)
    function appendCenteredText(parent, str, x, y, size, weight, fill, delay) {
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
                style: 'animation-delay:' + delay + 'ms',
                'pointer-events': 'none'
            });
            t.textContent = line;
            parent.appendChild(t);
        });
    }

    // Leaf label placed outside the dot in the outward direction
    function appendLeafLabel(parent, str, lx, ly, angle, size, weight, fill, delay) {
        var pad = LR + 8;
        var tx = lx + pad * Math.cos(angle);
        var ty = ly + pad * Math.sin(angle);
        var cosA = Math.cos(angle);
        var anchor = (Math.abs(cosA) >= 0.36)
            ? (cosA > 0 ? 'start' : 'end')
            : 'middle';
        var words = str.split(' ');
        var lines = (str.length > 9 && words.length > 1)
            ? [words.slice(0, Math.ceil(words.length / 2)).join(' '),
               words.slice(Math.ceil(words.length / 2)).join(' ')]
            : [str];
        var lh = size + 2;
        lines.forEach(function (line, i) {
            var t = svgEl('text', {
                x: tx,
                y: ty + (i - (lines.length - 1) / 2) * lh,
                'text-anchor': anchor,
                'dominant-baseline': 'middle',
                'font-family': 'Plus Jakarta Sans, sans-serif',
                'font-size': size,
                'font-weight': weight,
                fill: fill,
                class: 'mindmap-node',
                style: 'animation-delay:' + delay + 'ms',
                'pointer-events': 'none'
            });
            t.textContent = line;
            parent.appendChild(t);
        });
    }

    function render(data, container) {
        var textPrimary   = css('--text-primary');
        var textSecondary = css('--text-secondary');
        var bgSecondary   = css('--bg-secondary');
        var border        = css('--border-primary');
        var n = data.branches.length;

        var svg = svgEl('svg', {
            viewBox: '0 0 ' + W + ' ' + H,
            xmlns: 'http://www.w3.org/2000/svg',
            role: 'img',
            'aria-label': data.center + ' concept map'
        });

        // Layer order: lines → leaf nodes + labels → branch nodes + labels → center
        var lineLayer   = svgEl('g', {});
        var leafLayer   = svgEl('g', {});
        var branchLayer = svgEl('g', {});
        var centerLayer = svgEl('g', {});
        svg.appendChild(lineLayer);
        svg.appendChild(leafLayer);
        svg.appendChild(branchLayer);
        svg.appendChild(centerLayer);

        var lDelay  = 0;
        var nOffset = n * 55 + 60;

        data.branches.forEach(function (branch, i) {
            var angle  = -Math.PI / 2 + Math.PI / n + i * (2 * Math.PI / n);
            var bx     = CX + BDIST * Math.cos(angle);
            var by     = CY + BDIST * Math.sin(angle);
            var accent = css(ACCENTS[i % ACCENTS.length]);

            // Center → branch: subtle bezier spine
            var cp1x = CX + (bx - CX) * 0.35, cp1y = CY + (by - CY) * 0.05;
            var cp2x = CX + (bx - CX) * 0.65, cp2y = CY + (by - CY) * 0.95;
            lineLayer.appendChild(svgEl('path', {
                d: 'M'+CX+','+CY+' C'+cp1x+','+cp1y+' '+cp2x+','+cp2y+' '+bx+','+by,
                stroke: border, 'stroke-width': '1.5', fill: 'none',
                'stroke-linecap': 'round',
                class: 'mindmap-line',
                style: 'animation-delay:' + lDelay + 'ms'
            }));
            lDelay += 55;

            if (!Array.isArray(branch.nodes)) { return; }
            var ln = branch.nodes.length;
            branch.nodes.forEach(function (node, j) {
                var fa = angle + (j - (ln - 1) / 2) * FAN;
                var lx = bx + LDIST * Math.cos(fa);
                var ly = by + LDIST * Math.sin(fa);

                // Branch → leaf: accent-tinted line
                lineLayer.appendChild(svgEl('line', {
                    x1: bx, y1: by, x2: lx, y2: ly,
                    stroke: accent, 'stroke-width': '1.5', opacity: '0.4',
                    'stroke-linecap': 'round',
                    class: 'mindmap-line',
                    style: 'animation-delay:' + (lDelay + j * 18) + 'ms'
                }));

                var nd = nOffset + i * 50 + j * 28;
                // Leaf dot
                leafLayer.appendChild(svgEl('circle', {
                    cx: lx, cy: ly, r: LR,
                    fill: accent, opacity: '0.25',
                    stroke: accent, 'stroke-width': '1.5',
                    class: 'mindmap-node',
                    style: 'animation-delay:' + nd + 'ms'
                }));
                // Leaf label outside the dot, pointing away from center
                var outAngle = Math.atan2(ly - CY, lx - CX);
                appendLeafLabel(leafLayer, node, lx, ly, outAngle, 8.5, '500', textSecondary, nd + 15);
            });
            lDelay += ln * 18;

            // Branch circle + label (rendered above leaves)
            var bd = nOffset + i * 50;
            branchLayer.appendChild(svgEl('circle', {
                cx: bx, cy: by, r: BR, fill: accent,
                class: 'mindmap-node',
                style: 'animation-delay:' + bd + 'ms'
            }));
            appendCenteredText(branchLayer, branch.label, bx, by, 9.5, '700', '#ffffff', bd + 15);
        });

        // Center node — always on top
        centerLayer.appendChild(svgEl('circle', {
            cx: CX, cy: CY, r: CR,
            fill: bgSecondary, stroke: border, 'stroke-width': '2',
            class: 'mindmap-node',
            style: 'animation-delay:0ms'
        }));
        appendCenteredText(centerLayer, data.center, CX, CY, 13.5, '700', textPrimary, 0);

        container.appendChild(svg);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var c = document.getElementById('mindmap-svg-container');
        var d = window.MINDMAP_DATA;
        if (c && d && Array.isArray(d.branches)) { render(d, c); }
    });
})();
