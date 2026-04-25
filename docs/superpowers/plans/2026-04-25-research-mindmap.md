# Research Mind-Map Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a radial SVG mind-map "Concept Overview" section before the abstract on all 14 research pages, driven by a single shared renderer and per-page data objects.

**Architecture:** One `assets/js/mindmap.js` vanilla JS IIFE renderer draws an SVG into `#mindmap-svg-container`. Each research page defines `window.MINDMAP_DATA` before loading the script. CSS animations and theme tokens live in `assets/css/research.css`. 12 pages share an identical insertion pattern (before `<section id="abstract"`); 2 pages (crypto-stock-timing and bitcoin-portfolio-allocation) use different first-section IDs and are handled separately.

**Tech Stack:** Vanilla JS (ES5), SVG, CSS custom properties, static HTML

---

## File Map

| File | Action |
|------|--------|
| `assets/js/mindmap.js` | Create — shared SVG renderer |
| `assets/css/research.css` | Append — mindmap section + animation styles |
| `research/keynesian-abm-fiscal.html` | Modify — RSB link, section, data, script |
| `research/keynesian-abm-coordination.html` | Modify — same |
| `research/som-tsk.html` | Modify — same |
| `research/grasp.html` | Modify — same |
| `research/grn-dual-vs-cross-encoder.html` | Modify — same |
| `research/grn-modular-vs-monolithic.html` | Modify — same |
| `research/grn-two-tower.html` | Modify — same |
| `research/circular-rna.html` | Modify — same |
| `research/functional-group-analysis.html` | Modify — same |
| `research/p53-mutation.html` | Modify — same |
| `research/global-gdp-patterns.html` | Modify — same |
| `research/neuron-activation-analysis.html` | Modify — same |
| `research/crypto-stock-timing.html` | Modify — different first section (`#introduction`) |
| `research/bitcoin-portfolio-allocation.html` | Modify — different first section (`#executive-summary`) |

---

## Task 1: Create mindmap.js Renderer + Append CSS

**Files:**
- Create: `assets/js/mindmap.js`
- Modify: `assets/css/research.css`

- [ ] **Step 1: Create `assets/js/mindmap.js`**

Write the file at `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/assets/js/mindmap.js` with this exact content:

```javascript
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
        for (var k in attrs) { e.setAttribute(k, attrs[k]); }
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
            // Offset by half-step so no branch sits exactly at top/bottom edge
            var angle  = -Math.PI / 2 + Math.PI / n + i * (2 * Math.PI / n);
            var bx     = CX + BDIST * Math.cos(angle);
            var by     = CY + BDIST * Math.sin(angle);
            var accent = css(ACCENTS[i % ACCENTS.length]);

            // Bezier control points for smooth center→branch curve
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

        // Center drawn last so it sits on top of branch connectors
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
        if (c && window.MINDMAP_DATA) { render(window.MINDMAP_DATA, c); }
    });
})();
```

- [ ] **Step 2: Append mindmap CSS to `assets/css/research.css`**

At the very end of `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/assets/css/research.css`, append:

```css
/* ── Mind-map overview section ──────────────────────────────────────────── */
.mindmap-section {
  margin-bottom: var(--space-12);
}

.mindmap-section__heading {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: var(--space-4);
}

.mindmap-container {
  width: 100%;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  overflow: hidden;
}

.mindmap-container svg {
  width: 100%;
  height: auto;
  display: block;
}

@keyframes mindmap-in {
  from { opacity: 0; transform: scale(0.75); }
  to   { opacity: 1; transform: scale(1);    }
}

.mindmap-node {
  animation: mindmap-in 0.35s ease-out both;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes mindmap-line-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.mindmap-line {
  animation: mindmap-line-in 0.25s ease-out both;
}
```

- [ ] **Step 3: Verify both files exist**

```bash
ls -lh /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/assets/js/mindmap.js
tail -5 /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/assets/css/research.css
```

