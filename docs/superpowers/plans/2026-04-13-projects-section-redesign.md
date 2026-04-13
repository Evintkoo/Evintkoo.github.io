# Projects Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single "Selected Work" section with a Projects section (featured dark card + compact grid) and a separate Research & Analysis section (editorial rows), removing the filter dropdown entirely.

**Architecture:** Three file changes — `index.html` is fully restructured (two sections, new HTML components), `main-theme.css` adds new component styles and removes dead filter/tag CSS. No JS changes needed — `animations.js` has no filter code and `main-theme.js` is referenced in HTML but does not exist on disk.

**Tech Stack:** Vanilla HTML/CSS, no build step, no test runner. Verification is visual via Playwright.

---

## File Map

| File | Change |
|------|--------|
| `index.html` | Replace single `#projects` section with two sections (`#projects`, `#research`); restructure all card HTML; remove filter dropdown; update nav Research link |
| `assets/css/main-theme.css` | Add new component styles; remove filter dropdown CSS; update `.project-card` and `.projects-grid` |

---

### Task 1: Restructure index.html

**Files:**
- Modify: `index.html`

This is a large HTML replacement. Do it in three focused edits.

- [ ] **Step 1: Remove the filter dropdown from the section header and rename the section header**

Find the `<div class="section__header" data-reveal>` block (around line 133) which currently contains the title group and filter dropdown:

```html
<div class="section__header" data-reveal>
    <div class="section__title-group">
        <h2 class="section__title">Selected <span class="filter-label" id="filterLabel"></span> Work</h2>
        <div class="filter-dropdown">
            ...
        </div>
    </div>
</div>
```

Replace the entire block with:

```html
<div class="section-eyebrow" data-reveal>
    <div class="section-eyebrow__line"></div>
    <span class="section-eyebrow__label">01 / Projects</span>
    <div class="section-eyebrow__line"></div>
</div>
<h2 class="section__title" data-reveal>Things I've built</h2>
<p class="section__subtitle" data-reveal>Open-source tools, platforms, and applications</p>
```

- [ ] **Step 2: Replace Kolosal AI card with the featured card, and restructure remaining project cards**

Find `<div class="projects-grid" data-reveal>` and replace the entire `projects-grid` div (everything from `<div class="projects-grid" data-reveal>` to its closing `</div>`) with:

