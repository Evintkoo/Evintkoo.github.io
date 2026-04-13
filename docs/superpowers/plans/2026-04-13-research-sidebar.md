# Research Sidebar Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the icon-heavy glassmorphism sidebar and bottom-sheet FAB on all 8 research pages with a minimal editorial sidebar (frameless, dash + text) and a right-edge pull-tab drawer on mobile.

**Architecture:** CSS-only visual layer in `research.css` (new `.rsb*` classes replace all `.research-sidebar*`), JS behavior in `main-theme.js` (`initResearchFeatures()` rewritten to use new classes and pull-tab logic), HTML in all 8 research pages (sidebar structure replaced in-place inside `<main class="research-layout">`).

**Tech Stack:** Vanilla HTML/CSS/JS, no build step. Dev server: `python3 -m http.server 8080` from site root. Live site: `https://evintkoo.github.io`.

---

## File Structure

| File | Change |
|------|--------|
| `assets/css/research.css` | Delete lines ~482–816 (all `.research-sidebar*` + toggle blocks); add new `.rsb*` CSS |
| `assets/js/main-theme.js` | Rewrite `initResearchFeatures()` (~lines 246–361) — remove old toggle/bottom-sheet logic; add pull-tab and new class names |
| `research/grn-dual-vs-cross-encoder.html` | Replace sidebar container + toggle (lines 85–144) with new `<aside class="rsb">` |
| `research/grn-modular-vs-monolithic.html` | Same replacement |
| `research/grn-two-tower.html` | Same replacement |
| `research/circular-rna.html` | Same replacement |
| `research/functional-group-analysis.html` | Same replacement |
| `research/p53-mutation.html` | Same replacement (custom section order: introduction, abstract→overview, methods, results→key findings, discussion, conclusion, references) |
| `research/global-gdp-patterns.html` | Same replacement (custom sections: abstract, introduction, methodology, clusters, policy, insights, conclusion) |
| `research/crypto-stock-timing.html` | Same replacement (custom sections: introduction, methodology, results, discussion, conclusion, references) |
| `research/bitcoin-portfolio-allocation.html` | Same replacement (10 unique sections) |

---

## Task 1: New CSS — `.rsb*` in `research.css`

**Files:**
- Modify: `assets/css/research.css` (delete lines ~482–816, add new block)

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/evintleovonzko/Documents/research/Evintkoo.github.io
python3 -m http.server 8080
```

Open `http://localhost:8080/research/grn-dual-vs-cross-encoder.html` in the browser. Keep this tab open for verification throughout.

- [ ] **Step 2: Find the exact deletion range**

Open `assets/css/research.css`. Find:
- Start of deletion: the line containing `.research-sidebar-container {` — this is currently around line 482
- End of deletion: the closing `}` of the last `.research-sidebar-toggle` block, just before `/* Smart Recommendation Cards */` comment

Delete everything between those two points (inclusive). The comment `/* Smart Recommendation Cards */` and everything after it must stay.

Also find and delete this block inside the `@media (max-width: 1200px)` section (around line 812–816):
```css
  /* Move scroll-to-top above the sidebar toggle on research pages */
  .research-page .scroll-to-top {
    bottom: calc(var(--space-6) + 60px);
  }
```

- [ ] **Step 3: Add new `.rsb*` CSS**

Paste the following block at the end of `assets/css/research.css`, just before the `/* Smart Recommendation Cards */` comment (or at the very end if that comment is already there):

