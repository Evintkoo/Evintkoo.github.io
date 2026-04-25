# Neuron Activation Paper + Tech-Tag Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the neuron-activation-analysis paper as a dedicated research page, wire it into both research lists and the TRIBE v2 project card, and make all project-page tech-tags clickable filters.

**Architecture:** Static HTML/CSS/JS site — no build step. The tag filter is pure vanilla JS that reads `?tag=` from the URL and hides non-matching project cards. The paper page mirrors `research/grasp.html` exactly.

**Tech Stack:** HTML, CSS (custom properties / BEM), vanilla JS (ES5-compatible inline scripts)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `files/neuron_activation_paper.pdf` | Create (download) | Paper PDF asset |
| `research/neuron-activation-analysis.html` | Create | Dedicated paper page |
| `index.html` | Modify | Add 2 research rows (items 12 & 13), update TRIBE v2 card, convert tech-tags to links |
| `research.html` | Modify | Add neuron-activation-analysis research row |
| `projects.html` | Modify | Add filter banner + JS, add paper link to TRIBE v2 card, convert tech-tags to links |
| `projects/tribe-playground.html` | Modify | Add "Read Paper" link |
| `assets/css/main-theme.css` | Modify | Add `.tag-filter-banner` styles + `.tech-tag` hover state |

---

## Task 1: Download the Paper PDF

**Files:**
- Create: `files/neuron_activation_paper.pdf`

- [ ] **Step 1: Download from GitHub**

```bash
curl -L "https://raw.githubusercontent.com/Evintkoo/neuron-activation-analysis/main/paper.pdf" \
  -o /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/files/neuron_activation_paper.pdf
```

Expected: file exists at `files/neuron_activation_paper.pdf`, non-zero size.

- [ ] **Step 2: Verify the file downloaded correctly**

```bash
ls -lh /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/files/neuron_activation_paper.pdf
```

Expected: file is at least 100 KB.

- [ ] **Step 3: Commit**

```bash
git add files/neuron_activation_paper.pdf
git commit -m "feat: add neuron activation analysis paper PDF"
```

---

## Task 2: Create the Dedicated Research Page

**Files:**
- Create: `research/neuron-activation-analysis.html`

This page mirrors `research/grasp.html` structure exactly. Use the nav, RSB sidebar, hero, abstract, introduction, methods, results, theory evaluation, conclusion, related research, back-to-portfolio, footer, and scripts sections from grasp.html — swapping in content from the paper.

- [ ] **Step 1: Create `research/neuron-activation-analysis.html`**

Create the file with this full content:

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>What Does the Internet Do to the Brain? | Evint Leovonzko</title>
    <meta name="description" content="Activation Cartography: mapping cortical activation fingerprints across 13 internet content categories using a deep fMRI encoder — 3,008 stimuli, 20,484 cortical points.">

    <meta property="og:type" content="website">
    <meta property="og:title" content="What Does the Internet Do to the Brain? | Evint Leovonzko">
    <meta property="og:description" content="Mapping cortical activation fingerprints across 13 digital content categories using TRIBE v2 — a 177M-parameter deep fMRI encoder.">
    <meta property="og:image" content="https://evintkoo.github.io/assets/images/logos/logo-light.png">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

    <link rel="icon" type="image/png" href="../assets/images/logos/logo-light.png">
    <link rel="apple-touch-icon" href="../assets/images/logos/logo-light.png">
    <link rel="stylesheet" href="../assets/css/main-theme.css?v=12">
    <link rel="stylesheet" href="../assets/css/research.css?v=13">
</head>