```html
<article class="project-featured" data-reveal>
    <div>
        <div class="project-featured__eyebrow">
            <span class="project-featured__tag project-featured__tag--featured">Featured</span>
            <span class="project-featured__tag">Co-Founder</span>
            <span class="project-featured__tag">MLOps</span>
        </div>
        <h3 class="project-featured__title">Kolosal AI</h3>
        <p class="project-featured__desc">
            Open-source platform for running large language models locally &mdash; private, fast, and fully under your control. Custom training and production-ready inference at scale.
        </p>
        <div class="project-featured__tech">
            <span>Python</span>
            <span>PyTorch</span>
            <span>FastAPI</span>
            <span>Docker</span>
            <span>CUDA</span>
        </div>
    </div>
    <a href="https://kolosal.ai/" target="_blank" rel="noopener noreferrer" class="project-featured__link">
        Visit Platform <span class="arrow">&nearr;</span>
    </a>
</article>

<div class="projects-grid" data-reveal>
    <!-- PyTorch Inference Framework -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Open Source &middot; Infrastructure</div>
            <h3 class="project-card__title">PyTorch Inference Framework</h3>
            <p class="project-card__desc">
                Production-ready inference with TensorRT acceleration. Handles batching, model versioning, and GPU memory management out of the box.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">PyTorch</span>
                <span class="tech-tag">TensorRT</span>
                <span class="tech-tag">FastAPI</span>
                <span class="tech-tag">Docker</span>
            </div>
            <div class="project-card__links">
                <a href="projects/torch-inference.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
                <a href="https://github.com/KolosalAI/torch-inference" target="_blank" rel="noopener noreferrer" class="project-card__link">
                    Repo <span class="arrow">&nearr;</span>
                </a>
            </div>
        </div>
    </article>

    <!-- Kolosal AutoML -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Open Source &middot; AutoML</div>
            <h3 class="project-card__title">Kolosal AutoML Platform</h3>
            <p class="project-card__desc">
                End-to-end AutoML with Gradio UI &mdash; from hyperparameter tuning with Optuna to experiment tracking with MLflow, all in one platform.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">Gradio</span>
                <span class="tech-tag">MLflow</span>
                <span class="tech-tag">Optuna</span>
                <span class="tech-tag">FastAPI</span>
            </div>
            <div class="project-card__links">
                <a href="projects/kolosal-automl.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
                <a href="https://github.com/KolosalAI/kolosal_automl" target="_blank" rel="noopener noreferrer" class="project-card__link">
                    Repo <span class="arrow">&nearr;</span>
                </a>
            </div>
        </div>
    </article>

    <!-- SOM Plus Clustering -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Open Source &middot; Machine Learning</div>
            <h3 class="project-card__title">SOM Plus Clustering</h3>
            <p class="project-card__desc">
                Industrial-grade Self-Organizing Map and clustering library for Rust &mdash; published to crates.io with CPU, CUDA, and Metal backends. Supports SOM classification, KMeans variants, and automatic model selection via silhouette scoring.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">Rust</span>
                <span class="tech-tag">SOM</span>
                <span class="tech-tag">CUDA</span>
                <span class="tech-tag">Metal</span>
            </div>
            <div class="project-card__links">
                <a href="projects/som-plus.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
                <a href="https://github.com/Evintkoo/SOM_plus_clustering" target="_blank" rel="noopener noreferrer" class="project-card__link">
                    Repo <span class="arrow">&nearr;</span>
                </a>
            </div>
        </div>
    </article>

    <!-- APT Fitness Assistant -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Open Source &middot; Computer Vision</div>
            <h3 class="project-card__title">APT Fitness Assistant</h3>
            <p class="project-card__desc">
                Real-time pose estimation with MediaPipe for form correction, rep counting, and personalized workout recommendations.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">Python</span>
                <span class="tech-tag">MediaPipe</span>
                <span class="tech-tag">Streamlit</span>
                <span class="tech-tag">OpenCV</span>
            </div>
            <div class="project-card__links">
                <a href="projects/apt-fitness.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
                <a href="https://github.com/Evintkoo/APT-Fitness-Assistant" target="_blank" rel="noopener noreferrer" class="project-card__link">
                    Repo <span class="arrow">&nearr;</span>
                </a>
            </div>
        </div>
    </article>

    <!-- Chain Reaction Simulation -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Open Source &middot; Physics</div>
            <h3 class="project-card__title">Chain Reaction Simulation</h3>
            <p class="project-card__desc">
                High-performance nuclear chain reaction simulator in Rust &mdash; GPU-accelerated particle physics with real-time 3D visualization, 150+ isotope library from ENDF/B-VIII.0 nuclear data.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">Rust</span>
                <span class="tech-tag">wgpu</span>
                <span class="tech-tag">GPU</span>
                <span class="tech-tag">Nuclear Physics</span>
            </div>
            <div class="project-card__links">
                <a href="projects/chain-reaction-simulation.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
                <a href="https://github.com/Evintkoo/chain_reaction_simulation" target="_blank" rel="noopener noreferrer" class="project-card__link">
                    Repo <span class="arrow">&nearr;</span>
                </a>
            </div>
        </div>
    </article>

    <!-- Faction App -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Open Source &middot; Finance</div>
            <h3 class="project-card__title">Faction &mdash; Stock Analysis App</h3>
            <p class="project-card__desc">
                Desktop app for evaluating stocks through technical and fundamental analysis, powered by on-device ML inference and a local Qwen2.5 LLM &mdash; fully offline, no cloud required.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">Tauri</span>
                <span class="tech-tag">Rust</span>
                <span class="tech-tag">React</span>
                <span class="tech-tag">LLM</span>
            </div>
            <div class="project-card__links">
                <a href="projects/faction-app.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
                <a href="https://github.com/Evintkoo/FactionApp" target="_blank" rel="noopener noreferrer" class="project-card__link">
                    Repo <span class="arrow">&nearr;</span>
                </a>
            </div>
        </div>
    </article>

    <!-- Rebirth Educational Platform -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Community &middot; Education</div>
            <h3 class="project-card__title">Rebirth Educational Platform</h3>
            <p class="project-card__desc">
                Community-driven platform connecting learners and researchers through structured courses and peer mentorship programs.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">Education</span>
                <span class="tech-tag">Community</span>
            </div>
            <div class="project-card__links">
                <a href="projects/rebirth.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
            </div>
        </div>
    </article>

    <!-- PsychIDN -->
    <article class="project-card">
        <div class="project-card__content">
            <div class="project-card__category">Community &middot; Mental Health</div>
            <h3 class="project-card__title">PsychIDN Community</h3>
            <p class="project-card__desc">
                Building mental health awareness across Indonesia through accessible psychology content and peer-to-peer support networks.
            </p>
            <div class="project-card__tech">
                <span class="tech-tag">Psychology</span>
                <span class="tech-tag">Mental Health</span>
                <span class="tech-tag">Community</span>
            </div>
            <div class="project-card__links">
                <a href="projects/psychidn.html" class="project-card__link">
                    Learn More <span class="arrow">&rarr;</span>
                </a>
            </div>
        </div>
    </article>
</div>
```

