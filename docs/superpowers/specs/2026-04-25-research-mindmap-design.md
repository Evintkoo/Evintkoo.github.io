# Design: Research Mind-Map Overview Component

**Date:** 2026-04-25  
**Status:** Approved

---

## Overview

Add a mind-map style "at a glance" overview to the top of all 14 research pages — before the abstract — showing the paper's core idea space as a radial SVG concept map. One shared renderer, one CSS block, per-page data objects.

---

## 1. Component Architecture

| File | Action | Purpose |
|------|--------|---------|
| `assets/js/mindmap.js` | Create | Shared SVG renderer (~150 lines vanilla JS) |
| `assets/css/research.css` | Append | `.mindmap-section` container + animation styles |
| Each of 14 `research/*.html` | Modify | Add `#overview` RSB link, mindmap section, MINDMAP_DATA script, mindmap.js script tag |

---

## 2. Data Format

Each research page defines a global before any other scripts:

```html
<script>
window.MINDMAP_DATA = {
  center: "Short concept (2–4 words)",
  branches: [
    { label: "Branch Label", nodes: ["Leaf A", "Leaf B", "Leaf C"] },
    { label: "Branch Label", nodes: ["Leaf D", "Leaf E"] },
    ...
  ]
};
</script>
```

Rules:
- `center`: 2–4 words, fits in a circle (no more than 20 chars)
- `branches`: 4–6 items
- `nodes`: 2–4 per branch, each ≤ 3 words

---

## 3. Renderer — `assets/js/mindmap.js`

### Layout algorithm

```
SVG viewBox: 0 0 900 480
Center node: cx=450, cy=240
Branch radius: 185px from center
Leaf radius: 310px from center
Branch angles: evenly distributed 360° / numBranches, starting at -90° (top)
Leaf angles: fanned ±20° around the parent branch angle
```

### Drawing steps

1. Create `<svg viewBox="0 0 900 480">` inside `#mindmap-svg-container`
2. For each branch i:
   - Compute `angle = -π/2 + i * (2π / numBranches)`
   - Branch node center: `bx = 450 + 185*cos(angle)`, `by = 240 + 185*sin(angle)`
   - Draw cubic bezier from (450, 240) → (bx, by) using CSS `--border-primary` stroke
   - Draw filled circle at (bx, by) — branch color from accent palette
   - Draw text label centered on branch node
   - For each leaf j in branch.nodes:
     - Fan angle: `la = angle + (j - (n-1)/2) * (π/9)` (20° fan)
     - Leaf center: `lx = bx + 125*cos(la)`, `ly = by + 125*sin(la)`
     - Draw thin line from (bx, by) → (lx, ly)
     - Draw small circle + text at leaf

### Color palette (cycling per branch index)

| Index mod 4 | CSS var |
|-------------|---------|
| 0 | `--accent-warm` |
| 1 | `--accent-sage` |
| 2 | `--accent-secondary` |
| 3 | `--accent-tertiary` |

Leaf circles use the same color at 30% opacity. Connector lines use `--border-primary`.

### Theme awareness

Colors read at render time via `getComputedStyle(document.documentElement)`:
- Text: `--text-primary`
- Center fill: `--bg-secondary`  
- Center stroke: `--border-primary`
- Connectors: `--border-primary`
- Branch label text: `#fff` (always white — branch circles are colored)
- Leaf text: `--text-secondary`

### Animation

SVG nodes and lines get class `mindmap-node` / `mindmap-line` with `animation-delay` inline style set in JS (50ms stagger per element). CSS `@keyframes` handles the fade+scale-in.

### Initialization

```js
document.addEventListener('DOMContentLoaded', function() {
  if (window.MINDMAP_DATA && document.getElementById('mindmap-svg-container')) {
    renderMindmap(window.MINDMAP_DATA, document.getElementById('mindmap-svg-container'));
  }
});
```

---

## 4. CSS — append to `assets/css/research.css`

```css
/* Mind-map overview section */
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
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1);   }
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

---

## 5. HTML changes per research page

### RSB sidebar — prepend `#overview` link

Add as the **first** `<a>` inside the RSB `<nav>`, remove `active` from current first link:

```html
<a href="#overview"     class="rsb__link active">Overview</a>
<a href="#abstract"     class="rsb__link">Abstract</a>
...rest unchanged...
```

### Mind-map section — insert before `<!-- Abstract -->`

```html
<!-- Mind Map Overview -->
<section id="overview" class="mindmap-section research-section">
    <p class="mindmap-section__heading">Concept Overview</p>
    <div class="mindmap-container">
        <div id="mindmap-svg-container"></div>
    </div>
</section>
```