<body class="research-page">
    <div id="readingProgress" class="reading-progress"></div>
    <div class="cursor-dot" id="cursorDot"></div>
    <div class="cursor-ring" id="cursorRing"></div>
    <div class="scene-bg" aria-hidden="true"><canvas id="heroCanvas"></canvas></div>

    <nav class="nav">
        <div class="nav__container">
            <a href="../index.html" class="nav__logo">
                <img src="../assets/images/logos/logo-light.png" alt="EL" class="nav__logo-img nav__logo-img--dark">
                <img src="../assets/images/logos/logo-dark.png" alt="EL" class="nav__logo-img nav__logo-img--light">
                <span class="nav__logo-text">Evint Leovonzko</span>
            </a>
            <button class="nav__toggle" id="navToggle" aria-label="Toggle menu">
                <span></span><span></span><span></span>
            </button>
            <div class="nav__menu" id="navMenu">
                <a href="../projects.html" class="nav__link">Projects</a>
                <a href="../research.html" class="nav__link">Research</a>
                <a href="../about.html" class="nav__link">About</a>
                <a href="../index.html#contact" class="nav__link nav__link--cta">Get in touch</a>
            </div>
            <div class="nav__actions">
                <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
                    <div class="theme-icon-stage" id="themeIconStage">
                        <svg class="theme-icon theme-icon--sun theme-icon--hidden" id="themeIconSun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle class="sun-core" cx="12" cy="12" r="5"></circle>
                            <line class="sun-ray sun-ray--1" x1="12" y1="1" x2="12" y2="3"></line>
                            <line class="sun-ray sun-ray--2" x1="12" y1="21" x2="12" y2="23"></line>
                            <line class="sun-ray sun-ray--3" x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line class="sun-ray sun-ray--4" x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line class="sun-ray sun-ray--5" x1="1" y1="12" x2="3" y2="12"></line>
                            <line class="sun-ray sun-ray--6" x1="21" y1="12" x2="23" y2="12"></line>
                            <line class="sun-ray sun-ray--7" x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line class="sun-ray sun-ray--8" x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <svg class="theme-icon theme-icon--moon" id="themeIconMoon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    </nav>
    <div class="nav-overlay" id="nav-overlay"></div>

    <main class="research-layout">
        <aside class="rsb" id="rsb">
            <div class="rsb__inner">
                <p class="rsb__title">Research Sections</p>
                <nav>
                    <a href="#abstract"      class="rsb__link active">Abstract</a>
                    <a href="#introduction"  class="rsb__link">Introduction</a>
                    <a href="#methods"       class="rsb__link">Methods</a>
                    <a href="#results"       class="rsb__link">Results</a>
                    <a href="#theory"        class="rsb__link">Theory</a>
                    <a href="#conclusion"    class="rsb__link">Conclusion</a>
                </nav>
            </div>
            <button class="rsb__tab" id="rsbTab" aria-label="Toggle navigation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <polyline class="rsb__chevron" points="15 18 9 12 15 6"/>
                </svg>
            </button>
        </aside>
        <div class="rsb__overlay" id="rsbOverlay"></div>

        <div class="research-content">
            <div class="research-content__inner">

                <!-- Hero -->
                <section class="circrna-hero">
                    <div class="circrna-hero__content">
                        <div class="circrna-hero__primary">
                            <div class="paper-hero__badge">
                                <span class="badge-icon icon-inline icon-inline--leading" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                </span>
                                <span class="badge-text">Research Paper</span>
                            </div>

                            <h1 class="circrna-title">What Does the Internet Do to the Brain?</h1>
                            <p class="circrna-subtitle">Mapping Cortical Activation Fingerprints Across Digital Content Modalities Using a Deep fMRI Encoder</p>

                            <div class="circrna-summary">
                                <p class="summary-lead">Activation Cartography maps 3,008 natural language stimuli across 13 internet content categories against predictions from TRIBE v2 &mdash; a 177M-parameter deep neural encoder trained on real fMRI recordings &mdash; revealing statistically significant, category-level differences in predicted cortical recruitment.</p>

                                <div class="summary-highlights">
                                    <div class="hero-metric">
                                        <span class="hero-metric__value">3,008</span>
                                        <span class="hero-metric__label">stimuli evaluated</span>
                                    </div>
                                    <div class="hero-metric">
                                        <span class="hero-metric__value">13</span>
                                        <span class="hero-metric__label">content categories</span>
                                    </div>
                                    <div class="hero-metric">
                                        <span class="hero-metric__value">20,484</span>
                                        <span class="hero-metric__label">cortical surface points</span>
                                    </div>
                                </div>

                                <div class="paper-hero__actions">
                                    <a href="../files/neuron_activation_paper.pdf" target="_blank" rel="noopener" class="btn btn-primary">
                                        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                        </svg>
                                        <span class="btn-text">View Full Paper</span>
                                    </a>
                                    <a href="https://github.com/Evintkoo/neuron-activation-analysis" target="_blank" rel="noopener" class="btn btn-secondary">
                                        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                                        </svg>
                                        <span class="btn-text">View Code</span>
                                    </a>
                                    <a href="#abstract" class="btn btn-secondary">
                                        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 4L10.59 5.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                                        </svg>
                                        <span class="btn-text">Start Reading</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <aside class="paper-meta-snapshot">
                            <div class="paper-meta-simple">
                                <h2 class="paper-meta-heading">Research Snapshot</h2>
                                <p class="paper-meta-summary">Study design, encoder architecture, and key statistical findings.</p>

                                <div class="paper-meta-highlights">
                                    <div class="meta-highlight">
                                        <span class="meta-highlight__value">F = 13.51</span>
                                        <span class="meta-highlight__label">ANOVA main effect</span>
                                    </div>
                                    <div class="meta-highlight">
                                        <span class="meta-highlight__value">96.9%</span>
                                        <span class="meta-highlight__label">variance in PC1</span>
                                    </div>
                                    <div class="meta-highlight">
                                        <span class="meta-highlight__value">177M</span>
                                        <span class="meta-highlight__label">encoder parameters</span>
                                    </div>
                                </div>

                                <div class="paper-meta-details">
                                    <div class="meta-detail">
                                        <span class="meta-detail__label">Encoder</span>
                                        <span class="meta-detail__value">TRIBE v2 — deep neural fMRI encoder predicting whole-cortex haemodynamic responses</span>
                                    </div>
                                    <div class="meta-detail">
                                        <span class="meta-detail__label">Key result</span>
                                        <span class="meta-detail__value">Significant main effect: F(12, 2995) = 13.51, p &lt; 10&sup2;&sup6;, &eta;&sup2; = 0.051. Cohen&rsquo;s d = &minus;0.82 between highest and lowest categories.</span>
                                    </div>
                                    <div class="meta-detail">
                                        <span class="meta-detail__label">Theory</span>
                                        <span class="meta-detail__value">GWT receives strongest support; FEP weakly supported; DCT and IIT mixed evidence</span>
                                    </div>
                                </div>

                                <div class="paper-meta-footer">
                                    <div class="paper-meta-tags">
                                        <span class="meta-pill">fMRI Encoding</span>
                                        <span class="meta-pill">Internet Content</span>
                                        <span class="meta-pill">Cortical Mapping</span>
                                        <span class="meta-pill">Deep Learning</span>
                                        <span class="meta-pill">Global Workspace Theory</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </section>

                <!-- Abstract -->
                <section id="abstract" class="research-section">
                    <div class="section-header">
                        <div class="section-label">
                            <h2 class="section-title">Abstract</h2>
                        </div>
                    </div>
                    <div class="abstract-content">
                        <div class="abstract-item" data-phase="introduction">
                            <div class="abstract-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                            </div>
                            <div class="abstract-content-wrapper">
                                <h3 class="abstract-label">Background</h3>
                                <p>Despite extensive single-stimulus neuroscience on emotional, narrative, and threatening media, no large-scale comparative study exists of how distinct categories of internet content differentially engage the cortex at scale.</p>
                            </div>
                        </div>
                        <div class="abstract-item" data-phase="methods">
                            <div class="abstract-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                            </div>
                            <div class="abstract-content-wrapper">
                                <h3 class="abstract-label">Methods</h3>
                                <p>Activation Cartography maps 3,008 natural language stimuli across 13 internet content categories against predictions from TRIBE v2 &mdash; a 177M-parameter deep neural encoder trained on real fMRI recordings that predicts whole-cortex haemodynamic responses. Each stimulus yielded a predicted activation profile across 20,484 cortical surface points, summarised into six anatomical regions.</p>
                            </div>
                        </div>
                        <div class="abstract-item" data-phase="results">
                            <div class="abstract-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 3v18h18"/>
                                    <path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                                </svg>
                            </div>
                            <div class="abstract-content-wrapper">
                                <h3 class="abstract-label">Results</h3>
                                <p>A one-way ANOVA revealed a significant main effect of content type (F(12, 2995) = 13.51, p &lt; 10&sup2;&sup6;, &eta;&sup2; = 0.051). ThreatSafety content ranked highest and Narrative lowest (Cohen&rsquo;s d = &minus;0.82). A dominant cortical gradient (PC1 = 96.9% variance) contrasts sensory-language against executive-motor cortex across all categories.</p>
                            </div>
                        </div>
                        <div class="abstract-item" data-phase="conclusion">
                            <div class="abstract-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <div class="abstract-content-wrapper">
                                <h3 class="abstract-label">Implications</h3>
                                <p>Different internet content categories engage distinct brain circuits with statistically significant differences in predicted intensity. GWT&rsquo;s prediction that threat-laden content drives broad cortical activation received the strongest support. The analysis pipeline and registered hypotheses are released with the project.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Introduction -->
                <section id="introduction" class="research-section">
                    <div class="section-header">
                        <div class="section-label">
                            <h2 class="section-title">Introduction</h2>
                        </div>
                    </div>
                    <div class="content-text">
                        <p class="lead-paragraph">Digital media consumption has become a defining feature of contemporary cognitive life. Recent estimates indicate the average adult consumes six to eight hours of digital content per day &mdash; a duration that exceeds sleep for many subpopulations. A fundamental empirical question follows: whether distinct categories of internet content engage the cerebral cortex equivalently, or whether systematic, category-level differences in predicted neural recruitment can be identified at scale.</p>

                        <div class="research-highlight research-highlight--success">
                            <div class="highlight-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div class="highlight-content">
                                <h4 class="highlight-title">Activation Cartography</h4>
                                <p>Rather than running a single-category fMRI study, Activation Cartography uses a validated deep neural encoder (TRIBE v2) to predict whole-brain responses at scale &mdash; enabling a 13-category comparative study with 3,008 stimuli that would be logistically impossible with real scanner time.</p>
                            </div>
                        </div>

                        <p>The neuroscience of media consumption has historically been constrained by the throughput of fMRI acquisition: each participant yields a few hundred trials per session, making large comparative studies prohibitively expensive. TRIBE v2 breaks this barrier by predicting whole-cortex haemodynamic responses from text inputs, enabling population-scale analysis of content-type effects on predicted brain activation.</p>

                        <p>Four neuroscientific frameworks are evaluated against the activation patterns: Global Workspace Theory (GWT), Free Energy Principle (FEP), Default-mode Circuit Theory (DCT), and Integrated Information Theory (IIT). Each makes distinct predictions about which content types should drive the broadest or most intense cortical recruitment.</p>
                    </div>
                </section>

                <!-- Methods -->
                <section id="methods" class="research-section">
                    <div class="section-header">
                        <div class="section-label">
                            <h2 class="section-title">Methods</h2>
                        </div>
                    </div>

                    <div class="methods-timeline">
                        <div class="method-card" data-step="1">
                            <div class="method-step-badge"><span class="step-number">01</span></div>
                            <div class="method-content">
                                <div class="method-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                                    </svg>
                                </div>
                                <div class="method-text">
                                    <h3 class="method-title">Stimulus Construction</h3>
                                    <p class="method-description">3,008 stimuli drawn from established NLP benchmarks and live internet sources, distributed across 13 content categories: ThreatSafety, News, Social, Scientific, Narrative, Emotional, AudioText, ImageVisual, Educational, Persuasive, Humour, Instructional, and Commerce. Each stimulus is a short natural language passage (1&ndash;3 sentences).</p>
                                    <div class="method-tags">
                                        <span class="method-tag">3,008 Stimuli</span>
                                        <span class="method-tag">13 Categories</span>
                                        <span class="method-tag">NLP Benchmarks</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="method-card" data-step="2">
                            <div class="method-step-badge"><span class="step-number">02</span></div>
                            <div class="method-content">
                                <div class="method-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <ellipse cx="12" cy="12" rx="10" ry="6"/>
                                        <line x1="2" y1="12" x2="22" y2="12"/>
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                    </svg>
                                </div>
                                <div class="method-text">
                                    <h3 class="method-title">TRIBE v2 Encoder</h3>
                                    <p class="method-description">TRIBE v2 is a 177-million-parameter deep neural encoder trained on real functional MRI recordings. Given a text input, it predicts a whole-cortex haemodynamic response across 20,484 cortical surface points. Two encoding modes are used: hash-mode (fast, token-level) and semantic-mode (LLaMA-3.2-3B embeddings, N = 390 replication sample).</p>
                                    <div class="method-tags">
                                        <span class="method-tag">177M Parameters</span>
                                        <span class="method-tag">20,484 Cortical Points</span>
                                        <span class="method-tag">LLaMA-3.2-3B</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="method-card" data-step="3">
                            <div class="method-step-badge"><span class="step-number">03</span></div>
                            <div class="method-content">
                                <div class="method-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                    </svg>
                                </div>
                                <div class="method-text">
                                    <h3 class="method-title">Statistical Analysis</h3>
                                    <p class="method-description">Each stimulus&rsquo;s 20,484-point activation profile is summarised into six anatomical regions. A one-way ANOVA tests the main effect of content type on mean global activation. Effect sizes reported as &eta;&sup2; and Cohen&rsquo;s d. Principal component analysis across category mean profiles identifies dominant cortical gradients.</p>
                                    <div class="method-tags">
                                        <span class="method-tag">One-way ANOVA</span>
                                        <span class="method-tag">Cohen&rsquo;s d</span>
                                        <span class="method-tag">PCA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Results -->
                <section id="results" class="research-section">
                    <div class="section-header">
                        <div class="section-label">
                            <h2 class="section-title">Results</h2>
                        </div>
                    </div>
                    <div class="content-text">
                        <p class="lead-paragraph">A one-way ANOVA on predicted global activation revealed a statistically significant main effect of content type across all 13 categories.</p>

                        <div class="research-highlight research-highlight--success">
                            <div class="highlight-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div class="highlight-content">
                                <h4 class="highlight-title">ANOVA: F(12, 2995) = 13.51, p &lt; 10&sup2;&sup6;</h4>
                                <p>Under hash-mode encoding, ThreatSafety content ranked highest and Narrative lowest (Cohen&rsquo;s d = &minus;0.82). The semantic replication (N = 390, LLaMA-3.2-3B) produced a 4&times; wider activation spread, with AudioText, ImageVisual, and Emotional leading &mdash; a ranking essentially uncorrelated with hash-mode ordering (r = 0.09).</p>
                            </div>
                        </div>

                        <p><strong>Dominant cortical gradient (PC1 = 96.9% variance)</strong> contrasts sensory-language cortex (high loading: auditory, visual, language network) against executive-motor cortex (low loading: prefrontal, motor) across all 13 categories. This gradient is consistent across encoding modes despite the different category rankings.</p>

                        <p><strong>Regional breakdown</strong> shows that ThreatSafety content activates the language network and prefrontal cortex most strongly under hash-mode, while AudioText and ImageVisual content drives the largest visual and auditory cortex responses under semantic encoding &mdash; suggesting hash-mode captures surface lexical features while semantic-mode captures deeper representational content.</p>
                    </div>
                </section>

                <!-- Theory Evaluation -->
                <section id="theory" class="research-section">
                    <div class="section-header">
                        <div class="section-label">
                            <h2 class="section-title">Theory Evaluation</h2>
                        </div>
                    </div>
                    <div class="content-text">
                        <p class="lead-paragraph">Four neuroscientific frameworks were assessed against predicted activation patterns, each making distinct testable predictions about which content types should drive the broadest cortical recruitment.</p>

                        <div class="research-highlight research-highlight--success">
                            <div class="highlight-icon">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <div class="highlight-content">
                                <h4 class="highlight-title">Global Workspace Theory — Strongest Support</h4>
                                <p>GWT predicts that threat-laden content should trigger a global broadcast, driving widespread cortical ignition. ThreatSafety content ranking highest under hash-mode (d = &minus;0.82) directly supports this. The finding that a single dominant gradient accounts for 96.9% of between-category variance is also consistent with GWT&rsquo;s single-workspace model.</p>
                            </div>
                        </div>

                        <p><strong>Free Energy Principle</strong> predicts prediction-error-rich content (novel, surprising, uncertain stimuli) should drive higher activation. The moderate support observed is consistent: ThreatSafety and News content (high surprise value) rank highly, but the correlation with uncertainty proxies is weak (r &asymp; 0.3).</p>

                        <p><strong>Default-mode Circuit Theory</strong> predicts narrative and self-referential content should activate default mode network most strongly. This receives mixed evidence: Narrative ranked lowest under hash-mode, but higher under semantic encoding &mdash; suggesting encoding mode mediates the narrative-DMN link.</p>

                        <p><strong>Integrated Information Theory</strong> predicts content with higher integrated information (&Phi;) should drive more cortical activation. IIT receives mixed evidence: there is no reliable proxy for &Phi; in natural language stimuli, making this prediction untestable at current resolution.</p>
                    </div>
                </section>

                <!-- Conclusion -->
                <section id="conclusion" class="research-section">
                    <div class="section-header">
                        <div class="section-label">
                            <h2 class="section-title">Conclusion</h2>
                        </div>
                    </div>
                    <div class="content-text">
                        <p class="lead-paragraph">Activation Cartography demonstrates that different internet content categories engage distinct brain circuits with statistically significant differences in predicted intensity (F(12, 2995) = 13.51, p &lt; 10&sup2;&sup6;, &eta;&sup2; = 0.051). The dominant cortical gradient &mdash; sensory-language vs executive-motor &mdash; is stable across encoding modes and accounts for 96.9% of between-category variance.</p>

                        <p>The encoding-mode dependence of category rankings (r = 0.09 between hash-mode and semantic-mode) is the study&rsquo;s most important methodological finding: surface lexical features (hash-mode) and deep semantic representations (semantic-mode) produce systematically different activation predictions, suggesting that fMRI encoding models are sensitive to which level of linguistic representation is used as input.</p>

                        <p>Future directions include higher-powered semantic replication (N &ge; 150 per category) to resolve the hash/semantic discrepancy, extension to multimodal stimuli (images, audio) using TRIBE v2&rsquo;s full multimodal encoder, and pre-registration of the category-ranking hypothesis for confirmatory testing.</p>
                    </div>
                </section>

                <!-- Related Research -->
                <section class="research-section">
                    <h2 class="research-section__title">Related Research</h2>
                    <div class="cards" id="smart-recommendations"></div>
                </section>

                <!-- Back to Portfolio -->
                <section class="research-section">
                    <div class="back-to-portfolio">
                        <a href="../research.html" class="animated-button">
                            <span>Back to Portfolio</span>
                            <div class="icon">
                                <svg class="fa-remove" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                                <svg class="fa-check" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            </div>
                        </a>
                    </div>
                </section>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer__content">
                <div class="footer__left">
                    <p class="footer__text">Built with curiosity &mdash; Evint Leovonzko, 2025</p>
                </div>
                <div class="footer__links">
                    <a href="https://github.com/Evintkoo" target="_blank" rel="noopener noreferrer" class="footer__link">GitHub</a>
                    <a href="https://www.linkedin.com/in/evint-leovonzko" target="_blank" rel="noopener noreferrer" class="footer__link">LinkedIn</a>
                    <a href="https://www.instagram.com/evint_leo/" target="_blank" rel="noopener noreferrer" class="footer__link">Instagram</a>
                </div>
            </div>
        </div>
    </footer>

    <script src="../assets/js/main-theme.js?v=11"></script>
    <script src="../assets/js/research-recommendations.js"></script>
    <script src="../assets/js/animations.js?v=13"></script>
    <script type="module" src="../assets/js/hero-scene.js?v=13"></script>