- [ ] **Step 3: Close the projects section and add the Research section**

After the closing `</div>` of `.projects-grid` and before `</div></section>`, add the section divider and new research section. The projects section closes with:

```html
        </div><!-- end .projects-grid -->
    </div><!-- end .container -->
</section><!-- end #projects -->

<!-- Section Divider -->
<div class="section-divider" aria-hidden="true">
    <div class="section-divider__line"></div>
</div>

<!-- Research & Analysis Section -->
<section class="section" id="research">
    <div class="container">
        <div class="section-eyebrow" data-reveal>
            <div class="section-eyebrow__line"></div>
            <span class="section-eyebrow__label">02 / Research &amp; Analysis</span>
            <div class="section-eyebrow__line"></div>
        </div>
        <h2 class="section__title" data-reveal>Papers &amp; analyses</h2>
        <p class="section__subtitle" data-reveal>First-author research in ML, computational biology, and quantitative finance</p>

        <div class="research-list" data-reveal>
            <!-- Dual-Encoder vs Cross-Encoder (IEEE TNNLS) -->
            <a href="research/grn-dual-vs-cross-encoder.html" class="research-row">
                <div>
                    <div class="research-row__title">Dual-Encoder vs Cross-Encoder for GRN Links</div>
                    <div class="research-row__subtitle">Computational Biology &middot; IEEE TNNLS</div>
                </div>
                <p class="research-row__desc">
                    Parameter-matched comparison (5.58M params) of dual-encoder and cross-encoder architectures across four imbalance regimes, ablation, pruning, and cold-start evaluation &mdash; submitted to IEEE TNNLS.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag research-row__tag--first-author">First Author</span>
                    <span class="research-row__tag research-row__tag--ieee">IEEE TNNLS</span>
                    <span class="research-row__link">Read Paper &rarr;</span>
                </div>
            </a>

            <!-- GRN Modular vs Monolithic -->
            <a href="research/grn-modular-vs-monolithic.html" class="research-row">
                <div>
                    <div class="research-row__title">Modular vs Monolithic GRN Architectures</div>
                    <div class="research-row__subtitle">Computational Biology &middot; Research</div>
                </div>
                <p class="research-row__desc">
                    Diagnosed three critical gradient failures in two-tower GRN models, then compared corrected modular and monolithic cross-encoders &mdash; cross-encoder achieves AUROC 0.904 vs 0.810, with far greater imbalance robustness.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag research-row__tag--first-author">First Author</span>
                    <span class="research-row__link">Read Paper &rarr;</span>
                </div>
            </a>

            <!-- GRN Two-Tower -->
            <a href="research/grn-two-tower.html" class="research-row">
                <div>
                    <div class="research-row__title">Two-Tower Networks for GRN Inference</div>
                    <div class="research-row__subtitle">Computational Biology &middot; scRNA-seq</div>
                </div>
                <p class="research-row__desc">
                    Pure-Rust two-tower MLP learning entity embeddings and cell-type expression profiles to predict TF&ndash;gene interactions &mdash; 83.06% ensemble accuracy, CPU-trainable, no deep learning framework.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag research-row__tag--first-author">First Author</span>
                    <span class="research-row__link">Read Paper &rarr;</span>
                </div>
            </a>

            <!-- Circular RNA -->
            <a href="research/circular-rna.html" class="research-row">
                <div>
                    <div class="research-row__title">Deep Learning for Circular RNA</div>
                    <div class="research-row__subtitle">Computational Biology &middot; Published</div>
                </div>
                <p class="research-row__desc">
                    Published ANN pipeline classifying circRNA-disease associations with Gaussian blur preprocessing &mdash; 75% accuracy at 0.14ms per prediction.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag research-row__tag--first-author">First Author</span>
                    <span class="research-row__link">Read Paper &rarr;</span>
                </div>
            </a>

            <!-- Functional Group Analysis -->
            <a href="research/functional-group-analysis.html" class="research-row">
                <div>
                    <div class="research-row__title">Functional Group Analysis</div>
                    <div class="research-row__subtitle">Cheminformatics &middot; Research</div>
                </div>
                <p class="research-row__desc">
                    GAT-VGAE + SOM pipeline analysing 249,455 ZINC15 molecules with counterfactual QED decomposition &mdash; mapping functional group enrichment across drug-like chemical space in Rust.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag">Cheminformatics</span>
                    <span class="research-row__link">Read Research &rarr;</span>
                </div>
            </a>

            <!-- GDP Trajectory Clustering -->
            <a href="research/global-gdp-patterns.html" class="research-row">
                <div>
                    <div class="research-row__title">GDP Trajectory Clustering</div>
                    <div class="research-row__subtitle">Economics &middot; Analysis</div>
                </div>
                <p class="research-row__desc">
                    Unsupervised clustering of 190 countries over 45 years reveals four distinct economic paths &mdash; from stagnation to exponential growth.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag">Analysis</span>
                    <span class="research-row__link">View Analysis &rarr;</span>
                </div>
            </a>

            <!-- Crypto vs Stock Timing -->
            <a href="research/crypto-stock-timing.html" class="research-row">
                <div>
                    <div class="research-row__title">Crypto vs Stock Timing</div>
                    <div class="research-row__subtitle">Finance &middot; Analysis</div>
                </div>
                <p class="research-row__desc">
                    Do crypto markets lead or lag equities around recessions? Cross-correlation and Granger causality analysis across five business cycles.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag">Finance</span>
                    <span class="research-row__link">View Analysis &rarr;</span>
                </div>
            </a>

            <!-- Bitcoin Portfolio Allocation -->
            <a href="research/bitcoin-portfolio-allocation.html" class="research-row">
                <div>
                    <div class="research-row__title">Bitcoin Portfolio Allocation</div>
                    <div class="research-row__subtitle">Finance &middot; Analysis</div>
                </div>
                <p class="research-row__desc">
                    Optimal BTC sizing via Risk-Budget Framework. Component Risk Contribution analysis across five portfolio profiles finds 10&ndash;12% is the evidence-based ceiling.
                </p>
                <div class="research-row__meta">
                    <span class="research-row__tag">Finance</span>
                    <span class="research-row__link">View Analysis &rarr;</span>
                </div>
            </a>
        </div>
    </div>
</section>
```

