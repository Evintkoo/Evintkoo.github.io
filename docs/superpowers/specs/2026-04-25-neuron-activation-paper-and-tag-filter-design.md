# Design: Neuron Activation Analysis Paper + Tag Filter

**Date:** 2026-04-25  
**Status:** Approved

---

## Overview

Add the *What Does the Internet Do to the Brain?* paper (neuron-activation-analysis) to the site as a dedicated research page, wire it into the research lists on `index.html` and `research.html`, link it from the TRIBE v2 project card, and make all `tech-tag` chips site-wide into filterable links on `projects.html`.

---

## 1. Paper PDF

- Download `paper.pdf` from `https://github.com/Evintkoo/neuron-activation-analysis` (raw blob).
- Save to `files/neuron_activation_paper.pdf`.

---

## 2. Dedicated Research Page — `research/neuron-activation-analysis.html`

**Pattern:** mirrors `research/grasp.html` structure exactly.

**Content:**
- Title: *What Does the Internet Do to the Brain? Mapping Cortical Activation Fingerprints Across Digital Content Modalities Using a Deep fMRI Encoder*
- Badge: "Research Paper"
- Hero metrics (3 numbers from abstract): 3,008 stimuli · 13 categories · 20,484 cortical points
- Actions: "View Full Paper" → `../files/neuron_activation_paper.pdf` | "View Code" → GitHub repo | "Start Reading" → #abstract
- Research Snapshot sidebar: key stats, method details, meta-pills (fMRI Encoding, Internet Content, Cortical Mapping, Deep Learning, Global Workspace Theory)
- Sections: Abstract, Introduction summary, Methods overview, Key Results (ANOVA F=13.51, p<10⁻²⁶, η²=0.051; Cohen's d=-0.82; PC1=96.9% variance), Theory Evaluation (GWT/FEP/DCT/IIT), Implications
- Footer nav same as other research pages

---

## 3. Research List Entries

### index.html
- Add neuron-activation-analysis as `data-research-item="12"` after item 11.
- Add p53-mutation as `data-research-item="13"` (currently missing from index but present in research.html).
- Update pagination indicator from `1 / 2` to reflect the new count (items per page = 6, total 14 → `1 / 3`).
- Tags: "First Author" + "Neuroscience"

### research.html
- Add neuron-activation-analysis row before or after p53 (chronologically April 2026 = most recent, so at top or grouped with ML papers).

---

## 4. TRIBE v2 Project Card (index.html + projects.html)

Add a third link in `project-card__links` for the TRIBE v2 card:
```html
<a href="research/neuron-activation-analysis.html" class="project-card__link">
    Read Paper <span class="arrow">&rarr;</span>
</a>
```
Same pattern in `projects.html`.

---

## 5. Tech-Tag Filter System

### 5a. Tag markup — all HTML files

Convert every `<span class="tech-tag">X</span>` to:
```html
<a href="projects.html?tag=x" class="tech-tag">X</a>
```
- Tag value is lowercased, spaces→hyphens (e.g. "Nuclear Physics" → `nuclear-physics`).
- For pages inside `projects/` or `research/` subdirectories, path becomes `../projects.html?tag=x`.

### 5b. Filter UI — projects.html

Add a dismissible filter banner above the project grid:
```html
<div id="tagFilterBanner" class="tag-filter-banner" hidden>
  Filtering by: <strong id="tagFilterLabel"></strong>
  <button id="tagFilterClear" aria-label="Clear filter">×</button>
</div>
```

### 5c. Filter JS — projects.html (inline `<script>` at bottom)

~25 lines:
1. Read `new URLSearchParams(location.search).get('tag')`.
2. If present: show banner, set label text, hide all `.project-card` articles whose `.tech-tag` links don't include a matching tag value.
3. Clear button: remove param, reload or hide all non-matching cards and dismiss banner.
4. Normalise comparison: lowercase + spaces→hyphens on both sides.

### 5d. Filter banner CSS — `assets/css/main-theme.css`

Small addition (~10 lines): styled pill banner with accent color, dismiss ×, consistent with existing design tokens.

---

## Out of Scope

- Tag filtering on `index.html` itself (too many sections; the nav link already points to `projects.html`).
- Tags on research pages (different taxonomy).
- Any backend or build step.

---

## File Change Summary

| File | Change |
|------|--------|
| `files/neuron_activation_paper.pdf` | New — downloaded from GitHub |
| `research/neuron-activation-analysis.html` | New — dedicated paper page |
| `index.html` | Add 2 research rows, update pagination, add paper link to TRIBE v2 card, convert tech-tags to links |
| `research.html` | Add neuron-activation-analysis row |
| `projects.html` | Add filter UI + JS, add paper link to TRIBE v2 card, convert tech-tags to links |
| `projects/tribe-playground.html` | Add "Read Paper" link |
| `assets/css/main-theme.css` | Add filter banner styles |
| All `projects/*.html` | Convert tech-tags to relative links |