```css
/* ================================
   Research Sidebar — .rsb
   Desktop: frameless sticky sidebar
   Mobile: right-edge pull-tab drawer
================================ */

/* ── Shared link styles ── */
.rsb__title {
  font-family: var(--font-mono);
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-quaternary);
  margin: 0 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-primary);
  opacity: 0.7;
}

.rsb nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rsb__link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.22rem 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--text-primary);
  text-decoration: none;
  transition: color 0.15s ease, opacity 0.15s ease;
  opacity: 0.28;
}

.rsb__link::before {
  content: '';
  display: block;
  width: 0;
  height: 1px;
  background: transparent;
  flex-shrink: 0;
  transition: width 0.15s ease, background 0.15s ease;
}

/* Visited: short grey dash + slightly less muted */
.rsb__link.visited {
  opacity: 0.5;
}

.rsb__link.visited::before {
  width: 12px;
  background: var(--text-quaternary);
}

/* Active: rose dash + rose text, full opacity */
.rsb__link.active {
  color: var(--accent-warm);
  opacity: 1;
}

.rsb__link.active::before {
  width: 16px;
  background: var(--accent-warm);
}

.rsb__link:hover {
  opacity: 0.75;
}

/* ── Desktop (≥ 1201px): frameless sticky ── */
@media (min-width: 1201px) {
  .rsb {
    flex-shrink: 0;
    width: 200px;
    position: relative;
    align-self: stretch;
    padding-top: calc(var(--nav-height) + var(--space-12));
  }

  .rsb__inner {
    position: sticky;
    top: calc(var(--nav-height) + var(--space-6));
    padding-left: var(--space-4);
  }

  .rsb__tab,
  .rsb__overlay {
    display: none !important;
  }

  /* Shift content to centre it alongside sidebar */
  .research-content {
    padding-right: var(--space-10);
  }
}

/* ── Mobile (≤ 1200px): right-edge pull-tab drawer ── */
@media (max-width: 1200px) {
  .rsb {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
    width: 220px;
    /* translateX(200px) → only 20px tab visible */
    transform: translateX(200px);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  .rsb.open {
    transform: translateX(0);
    pointer-events: auto;
  }

  /* Inner drawer panel */
  .rsb__inner {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 200px;
    background: var(--bg-primary);
    border-left: 1px solid var(--border-primary);
    padding: calc(var(--nav-height) + var(--space-8)) var(--space-5) var(--space-8);
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .rsb__inner::-webkit-scrollbar {
    display: none;
  }

  /* Pull tab — always visible at right edge */
  .rsb__tab {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 52px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-right: none;
    border-radius: var(--radius-md) 0 0 var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--accent-warm);
    pointer-events: auto;
    padding: 0;
    transition: background 0.15s ease;
  }

  .rsb__tab:hover {
    background: var(--bg-tertiary);
  }

  .rsb__tab svg {
    width: 12px;
    height: 12px;
    display: block;
    transition: transform 0.2s ease;
  }

  /* Flip chevron when open */
  .rsb.open .rsb__tab svg {
    transform: scaleX(-1);
  }

  /* Transparent overlay to catch outside taps */
  .rsb__overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 199;
    background: rgba(0, 0, 0, 0.3);
  }

  .rsb__overlay.visible {
    display: block;
  }
}
```

- [ ] **Step 4: Verify CSS loads without errors**

Reload `http://localhost:8080/research/grn-dual-vs-cross-encoder.html`. Open DevTools → Console. There must be zero CSS errors. The existing sidebar HTML (`.research-sidebar-container`) is still there, so the sidebar may look broken — that's fine, JS and HTML come next.

- [ ] **Step 5: Commit**

```bash
git add assets/css/research.css
git commit -m "style: replace research sidebar CSS with minimal .rsb editorial design"
```

---

## Task 2: JS — Rewrite `initResearchFeatures()` in `main-theme.js`

**Files:**
- Modify: `assets/js/main-theme.js` (lines ~246–361, the `initResearchFeatures` function body)

- [ ] **Step 1: Locate the function**

Open `assets/js/main-theme.js`. Find `function initResearchFeatures()` (around line 246). The function ends with the closing `}` before `// Scroll to Top Button` (around line 362). Replace everything **inside** the function body (from the first line after the opening `{` to just before the closing `}`) with the code below. Do NOT change the function signature or the call site.

- [ ] **Step 2: Replace the function body**

The new body of `initResearchFeatures()`:

```javascript
    const rsb = document.getElementById('rsb');
    const sections = document.querySelectorAll('.research-section');

    // Only run on research pages
    if (!rsb && sections.length === 0) return;

    // ── Pull-tab drawer (mobile) ──
    const rsbTab = document.getElementById('rsbTab');
    const rsbOverlay = document.getElementById('rsbOverlay');

    function openDrawer() {
      if (rsb) rsb.classList.add('open');
      if (rsbOverlay) rsbOverlay.classList.add('visible');
    }

    function closeDrawer() {
      if (rsb) rsb.classList.remove('open');
      if (rsbOverlay) rsbOverlay.classList.remove('visible');
    }

    if (rsbTab) {
      rsbTab.addEventListener('click', () => {
        rsb.classList.contains('open') ? closeDrawer() : openDrawer();
      });
    }

    if (rsbOverlay) {
      rsbOverlay.addEventListener('click', closeDrawer);
    }

    // Close drawer when tapping a section link (mobile only)
    const rsbLinks = rsb ? Array.from(rsb.querySelectorAll('.rsb__link')) : [];
    rsbLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1200) closeDrawer();
      });
    });

    // ── Reading Progress Bar ──
    let progressBar = document.querySelector('.reading-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'reading-progress';
      document.body.appendChild(progressBar);
    }

    const updateProgress = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (documentHeight <= 0) return;
      const progress = (window.pageYOffset / documentHeight) * 100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    };

    _scrollCbs.push(updateProgress);
    updateProgress();

    // ── Section tracking (active / visited) ──
    const visitedSections = new Set();
    const sectionIds = Array.from(sections).map(s => s.id).filter(Boolean);

    if ('IntersectionObserver' in window && sections.length > 0 && rsbLinks.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const activeId = entry.target.id;
          if (!activeId) return;

          visitedSections.add(activeId);
          // Mark all sections above the active one as visited
          const activeIdx = sectionIds.indexOf(activeId);
          sectionIds.forEach((id, i) => {
            if (i < activeIdx) visitedSections.add(id);
          });

          rsbLinks.forEach(link => {
            const linkId = (link.getAttribute('href') || '').replace('#', '');
            const isActive = linkId === activeId;
            link.classList.toggle('active', isActive);
            link.classList.toggle('visited', !isActive && visitedSections.has(linkId));
          });
        });
      }, {
        threshold: 0.2,
        rootMargin: '-20% 0px -50% 0px',
      });

      sections.forEach(s => { if (s.id) observer.observe(s); });
    }
```

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8080/research/grn-dual-vs-cross-encoder.html` (sidebar HTML is still old at this point). Open DevTools Console — zero errors expected. The old sidebar will still show.

- [ ] **Step 4: Commit**

```bash
git add assets/js/main-theme.js
git commit -m "feat: rewrite initResearchFeatures with pull-tab drawer and .rsb class tracking"
```

---

## Task 3: HTML — Update 5 Standard Pages

These 5 pages all have the same 6 sections: abstract, introduction, methods, results, discussion, conclusion.

**Files:**
- Modify: `research/grn-dual-vs-cross-encoder.html`
- Modify: `research/grn-modular-vs-monolithic.html`
- Modify: `research/grn-two-tower.html`
- Modify: `research/circular-rna.html`
- Modify: `research/functional-group-analysis.html`

**In each file, replace this block** (the `<div class="research-sidebar-container">...</div>` and the `<button class="research-sidebar-toggle"...></button>`, lines 85–144 in grn-dual; similar range in others):

Find this pattern (varies slightly per file but always starts/ends the same way):
```html
        <div class="research-sidebar-container">
            <aside class="research-sidebar" id="floating-sidebar">
                ...
            </aside>
        </div>
        <button class="research-sidebar-toggle" id="research-sidebar-toggle" aria-label="Toggle research navigation">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>
```

Replace with:
```html
        <aside class="rsb" id="rsb">
            <div class="rsb__inner">
                <p class="rsb__title">Research Sections</p>
                <nav>
                    <a href="#abstract"     class="rsb__link active">Abstract</a>
                    <a href="#introduction" class="rsb__link">Introduction</a>
                    <a href="#methods"      class="rsb__link">Methods</a>
                    <a href="#results"      class="rsb__link">Results</a>
                    <a href="#discussion"   class="rsb__link">Discussion</a>
                    <a href="#conclusion"   class="rsb__link">Conclusion</a>
                </nav>
            </div>
            <button class="rsb__tab" id="rsbTab" aria-label="Toggle navigation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <polyline class="rsb__chevron" points="15 18 9 12 15 6"/>
                </svg>
            </button>
        </aside>
        <div class="rsb__overlay" id="rsbOverlay"></div>