- [ ] **Step 4: Update the nav Research link**

Find:
```html
<a href="#projects" class="nav__link">Research</a>
```

Replace with:
```html
<a href="#research" class="nav__link">Research</a>
```

- [ ] **Step 5: Verify HTML structure**

```bash
cd /Users/evintleovonzko/Documents/research/Evintkoo.github.io
grep -c "project-featured" index.html
grep -c "research-row" index.html
grep -c "filter-dropdown" index.html
grep -c "filterLabel\|filterToggle\|filterMenu" index.html
```

Expected output:
```
3       (project-featured: article tag + 2 class uses inside)
16      (8 research rows × 2 — opening <a> + inner elements)
0       (filter-dropdown gone)
0       (filter IDs gone)
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: restructure projects and research sections in HTML"
```

---

### Task 2: CSS — Add new component styles

**Files:**
- Modify: `assets/css/main-theme.css`

Add all new CSS rules after the existing `/* ================================ PROJECT CARD ================================ */` section. Find that comment block and insert the new rules after the last `.project-card` rule block (after `.project-card:hover .arrow` rule).

- [ ] **Step 1: Add section eyebrow and subtitle styles**

Find the `/* ================================ PROJECT CARD ================================ */` comment and insert before it:

```css
/* ================================
   SECTION EYEBROW
================================ */

.section-eyebrow {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.section-eyebrow__line {
  flex: 1;
  height: 1px;
  background: var(--border-primary);
}

.section-eyebrow__label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.section__subtitle {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  margin-top: calc(var(--space-4) * -1);
  margin-bottom: var(--space-10);
}
```