Expected: `mindmap.js` exists; last lines of `research.css` contain `.mindmap-line`.

- [ ] **Step 4: Commit**

```bash
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  add assets/js/mindmap.js assets/css/research.css
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  commit -m "feat: add mindmap SVG renderer and CSS animations"
```

---

## Task 2: Wire 12 Standard Pages (first section is `#abstract`)

**Files:** `research/keynesian-abm-fiscal.html`, `research/keynesian-abm-coordination.html`, `research/som-tsk.html`, `research/grasp.html`, `research/grn-dual-vs-cross-encoder.html`, `research/grn-modular-vs-monolithic.html`, `research/grn-two-tower.html`, `research/circular-rna.html`, `research/functional-group-analysis.html`, `research/p53-mutation.html`, `research/global-gdp-patterns.html`, `research/neuron-activation-analysis.html`

Each page needs 4 changes:
1. RSB sidebar: add `<a href="#overview" class="rsb__link active">Overview</a>` as first link; remove `active` from the previously-first link
2. Insert mindmap section HTML immediately before `<section id="abstract"`
3. Add `window.MINDMAP_DATA = {...}` script block before existing `<script>` tags at page bottom
4. Add `<script src="../assets/js/mindmap.js"></script>` after the MINDMAP_DATA script

- [ ] **Step 1: Run the batch Python script**

Run this Python script to apply all 4 changes to all 12 standard pages at once:

```bash
cd /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io
python3 - <<'PYEOF'
import os, re

ROOT = 'research'

MINDMAP_SECTION = '''
                <!-- Mind Map Overview -->
                <section id="overview" class="mindmap-section research-section">
                    <p class="mindmap-section__heading">Concept Overview</p>
                    <div class="mindmap-container">
                        <div id="mindmap-svg-container"></div>
                    </div>
                </section>

'''

MINDMAP_DATA = {
    'keynesian-abm-fiscal.html': """\
window.MINDMAP_DATA = {
  center: "Keynesian ABM",
  branches: [
    { label: "Model Setup",    nodes: ["10K Agents", "Daily Frequency", "Closed Economy"] },
    { label: "Novel Result",   nodes: ["ZLB 93.7%", "Bimodal Dist.", "TFP Threshold"] },
    { label: "Stylised Facts", nodes: ["4 Reproduced", "5 Departures", "Hierarchy Prop"] },
    { label: "Minsky",         nodes: ["Credit Cycles", "Boom-Bust", "Fragility"] },
    { label: "Methods",        nodes: ["Monte Carlo", "Rust", "Parameter Sweep"] }
  ]
};""",
    'keynesian-abm-coordination.html': """\
window.MINDMAP_DATA = {
  center: "Coordination Fail",
  branches: [
    { label: "Core Question", nodes: ["Ind. vs Collective", "Rational Rules", "Aggregate Harm"] },
    { label: "Grid Search",   nodes: ["All Agent Types", "Survival-Maximising", "Strategy Space"] },
    { label: "Key Result",    nodes: ["GDP -65%", "17x Bankruptcies", "Neg. Profits"] },
    { label: "Mechanism",     nodes: ["Demand Deficiency", "Credit Rationing", "Savings"] },
    { label: "Insight",       nodes: ["Bounded Rationality", "Stabiliser", "History Valid."] }
  ]
};""",
    'som-tsk.html': """\
window.MINDMAP_DATA = {
  center: "SOM-TSK",
  branches: [
    { label: "Core Method",    nodes: ["Topology Seeding", "Deterministic KM", "SOM Priors"] },
    { label: "Novel Variants", nodes: ["DenSOM", "AutoSOM", "3 Seeds"] },
    { label: "Performance",    nodes: ["6W / 0L", "24 Benchmarks", "Beats KMeans++"] },
    { label: "Implementation", nodes: ["Rust", "Calinski-Harabasz", "Silhouette"] }
  ]
};""",
    'grasp.html': """\
window.MINDMAP_DATA = {
  center: "GRASP",
  branches: [
    { label: "Pipeline",    nodes: ["GNG Topology", "Eigengap k*", "Nystrom", "Oracle Route"] },
    { label: "Performance", nodes: ["ARI 0.378", "140ms / 50K", "49/49 Tests"] },
    { label: "Specialists", nodes: ["6 Algorithms", "TopoSOM", "KMeans++"] },
    { label: "Theory",      nodes: ["No Free Lunch", "Delaunay Subgraph", "Oracle Consistency"] }
  ]
};""",
    'grn-dual-vs-cross-encoder.html': """\
window.MINDMAP_DATA = {
  center: "GRN Inference",
  branches: [
    { label: "Architectures", nodes: ["Dual Encoder", "Cross Encoder", "5.58M Params"] },
    { label: "Finding",       nodes: ["10.84pt AUROC", "Joint Interaction", "Imbalance Gap"] },
    { label: "Context",       nodes: ["Transductive", "IEEE TNNLS", "scRNA-seq"] },
    { label: "Methods",       nodes: ["Param Matching", "AUROC", "Controlled Study"] }
  ]
};""",
    'grn-modular-vs-monolithic.html': """\
window.MINDMAP_DATA = {
  center: "GRN Architecture",
  branches: [
    { label: "Problem",      nodes: ["Gradient Failure", "Impl. Bug", "Two-Tower Bias"] },
    { label: "Contribution", nodes: ["Gradient Diagnosis", "Bug Correction", "Comparison"] },
    { label: "Result",       nodes: ["Cross-Enc. Wins", "Gap Persists", "All Metrics"] },
    { label: "Insight",      nodes: ["Modular Limits", "Pair Interaction", "Joint Features"] }
  ]
};""",
    'grn-two-tower.html': """\
window.MINDMAP_DATA = {
  center: "Two-Tower GRN",
  branches: [
    { label: "Architecture", nodes: ["Two-Tower MLP", "Pure Rust", "No Framework"] },
    { label: "Data",         nodes: ["47K Brain Pairs", "Human Brain", "scRNA-seq"] },
    { label: "Result",       nodes: ["83% Accuracy", "Ensemble", "Competitive"] },
    { label: "Insight",      nodes: ["Simple > Complex", "Well-Tuned MLP", "GRN Inference"] }
  ]
};""",
    'circular-rna.html': """\
window.MINDMAP_DATA = {
  center: "CircRNA",
  branches: [
    { label: "Biology",      nodes: ["Closed RNA Loop", "Gene Regulation", "No 5-Prime Cap"] },
    { label: "Method",       nodes: ["ANN Detection", "Gaussian Blur", "Classification"] },
    { label: "Performance",  nodes: ["High Accuracy", "F1 Score", "Precision/Recall"] },
    { label: "Contribution", nodes: ["Published", "Disease Marker", "Diagnostic Tool"] }
  ]
};""",
    'functional-group-analysis.html': """\
window.MINDMAP_DATA = {
  center: "Drug-Likeness",
  branches: [
    { label: "Method",    nodes: ["GAT-VGAE", "SOM Clustering", "Graph Encoding"] },
    { label: "Findings",  nodes: ["QED Decomp", "Phenyl Depletion", "Pharmacophore"] },
    { label: "Domain",    nodes: ["Cheminformatics", "Drug Discovery", "Chemical Space"] },
    { label: "Validity",  nodes: ["Benchmark", "Counterfactual", "Molecular Props"] }
  ]
};""",
    'p53-mutation.html': """\
window.MINDMAP_DATA = {
  center: "P-53 Guardian",
  branches: [
    { label: "Biology",      nodes: ["Tumor Suppressor", "Genome Guardian", "Cancer Driver"] },
    { label: "Method",       nodes: ["Genetic Algorithms", "Closed-Loop", "Mutation Search"] },
    { label: "Finding",      nodes: ["Early Signatures", "Pre-Malignant", "Cascade Prev."] },
    { label: "Recognition",  nodes: ["Best Research", "UBC Vantage", "Award-Winning"] }
  ]
};""",
    'global-gdp-patterns.html': """\
window.MINDMAP_DATA = {
  center: "GDP Trajectories",
  branches: [
    { label: "Dataset",  nodes: ["190 Countries", "45 Years", "1980-2024"] },
    { label: "Method",   nodes: ["K-Means", "Unsupervised", "DTW Distance"] },
    { label: "Clusters", nodes: ["4 Paths", "Stagnation", "Exp. Growth"] },
    { label: "Insight",  nodes: ["Dev. Patterns", "Policy Impl.", "Macroeconomics"] }
  ]
};""",
    'neuron-activation-analysis.html': """\
window.MINDMAP_DATA = {
  center: "Cortical Maps",
  branches: [
    { label: "Study Design", nodes: ["3,008 Stimuli", "13 Categories", "TRIBE v2"] },
    { label: "Statistics",   nodes: ["F = 13.51", "eta2 = 0.051", "d = -0.82"] },
    { label: "Cortex",       nodes: ["20,484 Points", "6 Regions", "PC1 96.9%"] },
    { label: "Theory",       nodes: ["GWT Supported", "FEP Partial", "DCT Mixed"] }
  ]
};""",
}

SCRIPT_BLOCK_TPL = """
    <script>
        {data}
    </script>
    <script src="../assets/js/mindmap.js"></script>
"""

for fname, data_js in MINDMAP_DATA.items():
    fpath = os.path.join(ROOT, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. RSB: add #overview as first link, remove 'active' from old first link
    # Find first rsb__link with class="rsb__link active" and remove active
    content = content.replace('class="rsb__link active"', 'class="rsb__link"', 1)
    # Insert #overview link before the first rsb__link
    content = content.replace(
        '<a href="#', 
        '<a href="#overview"      class="rsb__link active">Overview</a>\n                    <a href="#',
        1  # only first occurrence
    )

    # 2. Insert mindmap section before <section id="abstract"
    content = content.replace(
        '<section id="abstract"',
        MINDMAP_SECTION + '                <section id="abstract"',
        1
    )

    # 3+4. Add MINDMAP_DATA script + mindmap.js before first <script src=
    script_block = SCRIPT_BLOCK_TPL.format(data=data_js)
    content = content.replace(
        '\n    <script src="../assets/js/main-theme.js',
        script_block + '\n    <script src="../assets/js/main-theme.js',
        1
    )

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated:', fname)

print('Done.')
PYEOF
```