</body>
</html>
```

- [ ] **Step 2: Verify the file renders**

Open `research/neuron-activation-analysis.html` in a browser (e.g. `open research/neuron-activation-analysis.html` or via a local server). Confirm:
- Hero title, 3 metrics, and 3 action buttons visible
- Sidebar nav links (Abstract, Introduction, Methods, Results, Theory, Conclusion) present
- "View Full Paper" button href points to `../files/neuron_activation_paper.pdf`
- All 4 abstract items render with icons

- [ ] **Step 3: Commit**

```bash
git add research/neuron-activation-analysis.html
git commit -m "feat: add neuron activation analysis dedicated research page"
```

---

## Task 3: Add Research List Entries

**Files:**
- Modify: `index.html` (lines ~667 and ~676)
- Modify: `research.html` (after last research row, before closing `</div>`)

### 3a — index.html

The current last research item is `data-research-item="11"` (bitcoin-portfolio-allocation, ending around line 667). Add two new rows immediately after it, before the closing `</div>` of `research-list`.

- [ ] **Step 1: Add neuron-activation-analysis row to index.html**

In `index.html`, find this exact closing sequence after item 11:

```html
                </a>
            </div>

            <!-- Research Pagination -->
```

Replace it with:

```html
                </a>

                <!-- Neuron Activation Analysis -->
                <a href="research/neuron-activation-analysis.html" class="research-row" data-research-item="12">
                    <div>
                        <div class="research-row__title">What Does the Internet Do to the Brain?</div>
                        <div class="research-row__subtitle">Computational Neuroscience &middot; Digital Media</div>
                        <div class="research-row__keywords">fMRI encoding, internet content, cortical mapping, deep learning, Global Workspace Theory, TRIBE v2</div>
                    </div>
                    <div class="research-row__desc">
                        Activation Cartography maps 3,008 stimuli across 13 content categories against TRIBE v2 predictions &mdash; a 177M-parameter fMRI encoder. Significant main effect F(12, 2995) = 13.51, p &lt; 10&sup2;&sup6;; ThreatSafety drives broadest cortical activation; dominant gradient accounts for 96.9% of between-category variance.
                    </div>
                    <div class="research-row__meta">
                        <span class="research-row__tag research-row__tag--first-author">First Author</span>
                        <span class="research-row__tag">Neuroscience</span>
                        <span class="research-row__link" aria-hidden="true">Read Paper &rarr;</span>
                    </div>
                </a>

                <!-- Cancer Leading Mutation DNA of P-53 Gene -->
                <a href="research/p53-mutation.html" class="research-row" data-research-item="13">
                    <div>
                        <div class="research-row__title">Cancer Leading Mutation DNA of P-53 Gene</div>
                        <div class="research-row__subtitle">Computational Biology &middot; Award-Winning Research</div>
                        <div class="research-row__keywords">P-53, genetic algorithms, tumor suppressor, cancer genomics, mutation analysis</div>
                    </div>
                    <div class="research-row__desc">
                        Closed-loop genetic algorithms surface the earliest mutation signatures that destabilise P-53 &mdash; the &ldquo;guardian of the genome&rdquo; &mdash; before malignant cascades take hold. Best Research Project, UBC Vantage College.
                    </div>
                    <div class="research-row__meta">
                        <span class="research-row__tag research-row__tag--first-author">First Author</span>
                        <span class="research-row__link" aria-hidden="true">Read Paper &rarr;</span>
                    </div>
                </a>
            </div>

            <!-- Research Pagination -->