- [ ] **Step 2: Add featured card styles**

After the section eyebrow block, add:

```css
/* ================================
   FEATURED PROJECT CARD
================================ */

.project-featured {
  background: #141210;
  border-radius: var(--radius-xl);
  padding: var(--space-10) var(--space-12);
  margin-bottom: var(--space-4);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-8);
  align-items: end;
  position: relative;
  overflow: hidden;
}

.project-featured::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-warm), var(--accent-sage));
}

.project-featured__eyebrow {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.project-featured__tag {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  color: #807b76;
}

.project-featured__tag--featured {
  background: rgba(225, 29, 100, 0.2);
  color: #f43f7a;
}

.project-featured__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 400;
  color: #ebe8e4;
  margin-bottom: var(--space-3);
  line-height: 1.2;
}

.project-featured__desc {
  font-size: var(--text-sm);
  color: #807b76;
  max-width: 480px;
  line-height: 1.65;
  margin-bottom: var(--space-6);
}

.project-featured__tech {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.project-featured__tech span {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  background: rgba(255, 255, 255, 0.06);
  color: #807b76;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.project-featured__link {
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--accent-warm);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
  align-self: flex-end;
  transition: color var(--transition-fast);
  letter-spacing: 0.01em;
}

.project-featured__link:hover {
  color: var(--accent-warm-hover);
}

.project-featured__link .arrow {
  transition: transform var(--transition-fast);
}

.project-featured__link:hover .arrow {
  transform: translate(3px, -3px);
}

@media (max-width: 639px) {
  .project-featured {
    grid-template-columns: 1fr;
    padding: var(--space-6) var(--space-6);
  }

  .project-featured__link {
    align-self: flex-start;
  }
}
```

- [ ] **Step 3: Add project card category style**

Find `.project-card__tags` in `main-theme.css`. Directly before it, insert:

```css
.project-card__category {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: var(--space-2);
}
```

- [ ] **Step 4: Add research row styles**

Find the `/* ================================ SCROLL TO TOP ================================ */` comment (or similar section break near the end of component styles). Insert before it:

```css
/* ================================
   RESEARCH ROWS
================================ */

.research-list {
  margin-top: 0;
}

.research-row {
  display: grid;
  grid-template-columns: 1.1fr 2fr auto;
  gap: var(--space-8);
  align-items: start;
  padding: var(--space-6) 0;
  border-bottom: 1px solid var(--border-primary);
  text-decoration: none;
  color: inherit;
  transition: background var(--transition-fast);
}

.research-row:first-child {
  border-top: 1px solid var(--border-primary);
}

.research-row:hover .research-row__title {
  color: var(--accent-warm);
}

.research-row__title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 400;
  color: var(--text-primary);
  line-height: 1.35;
  transition: color var(--transition-fast);
}

.research-row__subtitle {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--text-tertiary);
  margin-top: var(--space-1);
  letter-spacing: 0.04em;
}

.research-row__desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: 1.65;
  margin: 0;
}

.research-row__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.research-row__tag {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  white-space: nowrap;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}

.research-row__tag--first-author {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

[data-theme="dark"] .research-row__tag--first-author {
  background: rgba(124, 58, 237, 0.15);
  color: #a78bfa;
}

.research-row__tag--ieee {
  background: rgba(225, 29, 100, 0.1);
  color: var(--accent-warm);
}

.research-row__link {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent-warm);
  margin-top: auto;
  white-space: nowrap;
}
```

- [ ] **Step 5: Add research row breakpoints**