Expected output: 12 "Updated: filename.html" lines followed by "Done."

- [ ] **Step 2: Spot-check one file**

```bash
grep -n "overview\|mindmap\|MINDMAP_DATA" \
  /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grasp.html | head -20
```

Expected to see:
- Line with `href="#overview"` and `class="rsb__link active"`
- Line with `id="overview"` in the mindmap section
- Line with `mindmap-svg-container`
- Line with `window.MINDMAP_DATA`
- Line with `mindmap.js`

- [ ] **Step 3: Verify `#overview` RSB link is first in each file**

```bash
for f in research/keynesian-abm-fiscal.html research/som-tsk.html research/grn-two-tower.html research/neuron-activation-analysis.html; do
  echo "=== $f ==="
  grep -m3 "rsb__link" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/$f
done
```

Expected: first `rsb__link` is `href="#overview"` with `active` class; second is the page's original first link without `active`.

- [ ] **Step 4: Commit**

```bash
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  add research/keynesian-abm-fiscal.html \
      research/keynesian-abm-coordination.html \
      research/som-tsk.html \
      research/grasp.html \
      research/grn-dual-vs-cross-encoder.html \
      research/grn-modular-vs-monolithic.html \
      research/grn-two-tower.html \
      research/circular-rna.html \
      research/functional-group-analysis.html \
      research/p53-mutation.html \
      research/global-gdp-patterns.html \
      research/neuron-activation-analysis.html
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  commit -m "feat: add mindmap overview to 12 standard research pages"
```