```

- [ ] **Step 2: Verify pagination auto-updates**

The existing pagination JS at the bottom of `index.html` reads `items.length` dynamically and computes `totalPages = Math.ceil(total / PER_PAGE)`. With 14 items and PER_PAGE = 6, totalPages becomes 3. Open the page in a browser and confirm the indicator shows "1 / 3" and the Next button is enabled.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add neuron activation analysis and p53 entries to index research list"
```

### 3b — research.html

- [ ] **Step 4: Add neuron-activation-analysis row to research.html**

In `research.html`, find the comment `<!-- Bitcoin Portfolio Allocation -->` (around line 258). Insert the new row immediately before it:

```html
                    <!-- Neuron Activation Analysis -->
                    <a href="research/neuron-activation-analysis.html" class="research-row">
                        <div>
                            <div class="research-row__title">What Does the Internet Do to the Brain?</div>
                            <div class="research-row__subtitle">Computational Neuroscience &middot; Digital Media</div>
                            <div class="research-row__keywords">fMRI encoding, internet content, cortical mapping, deep learning, Global Workspace Theory, TRIBE v2</div>
                        </div>
                        <div class="research-row__desc">
                            Activation Cartography maps 3,008 stimuli across 13 content categories against TRIBE v2 predictions &mdash; a 177M-parameter fMRI encoder. Significant main effect F(12, 2995) = 13.51, p &lt; 10&sup2;&sup6;; ThreatSafety drives broadest cortical activation; dominant gradient accounts for 96.9% of between-category variance.
                        </div>
                        <div class="research-row__meta">
                            <span class="research-row__tag research-row__tag--first-author">First Author</span>
                            <span class="research-row__tag">Neuroscience</span>
                            <span class="research-row__link" aria-hidden="true">Read Paper &rarr;</span>
                        </div>
                    </a>

```