Add after the `.research-row__link` rule (still in the same section):

```css
@media (max-width: 767px) {
  .research-row {
    grid-template-columns: 1fr auto;
    gap: var(--space-4);
  }

  .research-row__desc {
    display: none;
  }
}

@media (max-width: 479px) {
  .research-row {
    grid-template-columns: 1fr;
  }

  .research-row__meta {
    align-items: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat: add section eyebrow, featured card, and research row CSS"
```

---

### Task 3: CSS — Remove old styles and update existing rules

**Files:**
- Modify: `assets/css/main-theme.css`

- [ ] **Step 1: Remove the entire filter dropdown CSS block**

Find and delete everything from `/* ── Filter Dropdown ── */` (including that comment) through `.project-card.filter-hidden { display: none; }` (including that rule). This is approximately 140 lines.

The block starts with:
```css
/* ── Filter Dropdown ── */

.filter-dropdown {
  position: relative;
```

And ends with:
```css
.project-card.filter-hidden {
  display: none;
}
```

Delete the entire block including both the opening comment and closing rule. Also delete `.filter-label { ... }` which is inside this block.

- [ ] **Step 2: Remove `.project-card__tags` CSS**

Find and delete the `.project-card__tags` rule block:
```css
.project-card__tags {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
```

Also find and delete any breakpoint override for `.project-card__tags` (around the tablet breakpoint, there may be `.project-card__tags { margin-bottom: var(--space-4); }`).

- [ ] **Step 3: Update `.project-card` padding**

Find the `.project-card` rule. Change `padding: var(--space-8);` to `padding: var(--space-6);`.

- [ ] **Step 4: Update `.projects-grid` gap**

Find `.projects-grid { display: grid; ... }`. Change `gap: var(--space-6);` to `gap: 1rem;`.

- [ ] **Step 5: Verify no filter references remain**

```bash
grep -n "filter-dropdown\|filter-hidden\|filterLabel\|filterToggle\|filterMenu\|filter-label" assets/css/main-theme.css
```

Expected: no output (zero matches).

- [ ] **Step 6: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat: remove filter dropdown CSS and update project card styles"
```

---

### Task 4: Visual verification

**Files:** None (read-only verification)

- [ ] **Step 1: Open the site in a browser and check the Projects section**

```bash
cd /Users/evintleovonzko/Documents/research/Evintkoo.github.io
npx playwright@latest chromium "file://$(pwd)/index.html" 2>/dev/null || open index.html
```

Or use Playwright to load and screenshot:

```javascript
// Run via: node -e "<script>"
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('file:///Users/evintleovonzko/Documents/research/Evintkoo.github.io/index.html');
  await page.evaluate(() => document.querySelector('#projects').scrollIntoView());
  await page.screenshot({ path: '/tmp/projects-section.png', fullPage: false });
  await browser.close();
})();
```

Expected:
- Dark featured card for Kolosal AI spanning full width with gradient top bar
- 8 compact grid cards below in 3 columns
- No filter dropdown visible
- Category labels (mono text) above each card title

- [ ] **Step 2: Check the Research section**

Scroll to `#research` and verify:

Expected:
- Section eyebrow `02 / Research & Analysis` with extending lines
- 8 editorial rows with title left / description middle / tags+link right
- First Author rows have purple badge
- IEEE TNNLS row has pink badge
- Hover on any row turns title pink

- [ ] **Step 3: Check breakpoints**

Resize to 768px:

Expected:
- Projects grid collapses to 2 columns
- Research rows collapse to 2 columns (description hidden)

Resize to 479px:

Expected:
- Projects grid collapses to 1 column
- Research rows collapse to 1 column (tags below title)

- [ ] **Step 4: Check nav link**

Click "Research" in the nav — should scroll to the `#research` section, not `#projects`.

- [ ] **Step 5: Check dark mode**

Toggle dark mode. Verify:
- Featured card stays dark (doesn't invert — it's always `#141210`)
- Project cards get dark background
- Research rows use dark border and text colors

- [ ] **Step 6: Commit if any fixes were needed**

```bash
git add index.html assets/css/main-theme.css
git commit -m "fix: adjust projects redesign after visual verification"
```