---

## Task 3: Wire crypto-stock-timing.html (first section `#introduction`)

**Files:**
- Modify: `research/crypto-stock-timing.html`

This page's first RSB link is `#introduction` and its first content section is `<section id="introduction"`. All other changes are identical to Task 2.

- [ ] **Step 1: Apply changes to crypto-stock-timing.html**

```bash
cd /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io
python3 - <<'PYEOF'
import os

MINDMAP_SECTION = '''
                <!-- Mind Map Overview -->
                <section id="overview" class="mindmap-section research-section">
                    <p class="mindmap-section__heading">Concept Overview</p>
                    <div class="mindmap-container">
                        <div id="mindmap-svg-container"></div>
                    </div>
                </section>

'''

DATA_JS = """\
window.MINDMAP_DATA = {
  center: "Market Timing",
  branches: [
    { label: "Question", nodes: ["Lead or Lag?", "Crypto vs Equity", "5 Cycles"] },
    { label: "Methods",  nodes: ["Cross-Correlation", "Granger Causality", "Recession Windows"] },
    { label: "Assets",   nodes: ["Bitcoin", "S&P 500", "Macro Context"] },
    { label: "Finding",  nodes: ["Timing Asymmetry", "Cycle Dependence", "Finance Analysis"] }
  ]
};"""

fpath = 'research/crypto-stock-timing.html'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# RSB: remove active from first rsb__link, add #overview before it
content = content.replace('class="rsb__link active"', 'class="rsb__link"', 1)
content = content.replace(
    '<a href="#',
    '<a href="#overview"      class="rsb__link active">Overview</a>\n                    <a href="#',
    1
)

# Insert mindmap section before <section id="introduction"
content = content.replace(
    '<section id="introduction"',
    MINDMAP_SECTION + '                <section id="introduction"',
    1
)

# Add scripts before first <script src=
script_block = '\n    <script>\n        ' + DATA_JS + '\n    </script>\n    <script src="../assets/js/mindmap.js"></script>'
# Find the first <script src= that loads main-theme or animations
for marker in ['<script src="../assets/js/main-theme.js', '<script src="../assets/js/animations.js']:
    if marker in content:
        content = content.replace('\n    ' + marker[1:], script_block + '\n    ' + marker[1:], 1)
        break

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated: crypto-stock-timing.html')
PYEOF
```

- [ ] **Step 2: Verify**

```bash
grep -n "overview\|mindmap\|MINDMAP_DATA" \
  /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/crypto-stock-timing.html | head -15
```

Expected: `#overview` RSB link (active), mindmap section before `#introduction`, MINDMAP_DATA script, mindmap.js script.

- [ ] **Step 3: Commit**

```bash
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  add research/crypto-stock-timing.html
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  commit -m "feat: add mindmap overview to crypto-stock-timing"
```

---

## Task 4: Wire bitcoin-portfolio-allocation.html (first section `#executive-summary`)

**Files:**
- Modify: `research/bitcoin-portfolio-allocation.html`

This page's RSB has 10+ links, first is `#executive-summary`. Its first content section is `<section id="executive-summary"`. The RSB nav structure is the same BEM pattern so the insertion logic is identical except for the section ID.

- [ ] **Step 1: Apply changes to bitcoin-portfolio-allocation.html**