- [ ] **Step 5: Verify research.html**

Open `research.html` in a browser. Confirm the neuron activation row is visible and clickable, navigating to `research/neuron-activation-analysis.html`.

- [ ] **Step 6: Commit**

```bash
git add research.html
git commit -m "feat: add neuron activation analysis to research.html list"
```

---

## Task 4: Wire TRIBE v2 Project Cards

**Files:**
- Modify: `index.html` (TRIBE v2 card, ~line 420)
- Modify: `projects.html` (TRIBE v2 card)
- Modify: `projects/tribe-playground.html` (project detail page)

### 4a — index.html

- [ ] **Step 1: Add "Read Paper" link to TRIBE v2 card in index.html**

Find this exact block in `index.html`:

```html
                        <div class="project-card__links">
                            <a href="projects/tribe-playground.html" class="project-card__link">
                                Learn More <span class="arrow">&rarr;</span>
                            </a>
                            <a href="https://github.com/Evintkoo/tribe-playground" target="_blank" rel="noopener noreferrer" class="project-card__link">
                                Repo <span class="arrow">&nearr;</span>
                            </a>
                        </div>
```

Replace with:

```html
                        <div class="project-card__links">
                            <a href="projects/tribe-playground.html" class="project-card__link">
                                Learn More <span class="arrow">&rarr;</span>
                            </a>
                            <a href="research/neuron-activation-analysis.html" class="project-card__link">
                                Read Paper <span class="arrow">&rarr;</span>
                            </a>
                            <a href="https://github.com/Evintkoo/tribe-playground" target="_blank" rel="noopener noreferrer" class="project-card__link">
                                Repo <span class="arrow">&nearr;</span>
                            </a>
                        </div>
```