```

- [ ] **Step 1: Update `grn-dual-vs-cross-encoder.html`** — find and replace as described above

- [ ] **Step 2: Update `grn-modular-vs-monolithic.html`** — same replacement

- [ ] **Step 3: Update `grn-two-tower.html`** — same replacement

- [ ] **Step 4: Update `circular-rna.html`** — same replacement

- [ ] **Step 5: Update `functional-group-analysis.html`** — same replacement

- [ ] **Step 6: Verify in browser**

Open each of these 5 URLs in turn:
- `http://localhost:8080/research/grn-dual-vs-cross-encoder.html`
- `http://localhost:8080/research/grn-modular-vs-monolithic.html`
- `http://localhost:8080/research/grn-two-tower.html`
- `http://localhost:8080/research/circular-rna.html`
- `http://localhost:8080/research/functional-group-analysis.html`

For each, check:
1. Desktop (> 1201px): frameless sidebar visible on the left, no icons, rose dash on "Abstract"
2. Mobile (resize to < 1200px via DevTools): only the tab chevron visible at the right edge; tapping it slides the drawer in; tapping overlay or a link closes it
3. Scrolling: active section updates correctly (rose dash tracks reading position)
4. DevTools Console: zero errors

- [ ] **Step 7: Commit**

```bash
git add research/grn-dual-vs-cross-encoder.html \
        research/grn-modular-vs-monolithic.html \
        research/grn-two-tower.html \
        research/circular-rna.html \
        research/functional-group-analysis.html
git commit -m "feat: replace sidebar HTML with .rsb pull-tab on 5 standard research pages"
```

---

## Task 4: HTML — Update 3 Pages with Custom Sections

**Files:**
- Modify: `research/p53-mutation.html`
- Modify: `research/global-gdp-patterns.html`
- Modify: `research/crypto-stock-timing.html`

Apply the same structural replacement as Task 3, but use the section links specific to each page:

### `p53-mutation.html`

```html
        <aside class="rsb" id="rsb">
            <div class="rsb__inner">
                <p class="rsb__title">Research Sections</p>
                <nav>
                    <a href="#introduction" class="rsb__link active">Introduction</a>
                    <a href="#abstract"     class="rsb__link">Overview</a>
                    <a href="#methods"      class="rsb__link">Methods</a>
                    <a href="#results"      class="rsb__link">Key Findings</a>
                    <a href="#discussion"   class="rsb__link">Discussion</a>
                    <a href="#conclusion"   class="rsb__link">Conclusion</a>
                    <a href="#references"   class="rsb__link">References</a>
                </nav>
            </div>
            <button class="rsb__tab" id="rsbTab" aria-label="Toggle navigation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <polyline class="rsb__chevron" points="15 18 9 12 15 6"/>
                </svg>
            </button>
        </aside>
        <div class="rsb__overlay" id="rsbOverlay"></div>
```

Note: first link gets `class="rsb__link active"` (the first visible section on load).

### `global-gdp-patterns.html`

```html
        <aside class="rsb" id="rsb">
            <div class="rsb__inner">
                <p class="rsb__title">Research Sections</p>
                <nav>
                    <a href="#abstract"      class="rsb__link active">Abstract</a>
                    <a href="#introduction"  class="rsb__link">Introduction</a>
                    <a href="#methodology"   class="rsb__link">Methodology</a>
                    <a href="#clusters"      class="rsb__link">The Four Clusters</a>
                    <a href="#policy"        class="rsb__link">Policy Implications</a>
                    <a href="#insights"      class="rsb__link">Insights</a>
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
```

### `crypto-stock-timing.html`

```html
        <aside class="rsb" id="rsb">
            <div class="rsb__inner">
                <p class="rsb__title">Research Sections</p>
                <nav>
                    <a href="#introduction"  class="rsb__link active">Introduction</a>
                    <a href="#methodology"   class="rsb__link">Methodology</a>
                    <a href="#results"       class="rsb__link">Results</a>
                    <a href="#discussion"    class="rsb__link">Discussion</a>
                    <a href="#conclusion"    class="rsb__link">Conclusion</a>
                    <a href="#references"    class="rsb__link">References</a>
                </nav>
            </div>
            <button class="rsb__tab" id="rsbTab" aria-label="Toggle navigation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <polyline class="rsb__chevron" points="15 18 9 12 15 6"/>
                </svg>
            </button>
        </aside>
        <div class="rsb__overlay" id="rsbOverlay"></div>
```