```bash
cd /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io
python3 - <<'PYEOF'
import os

MINDMAP_SECTION = '''
                <!-- Mind Map Overview -->
                <section id="overview" class="mindmap-section research-section">
                    <p class="mindmap-section__heading">Concept Overview</p>
                    <div class="mindmap-container">
                        <div id="mindmap-svg-container"></div>
                    </div>
                </section>

'''

DATA_JS = """\
window.MINDMAP_DATA = {
  center: "BTC Allocation",
  branches: [
    { label: "Framework", nodes: ["Risk Budget", "Component Risk", "5 Profiles"] },
    { label: "Finding",   nodes: ["10-12% Ceiling", "Evidence-Based", "Optimal Sizing"] },
    { label: "Analysis",  nodes: ["Monte Carlo", "Stress Testing", "Regime Analysis"] },
    { label: "Insight",   nodes: ["Equal-Weight Fail", "Behavioral Risk", "Corr. Shifts"] }
  ]
};"""

fpath = 'research/bitcoin-portfolio-allocation.html'
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

# RSB: remove active from first rsb__link, add #overview before it
content = content.replace('class="rsb__link active"', 'class="rsb__link"', 1)
content = content.replace(
    '<a href="#',
    '<a href="#overview"      class="rsb__link active">Overview</a>\n                    <a href="#',
    1
)

# Insert mindmap section before <section id="executive-summary"
content = content.replace(
    '<section id="executive-summary"',
    MINDMAP_SECTION + '                <section id="executive-summary"',
    1
)

# Add scripts before first script tag
script_block = '\n    <script>\n        ' + DATA_JS + '\n    </script>\n    <script src="../assets/js/mindmap.js"></script>'
for marker in ['<script src="../assets/js/main-theme.js', '<script src="../assets/js/animations.js', '\n    <script']:
    if '\n    ' + marker.lstrip() in content:
        idx = content.find('\n    ' + marker.lstrip())
        content = content[:idx] + script_block + content[idx:]
        break

with open(fpath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated: bitcoin-portfolio-allocation.html')
PYEOF
```

- [ ] **Step 2: Verify**

```bash
grep -n "overview\|mindmap\|MINDMAP_DATA" \
  /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/bitcoin-portfolio-allocation.html | head -15
```

Expected: `#overview` RSB link first with `active`, mindmap section before `#executive-summary`, MINDMAP_DATA, mindmap.js.

- [ ] **Step 3: Commit**

```bash
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  add research/bitcoin-portfolio-allocation.html
git -C /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io \
  commit -m "feat: add mindmap overview to bitcoin-portfolio-allocation"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `assets/js/mindmap.js` — Task 1 ✓
- [x] `assets/css/research.css` CSS append — Task 1 ✓
- [x] RSB `#overview` link (first, active) — Tasks 2/3/4 ✓
- [x] `<section id="overview">` before first content section — Tasks 2/3/4 ✓
- [x] `window.MINDMAP_DATA` per-page — all 14 pages defined in Tasks 2/3/4 ✓
- [x] `<script src="../assets/js/mindmap.js">` — all pages ✓
- [x] Standard pages (12) — Task 2 ✓
- [x] crypto-stock-timing (non-standard first section) — Task 3 ✓
- [x] bitcoin-portfolio-allocation (non-standard first section) — Task 4 ✓
- [x] Theme-aware colors (CSS vars read at render time) — mindmap.js ✓
- [x] Animation with staggered delay — CSS + JS delay attribute ✓
- [x] Branch colors cycling through 4 accent vars — ACCENTS array ✓

**Placeholder scan:** None found — all code is complete and runnable.

**Type consistency:** `render(data, container)` function name used consistently. `window.MINDMAP_DATA` is the single data interface. `#mindmap-svg-container` id used identically in all HTML and in the JS `getElementById` call. `.mindmap-node` and `.mindmap-line` CSS class names used identically in JS and CSS.

**Edge case note:** Pages with different hero structures (global-gdp-patterns uses `hero__title` not `circrna-hero`) — the Python script uses `id="abstract"` as the insertion anchor, not the hero class name, so it works regardless of hero structure.