### 4b — projects.html

- [ ] **Step 2: Add "Read Paper" link to TRIBE v2 card in projects.html**

Find the TRIBE v2 card in `projects.html` (search for `tribe-playground.html`). The `project-card__links` block will look identical to the one in index.html. Apply the same replacement: add `<a href="research/neuron-activation-analysis.html" class="project-card__link">Read Paper <span class="arrow">&rarr;</span></a>` between "Learn More" and "Repo".

### 4c — projects/tribe-playground.html

- [ ] **Step 3: Add "Read Paper" link to the tribe-playground detail page**

In `projects/tribe-playground.html`, find the links section (around line 165):

```html
                        <a href="https://github.com/Evintkoo/tribe-playground" target="_blank" rel="noopener noreferrer" class="btn btn--primary">
```

Add a new button immediately before it:

```html
                        <a href="../research/neuron-activation-analysis.html" class="btn btn--secondary">
                            Read Paper <span style="margin-left:0.25rem">&rarr;</span>
                        </a>
```

- [ ] **Step 4: Verify all three pages**

Open each of the three pages in a browser. Confirm "Read Paper →" is visible on the TRIBE v2 card/section and clicking it navigates to `research/neuron-activation-analysis.html`.

- [ ] **Step 5: Commit**

```bash
git add index.html projects.html projects/tribe-playground.html
git commit -m "feat: add Read Paper link to TRIBE v2 project card and detail page"
```