- [ ] **Step 1: Update `p53-mutation.html`** — replace old sidebar block with the p53 version above

- [ ] **Step 2: Update `global-gdp-patterns.html`** — replace with gdp version above

- [ ] **Step 3: Update `crypto-stock-timing.html`** — replace with crypto version above

- [ ] **Step 4: Verify in browser**

Open each in the browser and confirm:
- Sidebar links match the actual section IDs in the page (scroll to each section, confirm the active dash moves there)
- Pull-tab works on mobile width
- DevTools Console: zero errors

- [ ] **Step 5: Commit**

```bash
git add research/p53-mutation.html \
        research/global-gdp-patterns.html \
        research/crypto-stock-timing.html
git commit -m "feat: replace sidebar HTML on p53, gdp, and crypto pages"
```

---

## Task 5: HTML — Update Bitcoin Page (10 Sections)

**Files:**
- Modify: `research/bitcoin-portfolio-allocation.html`

Same structural replacement. The bitcoin page has 10 unique sections:

```html
        <aside class="rsb" id="rsb">
            <div class="rsb__inner">
                <p class="rsb__title">Research Sections</p>
                <nav>
                    <a href="#executive-summary"   class="rsb__link active">Executive Summary</a>
                    <a href="#risk-budget"         class="rsb__link">Risk-Budget Principle</a>
                    <a href="#evidence"            class="rsb__link">Evidence Across Profiles</a>
                    <a href="#equal-weight"        class="rsb__link">Equal-Weight Failure</a>
                    <a href="#stress-analysis"     class="rsb__link">Stress Analysis</a>
                    <a href="#monte-carlo"         class="rsb__link">Monte Carlo</a>
                    <a href="#regime-analysis"     class="rsb__link">Regime Analysis</a>
                    <a href="#decision-framework"  class="rsb__link">Decision Framework</a>
                    <a href="#correlation-risk"    class="rsb__link">Correlation Risk</a>
                    <a href="#behavioral"          class="rsb__link">Behavioral Considerations</a>
                </nav>
            </div>
            <button class="rsb__tab" id="rsbTab" aria-label="Toggle navigation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <polyline class="rsb__chevron" points="15 18 9 12 15 6"/>
                </svg>
            </button>
        </aside>
        <div class="rsb__overlay" id="rsbOverlay"></div>
```

- [ ] **Step 1: Update `bitcoin-portfolio-allocation.html`** — replace old sidebar block with the above

- [ ] **Step 2: Verify in browser**

Open `http://localhost:8080/research/bitcoin-portfolio-allocation.html`:
- Desktop: all 10 links visible in frameless sidebar; scroll down, confirm rose dash moves through each section
- Mobile: pull tab visible at right edge; drawer contains all 10 links; closes on link click

- [ ] **Step 3: Commit**

```bash
git add research/bitcoin-portfolio-allocation.html
git commit -m "feat: replace sidebar HTML on bitcoin portfolio page (10 sections)"
```

---

## Task 6: Deploy

- [ ] **Step 1: Final cross-page check**

Open all 8 pages in the browser and do a quick pass:
- Desktop sidebar visible and frameless on each
- Mobile pull-tab visible and functional on each
- No broken layout (research content still takes full width minus sidebar)
- Reading progress bar still works (rose bar across top)

- [ ] **Step 2: Deploy via git subtree push**

```bash
git subtree split --prefix=Documents/research/Evintkoo.github.io -b portfolio-deploy
git push origin portfolio-deploy:main --force
git branch -D portfolio-deploy
```

- [ ] **Step 3: Verify on live site**

Open `https://evintkoo.github.io/research/grn-dual-vs-cross-encoder.html`. Confirm:
- Desktop: frameless sidebar with rose active dash
- No console errors (F12 → Console)
- Scroll tracking works (active link updates as you read)