### Script tags — add before existing scripts

```html
<script>
window.MINDMAP_DATA = { /* page-specific data */ };
</script>
<script src="../assets/js/mindmap.js"></script>
```

---

## 6. Per-Page MINDMAP_DATA

### keynesian-abm-fiscal.html
```js
{ center: "Keynesian ABM",
  branches: [
    { label: "Model Setup",    nodes: ["10K Agents", "Daily Frequency", "Closed Economy"] },
    { label: "Novel Result",   nodes: ["ZLB 93.7%", "Bimodal Dist.", "TFP Threshold"] },
    { label: "Stylised Facts", nodes: ["4 Reproduced", "5 Departures", "Hierarchy Prop"] },
    { label: "Minsky",         nodes: ["Credit Cycles", "Boom-Bust", "Fragility"] },
    { label: "Methods",        nodes: ["Monte Carlo", "Rust", "Parameter Sweep"] }
  ]
}
```

### keynesian-abm-coordination.html
```js
{ center: "Coordination Failure",
  branches: [
    { label: "Core Question", nodes: ["Individual vs Collective", "Rational Rules", "Aggregate Harm"] },
    { label: "Grid Search",   nodes: ["All Agent Types", "Survival-Maximising", "Strategy Space"] },
    { label: "Key Result",    nodes: ["GDP −65%", "17× Bankruptcies", "Negative Profits"] },
    { label: "Mechanism",     nodes: ["Demand Deficiency", "Credit Rationing", "Conservative Savings"] },
    { label: "Insight",       nodes: ["Bounded Rationality", "Structural Stabiliser", "History Validated"] }
  ]
}
```

### som-tsk.html
```js
{ center: "SOM-TSK",
  branches: [
    { label: "Core Method",    nodes: ["Topology Seeding", "Deterministic K-Means", "SOM Priors"] },
    { label: "Novel Variants", nodes: ["DenSOM", "AutoSOM", "3 Seeds"] },
    { label: "Performance",    nodes: ["6W / 0L", "24 Benchmarks", "KMeans++ Beaten"] },
    { label: "Implementation", nodes: ["Rust", "Calinski-Harabasz", "Silhouette"] }
  ]
}
```

### grasp.html
```js
{ center: "GRASP",
  branches: [
    { label: "Pipeline",     nodes: ["GNG Topology", "Eigengap k*", "Nyström", "Oracle Route"] },
    { label: "Performance",  nodes: ["ARI 0.378", "140ms / 50K", "49/49 Tests"] },
    { label: "Specialists",  nodes: ["6 Algorithms", "TopoSOM", "KMeans++"] },
    { label: "Theory",       nodes: ["No Free Lunch", "Delaunay Subgraph", "Oracle Consistency"] }
  ]
}
```

### grn-dual-vs-cross-encoder.html
```js
{ center: "GRN Inference",
  branches: [
    { label: "Architectures", nodes: ["Dual Encoder", "Cross Encoder", "5.58M Params"] },
    { label: "Finding",       nodes: ["10.84pt AUROC", "Joint Interaction", "Imbalance Gap"] },
    { label: "Context",       nodes: ["Transductive", "IEEE TNNLS", "scRNA-seq"] },
    { label: "Methods",       nodes: ["Param Matching", "AUROC", "Controlled Study"] }
  ]
}
```

### grn-modular-vs-monolithic.html
```js
{ center: "GRN Architecture",
  branches: [
    { label: "Problem",       nodes: ["Gradient Failure", "Implementation Bug", "Two-Tower Bias"] },
    { label: "Contribution",  nodes: ["Gradient Diagnosis", "Bug Correction", "Controlled Comparison"] },
    { label: "Result",        nodes: ["Cross-Encoder Wins", "Gap Persists", "All Metrics"] },
    { label: "Insight",       nodes: ["Modular Limits", "Pair Interaction", "Joint Features"] }
  ]
}
```

### grn-two-tower.html
```js
{ center: "Two-Tower GRN",
  branches: [
    { label: "Architecture", nodes: ["Two-Tower MLP", "Pure Rust", "No Framework"] },
    { label: "Data",         nodes: ["47K Brain Pairs", "Human Brain", "scRNA-seq"] },
    { label: "Result",       nodes: ["83% Accuracy", "Ensemble", "Competitive"] },
    { label: "Insight",      nodes: ["Simple > Complex", "Well-Tuned MLP", "GRN Inference"] }
  ]
}
```