---

## Task 5: Tech-Tag Filter System

**Files:**
- Modify: `assets/css/main-theme.css` (add banner styles + tech-tag hover)
- Modify: `index.html` (convert tech-tag spans to anchor links)
- Modify: `projects.html` (convert tech-tag spans to anchor links + add filter banner + filter JS)

### 5a — CSS

- [ ] **Step 1: Add filter banner styles and tech-tag hover to main-theme.css**

At the end of `assets/css/main-theme.css`, append:

```css
/* ── Tech-tag filter banner ─────────────────────────────────────────────── */
.tag-filter-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-5);
  margin-bottom: var(--space-8);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.tag-filter-banner strong {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.tag-filter-banner__clear {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 var(--space-1);
  transition: color var(--transition-fast);
}

.tag-filter-banner__clear:hover {
  color: var(--text-primary);
}

/* ── Tech-tag as link ───────────────────────────────────────────────────── */
a.tech-tag {
  text-decoration: none;
  transition: color var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
}

a.tech-tag:hover {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-tertiary));
  border-color: color-mix(in srgb, var(--accent) 30%, var(--border-primary));
}
```

- [ ] **Step 2: Commit CSS**

```bash
git add assets/css/main-theme.css
git commit -m "feat: add tag-filter-banner styles and tech-tag hover state"
```

### 5b — Convert tech-tags in index.html

All `<span class="tech-tag">X</span>` in `index.html` become `<a href="projects.html?tag=x" class="tech-tag">X</a>` where `x` is lowercase with spaces replaced by hyphens.

- [ ] **Step 3: Convert every tech-tag span in index.html**

The full list of tech-tags in `index.html` and their target slugs:

| Span text | href slug |
|-----------|-----------|
| Python | python |
| PyTorch | pytorch |
| FastAPI | fastapi |
| Docker | docker |
| CUDA | cuda |
| TensorRT | tensorrt |
| Gradio | gradio |
| MLflow | mlflow |
| Optuna | optuna |
| NumPy | numpy |
| SciPy | scipy |
| scikit-learn | scikit-learn |
| MediaPipe | mediapipe |
| Streamlit | streamlit |
| OpenCV | opencv |
| Rust | rust |
| wgpu | wgpu |
| GPU | gpu |
| Nuclear Physics | nuclear-physics |
| Tauri | tauri |
| React | react |
| LLM | llm |
| Education | education |
| Community | community |
| Psychology | psychology |
| Mental Health | mental-health |
| Three.js | three-js |
| LLaMA | llama |
| CLIP | clip |
| LOB | lob |
| OFI | ofi |
| Backtesting | backtesting |
| SOM | som |
| Metal | metal |

For each entry in `index.html`, replace:
```html
<span class="tech-tag">X</span>
```
with:
```html
<a href="projects.html?tag=SLUG" class="tech-tag">X</a>
```

Use Edit tool with replace_all=false for each unique tag. Example for Python:

```html
<!-- Before -->
<span class="tech-tag">Python</span>
<!-- After -->
<a href="projects.html?tag=python" class="tech-tag">Python</a>
```

Note: There are multiple instances of some tags (e.g. `Python` appears in the featured Kolosal card AND in the APT card). Each must be converted individually to ensure correct slugs.

- [ ] **Step 4: Commit index.html tech-tag conversions**

```bash
git add index.html
git commit -m "feat: convert tech-tag spans to filter links in index.html"
```

### 5c — Convert tech-tags in projects.html + add filter UI + JS

- [ ] **Step 5: Convert every tech-tag span in projects.html**

`projects.html` contains the same set of tags. Apply the same conversion as Step 3 (same slug table). All `<span class="tech-tag">X</span>` → `<a href="projects.html?tag=SLUG" class="tech-tag">X</a>`.

- [ ] **Step 6: Add filter banner HTML to projects.html**

In `projects.html`, find the opening of the main projects section. Locate the `<div class="projects-grid"` tag (around line 104). Insert the filter banner immediately before the featured article (before `<article class="project-featured"`):

```html
            <!-- Tag filter banner (shown when ?tag= param is present) -->
            <div id="tagFilterBanner" class="tag-filter-banner" hidden>
                Filtering by: <strong id="tagFilterLabel"></strong>
                <button class="tag-filter-banner__clear" id="tagFilterClear" aria-label="Clear filter">&times;</button>
            </div>
```

- [ ] **Step 7: Add filter JS to projects.html**

At the bottom of `projects.html`, immediately before `</body>`, add:

```html
    <script>
        (function () {
            function slugify(str) {
                return str.toLowerCase().replace(/\s+/g, '-');
            }

            var params = new URLSearchParams(window.location.search);
            var activeTag = params.get('tag');
            if (!activeTag) return;

            var banner = document.getElementById('tagFilterBanner');
            var label = document.getElementById('tagFilterLabel');
            var clearBtn = document.getElementById('tagFilterClear');

            label.textContent = activeTag;
            banner.hidden = false;

            var cards = document.querySelectorAll('.project-card, .project-featured');
            cards.forEach(function (card) {
                var tags = card.querySelectorAll('a.tech-tag');
                var match = false;
                tags.forEach(function (tag) {
                    if (slugify(tag.textContent) === activeTag) match = true;
                });
                if (!match) card.style.display = 'none';
            });

            clearBtn.addEventListener('click', function () {
                window.location.href = 'projects.html';
            });
        })();
    </script>
```

- [ ] **Step 8: Verify filter works end-to-end**

Open `projects.html?tag=rust` in a browser. Expected:
- Filter banner is visible: "Filtering by: **rust** ×"
- Only project cards containing a `rust` tech-tag are shown; others are hidden
- Clicking × reloads to `projects.html` with no filter

Open `projects.html?tag=llama`. Expected:
- Only the TRIBE v2 card (which has LLaMA tag) is visible
- "Read Paper →" link is present on the TRIBE v2 card

Open `projects.html` with no params. Expected:
- Filter banner is not visible
- All project cards are shown

- [ ] **Step 9: Commit**

```bash
git add projects.html
git commit -m "feat: add tech-tag filter system to projects.html"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Paper PDF (Task 1) ✓, Research page (Task 2) ✓, index.html entries (Task 3a) ✓, research.html entry (Task 3b) ✓, TRIBE v2 card links (Task 4) ✓, CSS (Task 5a) ✓, index.html tags (Task 5b) ✓, projects.html tags+filter (Task 5c) ✓
- [x] **No placeholders:** All code blocks are complete and runnable
- [x] **Type consistency:** `slugify()` used in both the anchor hrefs (build-time) and the JS filter (runtime) — both lowercase+hyphen
- [x] **PDF note:** The pagination indicator update (1/3) is handled automatically by existing JS that reads `items.length` — no code change needed
- [x] **Pagination:** With 14 items (0–13) and PER_PAGE=6 → 3 pages. The existing script calculates this dynamically, no hardcoded text to update.