### circular-rna.html
```js
{ center: "CircRNA",
  branches: [
    { label: "Biology",       nodes: ["Closed RNA Loop", "Gene Regulation", "No 5' Cap"] },
    { label: "Method",        nodes: ["ANN Detection", "Gaussian Blur", "Classification"] },
    { label: "Performance",   nodes: ["High Accuracy", "F1 Score", "Precision/Recall"] },
    { label: "Contribution",  nodes: ["Published", "Disease Marker", "Diagnostic Tool"] }
  ]
}
```

### functional-group-analysis.html
```js
{ center: "Drug-Likeness",
  branches: [
    { label: "Method",    nodes: ["GAT-VGAE", "SOM Clustering", "Graph Encoding"] },
    { label: "Findings",  nodes: ["QED Decomp", "Phenyl Depletion", "Pharmacophore Sigs"] },
    { label: "Domain",    nodes: ["Cheminformatics", "Drug Discovery", "Chemical Space"] },
    { label: "Validity",  nodes: ["Benchmark Dataset", "Counterfactual", "Molecular Props"] }
  ]
}
```

### global-gdp-patterns.html
```js
{ center: "GDP Trajectories",
  branches: [
    { label: "Dataset",   nodes: ["190 Countries", "45 Years", "1980–2024"] },
    { label: "Method",    nodes: ["K-Means", "Unsupervised", "DTW Distance"] },
    { label: "Clusters",  nodes: ["4 Paths", "Stagnation", "Exponential Growth"] },
    { label: "Insight",   nodes: ["Development Patterns", "Policy Implications", "Macroeconomics"] }
  ]
}
```

### crypto-stock-timing.html
```js
{ center: "Market Timing",
  branches: [
    { label: "Question", nodes: ["Lead or Lag?", "Crypto vs Equity", "5 Cycles"] },
    { label: "Methods",  nodes: ["Cross-Correlation", "Granger Causality", "Recession Windows"] },
    { label: "Assets",   nodes: ["Bitcoin", "S&P 500", "Macro Context"] },
    { label: "Finding",  nodes: ["Timing Asymmetry", "Cycle Dependence", "Finance Analysis"] }
  ]
}
```

### bitcoin-portfolio-allocation.html
```js
{ center: "BTC Allocation",
  branches: [
    { label: "Framework", nodes: ["Risk Budget", "Component Risk", "5 Profiles"] },
    { label: "Finding",   nodes: ["10–12% Ceiling", "Evidence-Based", "Optimal Sizing"] },
    { label: "Analysis",  nodes: ["Monte Carlo", "Stress Testing", "Regime Analysis"] },
    { label: "Insight",   nodes: ["Equal-Weight Fail", "Behavioral Risk", "Correlation Shifts"] }
  ]
}
```

### p53-mutation.html
```js
{ center: "P-53 Guardian",
  branches: [
    { label: "Biology",       nodes: ["Tumor Suppressor", "Genome Guardian", "Cancer Driver"] },
    { label: "Method",        nodes: ["Genetic Algorithms", "Closed-Loop", "Mutation Search"] },
    { label: "Finding",       nodes: ["Early Signatures", "Pre-Malignant", "Cascade Prevention"] },
    { label: "Recognition",   nodes: ["Best Research", "UBC Vantage", "Award-Winning"] }
  ]
}
```

### neuron-activation-analysis.html
```js
{ center: "Cortical Maps",
  branches: [
    { label: "Study Design", nodes: ["3,008 Stimuli", "13 Categories", "TRIBE v2"] },
    { label: "Statistics",   nodes: ["F = 13.51", "η² = 0.051", "d = −0.82"] },
    { label: "Cortex",       nodes: ["20,484 Points", "6 Regions", "PC1 96.9%"] },
    { label: "Theory",       nodes: ["GWT Supported", "FEP Partial", "DCT Mixed"] }
  ]
}
```

---

## 7. File Change Summary

| File | Change |
|------|--------|
| `assets/js/mindmap.js` | New — SVG renderer |
| `assets/css/research.css` | Append mindmap styles + animations |
| `research/keynesian-abm-fiscal.html` | RSB link, mindmap section, data, script |
| `research/keynesian-abm-coordination.html` | same |
| `research/som-tsk.html` | same |
| `research/grasp.html` | same |
| `research/grn-dual-vs-cross-encoder.html` | same |
| `research/grn-modular-vs-monolithic.html` | same |
| `research/grn-two-tower.html` | same |
| `research/circular-rna.html` | same |
| `research/functional-group-analysis.html` | same |
| `research/global-gdp-patterns.html` | same |
| `research/crypto-stock-timing.html` | same |
| `research/bitcoin-portfolio-allocation.html` | same |
| `research/p53-mutation.html` | same |
| `research/neuron-activation-analysis.html` | same |
