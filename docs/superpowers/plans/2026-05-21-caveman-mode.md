# Caveman Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a sitewide toggle on all 14 research pages that swaps formal prose to hand-authored caveman/brainrot text, persists via localStorage, with no layout shift and no flash of formal content.

**Architecture:** Paired DOM siblings (`<p class="prose">` formal + `<p class="prose prose--caveman">` caveman). CSS rules under `html.caveman` flip visibility. An inline pre-paint `<script>` in each page's `<head>` reads localStorage and applies the class before paint. A nav button next to the theme toggle toggles state. Hand-authored translations populate all 14 pages in one PR.

**Tech Stack:** Vanilla HTML/CSS/JS. No build step. No tests framework — verification is manual in a browser plus targeted `grep` checks. Static site, served from `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io`.

**Spec:** `docs/superpowers/specs/2026-05-21-caveman-mode-design.md`

---

## File Structure

**Modified (3 shared assets):**
- `assets/css/research.css` — add 3 visibility rules for `.prose` / `.prose--caveman`.
- `assets/css/main-theme.css` — add `.caveman-toggle` button styles next to existing `.theme-toggle`.
- `assets/js/main-theme.js` — add toggle wiring inside the existing main IIFE (after the theme-toggle wiring).

**Modified (14 research pages, identical structural edits):**
- `research/bitcoin-portfolio-allocation.html`
- `research/circular-rna.html`
- `research/crypto-stock-timing.html`
- `research/functional-group-analysis.html`
- `research/global-gdp-patterns.html`
- `research/grasp.html`
- `research/grn-dual-vs-cross-encoder.html`
- `research/grn-modular-vs-monolithic.html`
- `research/grn-two-tower.html`
- `research/keynesian-abm-coordination.html`
- `research/keynesian-abm-fiscal.html`
- `research/neuron-activation-analysis.html`
- `research/p53-mutation.html`
- `research/som-tsk.html`

Each page gets, in this order:
1. Inline pre-paint `<script>` near the top of `<head>` (before stylesheet `<link>`s).
2. `#cavemanToggle` `<button>` inside `.nav__actions`, immediately before `#themeToggle`.
3. `class="prose"` added to every qualifying prose element (see "Translation targets" below).
4. A `.prose--caveman` sibling added immediately after each, containing the caveman version.

**Translation targets per page** (mechanical rule):
- `<p>` inside `.research-section .content-text` (any nesting depth).
- `<li>` inside `.content-text > ul` and `> ol`.
- `<p>` inside `.research-highlight .highlight-content`.
- `<p>` inside `.hypothesis-box` (paragraph-level content; not the `<h4>` heading).
- `<p>` inside `.method-card .method-content`.
- `.hero__subtitle` (one per page).

**NOT translated** (leave alone):
- All headings (`<h1>`, `<h2>`, `<h3>`, `<h4>`) — including `.research-section__title`, `.hero__title`, `.results-table h4`, `.hypothesis-box h4`, `.method-card h3`.
- Table cells (`<th>`, `<td>`).
- Math formula paragraphs containing `<sub>` or `<sup>` for variables (e.g., `CRC<sub>i</sub> = ...`).
- Right-side research sidebar (`.rsb`) and its links.
- Paper meta box (`.paper-meta-box`).
- Mindmap section (`.mindmap-section`) and rendered nodes.
- `.method-number` blocks.

---

## Task 1: Add CSS rules for prose visibility toggle

**Files:**
- Modify: `assets/css/research.css` (append to end of file)

- [ ] **Step 1: Read existing research.css end-of-file**

Run: `wc -l /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/assets/css/research.css`

Note the line count to confirm we append cleanly.

- [ ] **Step 2: Append the three rules**

Append to `assets/css/research.css`:

```css

/* ============================================
   Caveman Mode — prose visibility toggle
   See docs/superpowers/specs/2026-05-21-caveman-mode-design.md
   ============================================ */
.prose--caveman { display: none; }
html.caveman .prose:not(.prose--caveman) { display: none; }
html.caveman .prose--caveman { display: revert; }
```

- [ ] **Step 3: Bump research.css cache-busting version in one research page to confirm load path**

This is a check, not a write. Verify the existing pages reference `research.css?v=13` (or current version) — we'll bump the version to `?v=14` in Task 4 when we touch all pages. No edit yet.

Run: `grep -h "research.css?v=" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/bitcoin-portfolio-allocation.html`

Expected: a single line containing `research.css?v=13` (the current version per the spec exploration). If the version is different, note the actual value — Task 4 will bump from it.

- [ ] **Step 4: Commit**

```bash
git add assets/css/research.css
git commit -m "feat(caveman): add prose visibility CSS rules"
```

---

## Task 2: Add `.caveman-toggle` button styles

**Files:**
- Modify: `assets/css/main-theme.css` (insert after the existing `.theme-toggle` block at line 568)

- [ ] **Step 1: Read the current `.theme-toggle` block to copy sizing**

Read `assets/css/main-theme.css` lines 565-590 to capture the exact width, height, padding, border-radius, transition, and hover behavior used by `.theme-toggle`. We will mirror these values so the two buttons look identical in the nav.

- [ ] **Step 2: Insert the `.caveman-toggle` block immediately after the `.theme-toggle` block**

Place these rules right after the closing `}` of the last `.theme-toggle` related rule (the spec notes this region starts at line 568; the exact insertion point is "immediately after the final `.theme-toggle*` selector before the next unrelated section"). Use the actual `.theme-toggle` values for width/height/padding/border-radius copied in Step 1 — do not invent new sizes.

Template (substitute the exact theme-toggle values where noted):

```css
/* ============================================
   Caveman Mode — nav toggle button
   ============================================ */
.caveman-toggle {
  /* match .theme-toggle: copy width, height, padding, border-radius, background, border, color, transition */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: inherit;
  padding: 8px; /* REPLACE with the value used in .theme-toggle */
  border-radius: 8px; /* REPLACE with the value used in .theme-toggle */
  transition: background-color 0.2s ease, color 0.2s ease;
}
.caveman-toggle:hover {
  background: rgba(0, 0, 0, 0.06);
}
html.light .caveman-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
}
.caveman-toggle .caveman-icon {
  width: 20px; /* REPLACE if .theme-toggle uses a different icon size */
  height: 20px;
  transition: transform 0.2s ease;
}
.caveman-toggle:hover .caveman-icon {
  transform: rotate(-8deg);
}
.caveman-toggle.is-active .caveman-icon {
  fill: currentColor;
}
```

If `.theme-toggle` uses different hover background values or different icon sizing, copy those exact values into the `.caveman-toggle` rules above so the two buttons match visually.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat(caveman): add nav toggle button styles"
```

---

## Task 3: Add toggle JS wiring to `main-theme.js`

**Files:**
- Modify: `assets/js/main-theme.js` (inside the existing main IIFE, after the `themeToggle` wiring block)

- [ ] **Step 1: Locate the existing `themeToggle` wiring block**

Run: `grep -n "themeToggle" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/assets/js/main-theme.js`

Identify the line range that wires the theme toggle's click handler. We will insert the caveman wiring immediately after that block (still inside the same main IIFE, so `const cavemanToggle` lives in the same closure as `themeToggle`).

- [ ] **Step 2: Insert the caveman wiring**

Insert this block immediately after the existing themeToggle block (preserve surrounding indentation):

```js
  // ============================================
  // Caveman Mode toggle
  // ============================================
  const cavemanToggle = document.getElementById('cavemanToggle');
  if (cavemanToggle) {
    const syncCaveman = () => {
      const on = document.documentElement.classList.contains('caveman');
      cavemanToggle.classList.toggle('is-active', on);
      cavemanToggle.setAttribute('aria-pressed', String(on));
    };
    syncCaveman();
    cavemanToggle.addEventListener('click', () => {
      const on = document.documentElement.classList.toggle('caveman');
      try { localStorage.setItem('caveman', on ? '1' : '0'); } catch (e) { /* ignore quota / privacy errors */ }
      syncCaveman();
    });
  }
```

The `try/catch` around `localStorage.setItem` is defensive — Safari private mode can throw `QuotaExceededError`. This matches typical web platform hygiene.

- [ ] **Step 3: Sanity-check no syntax errors**

Run: `node --check /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/assets/js/main-theme.js`

Expected: no output, exit code 0. If `node` is not available, open the file in the browser via any page and check DevTools console for a SyntaxError on load (cover this in Task 5).

- [ ] **Step 4: Commit**

```bash
git add assets/js/main-theme.js
git commit -m "feat(caveman): wire toggle button in main-theme.js"
```

---

## Task 4: Add pre-paint script and toggle button to all 14 research pages

This task is mechanical and touches every research page identically. Do all 14 in one task, one commit at the end, so the infrastructure lands atomically.

**Files (all 14):**
- `research/bitcoin-portfolio-allocation.html`
- `research/circular-rna.html`
- `research/crypto-stock-timing.html`
- `research/functional-group-analysis.html`
- `research/global-gdp-patterns.html`
- `research/grasp.html`
- `research/grn-dual-vs-cross-encoder.html`
- `research/grn-modular-vs-monolithic.html`
- `research/grn-two-tower.html`
- `research/keynesian-abm-coordination.html`
- `research/keynesian-abm-fiscal.html`
- `research/neuron-activation-analysis.html`
- `research/p53-mutation.html`
- `research/som-tsk.html`

- [ ] **Step 1: For each page, add the inline pre-paint `<script>` near the top of `<head>`**

Locate the line `<meta name="viewport" ...>` in each file. Insert this block on the line immediately after `<meta name="viewport" ...>` (before the `<title>` and before any `<link>` to a stylesheet):

```html

    <!-- Caveman Mode pre-paint: apply <html class="caveman"> before stylesheet matches to prevent flash -->
    <script>
      (function () {
        try {
          if (localStorage.getItem('caveman') === '1') {
            document.documentElement.classList.add('caveman');
          }
        } catch (e) { /* ignore */ }
      })();
    </script>
```

This script runs synchronously during head parsing. It executes before the `<link rel="stylesheet">` tags below it, but that is fine — what matters is that it runs before the body is parsed and before the first paint. The `try/catch` shields against Safari private-mode `localStorage` access throws.

- [ ] **Step 2: For each page, add the `#cavemanToggle` button inside `.nav__actions` immediately before `#themeToggle`**

Locate the line `<div class="nav__actions">` in each file. The next non-whitespace child should currently be `<button class="theme-toggle" id="themeToggle" ...>`. Insert the caveman toggle button immediately before that line:

```html
                <button class="caveman-toggle" id="cavemanToggle" aria-label="Toggle caveman mode" aria-pressed="false" title="Caveman mode">
                    <svg class="caveman-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M4 20l6-6"/>
                        <path d="M14 4c3 0 6 3 6 6s-3 6-6 6-6-3-6-6 3-6 6-6z"/>
                        <path d="M11 7l2 2"/>
                    </svg>
                </button>
```

Indentation should match the existing `<button class="theme-toggle" ...>` line in that file (the indentation may vary slightly between pages; copy the indentation of the existing theme-toggle line).

- [ ] **Step 3: Verify every page got both edits**

Run these two greps:

```bash
grep -L "id=\"cavemanToggle\"" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/*.html
grep -L "localStorage.getItem('caveman')" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/*.html
```

Expected: both commands print nothing (every page has both edits). If any page is listed, that page is missing the edit — add it and re-run.

- [ ] **Step 4: Open one page in browser and verify the toggle appears and works**

Run: `open /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/bitcoin-portfolio-allocation.html`

In the browser:
1. Confirm a new club icon appears in the nav, immediately to the left of the theme toggle.
2. Click it. The icon should fill in (active state). Nothing else changes yet because no prose has the `prose--caveman` siblings.
3. Reload the page. The icon should still appear filled (state persisted).
4. Open DevTools console; confirm no JS errors.
5. Click again to turn off. Confirm `localStorage` no longer has `caveman` set to `'1'` (run `localStorage.getItem('caveman')` in console — should return `"0"` or `null`).

- [ ] **Step 5: Commit**

```bash
git add research/*.html
git commit -m "feat(caveman): add nav toggle and pre-paint script to research pages"
```

---

## Task 5–18: Author caveman translations for each research page

Each task below follows the same shape: read the page, identify qualifying prose elements, add `class="prose"` to each, add a `.prose--caveman` sibling immediately after with the caveman rewrite. Then verify in browser.

**Voice guide (apply consistently within each page):**
- Short sentences. Present tense. Active voice.
- Drop articles often ("rock pile shake" not "the rock pile shakes").
- Domain swaps (use the page-specific ones below + general):
  - "portfolio" → "rock pile"
  - "model" / "framework" / "system" → "thinky-rock" / "big think" / "big plan"
  - "optimal" → "best"
  - "increase" / "rise" → "go big" / "go up"
  - "decrease" / "fall" → "go small" / "go down"
  - "volatility" → "shake"
  - "return" / "profit" → "shiny coin"
  - "loss" / "drawdown" → "ouch" / "big ouch"
  - "evidence" → "Ugg see with eye"
  - "hypothesis" → "Ugg think maybe"
  - "analysis" / "study" → "look hard"
- Brainrot accents (max one per paragraph, often zero): "stonk", "no cap", "fr fr", "rizz", "ohio", "lowkey", "lit".
- Preserve numbers, percentages, tickers (BTC, SPY, BND), units, dates.
- Preserve inline `<strong>`, `<em>`, `<sub>`, `<sup>`, `<a>`. Bold the same key terms as the formal version.
- Same factual claims as the formal text. Caveman mode is a register shift, never a content change.

**Per-page mechanical procedure:**

1. Read the entire HTML file.
2. For every `<p>` inside `.research-section .content-text` (including nested inside `.research-highlight .highlight-content`, `.hypothesis-box`, `.method-card .method-content`): add `class="prose"` (or merge into existing class), then insert a sibling `<p class="prose prose--caveman">…</p>` immediately after.
3. For every `<li>` inside `.content-text > ul` and `> ol`: add `class="prose"`, then insert a sibling `<li class="prose prose--caveman">…</li>` immediately after.
4. For `.hero__subtitle`: add `class="prose hero__subtitle"` (keep both classes), then insert a sibling `<p class="prose prose--caveman hero__subtitle">…</p>` immediately after.
5. Do NOT translate any element matching the "NOT translated" list at the top of this plan.
6. Run grep checks (per-task Step 2) to confirm coverage.
7. Open the page in a browser, toggle caveman, eyeball every section, verify no broken markup, no untranslated prose visible in caveman mode, no garbled formulas. Toggle back, verify the formal version is unchanged.

---

### Task 5: Translate `bitcoin-portfolio-allocation.html`

**Page-specific term swaps:**
- "Bitcoin" / "BTC" → keep "BTC" (ticker preserved); "Bitcoin" in prose can become "BTC" or "big stonk BTC"
- "Sharpe ratio" → "shiny-coin-per-shake number"
- "Risk Parity" → keep capitalized as proper noun; can append "(everyone share danger same)"
- "Risk Budget" → "danger pile"
- "Component Risk Contribution (CRC)" → keep acronym; "how much each rock add to shake"
- "Stress test" → "Ugg poke rock pile hard, see what break"
- "Monte Carlo" → keep; can append "(throw bones many times)"
- "Regime" → "weather"
- "Drawdown" → "big ouch from top"
- "Allocation" → "how much rock"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/bitcoin-portfolio-allocation.html` fully (1214 lines — use multiple `Read` calls if needed; first 500 lines, then 500-1000, then 1000-1214).

- [ ] **Step 2: Edit prose elements**

For each qualifying element (per the page-wide procedure above), add `class="prose"` and a `.prose--caveman` sibling. Sections to cover in order: `.hero__subtitle`, `#executive-summary`, `#risk-budget`, `#evidence`, `#equal-weight`, `#stress-analysis`, `#monte-carlo`, `#regime-analysis`, `#decision-framework`, `#correlation-risk`, `#behavioral`.

Example translation (for the first hero subtitle):

Formal: `Optimal BTC sizing via Risk-Budget Framework — Component Risk Contribution analysis across five portfolio profiles. The answer is always between 0% and 16%.`

Caveman: `Best BTC chunk for rock pile, by danger-pile plan — look hard at how much each rock shake. Five rock piles tested. Answer always between 0% and 16%. No cap.`

Example translation (executive summary first `<p>` inside `.research-highlight`):

Formal: `<strong>The optimal Bitcoin allocation is 10–12% by capital weight, producing 17–20% risk contribution.</strong> This range maximizes diversification benefit while keeping tail risk manageable.`

Caveman: `<strong>Best BTC chunk is 10–12% of rock pile, which make 17–20% of all shake.</strong> Sweet spot. Spread risk wide, tail no bite too hard.`

Apply the same approach to all qualifying elements in the file.

- [ ] **Step 3: Verify coverage**

```bash
# Every prose-bearing element inside content-text should now have class="prose"
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/bitcoin-portfolio-allocation.html
```

Compare to a manual count of qualifying elements from Step 1. They should be roughly equal (off by 0).

- [ ] **Step 4: Browser-test**

Open the page, toggle caveman on. Walk through every section. No formal prose should remain visible in `.content-text` paragraphs/lists/highlights/hypothesis-boxes/method-card content. Tables, headings, formulas, sidebar, and paper meta should be unchanged. Toggle off, confirm formal version unchanged.

- [ ] **Step 5: Commit**

```bash
git add research/bitcoin-portfolio-allocation.html
git commit -m "feat(caveman): translate bitcoin-portfolio-allocation prose"
```

---

### Task 6: Translate `circular-rna.html`

**Page-specific term swaps:**
- "circular RNA" / "circRNA" → "loop tiny scroll" / "circRNA" (keep acronym)
- "linear RNA" / "mRNA" → "straight tiny scroll" / "mRNA"
- "back-splicing" → "snake-eat-own-tail join"
- "exon" → "scroll piece"
- "intron" → "trash piece between"
- "biogenesis" → "how it born"
- "microRNA sponge" → "tiny-scroll soaker"
- "expression" / "expressed" → "Ugg make" / "made"
- "tumor" / "cancer" → "bad lump" / "sick"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/circular-rna.html` fully (714 lines).

- [ ] **Step 2: Edit prose elements**

Apply the page-wide mechanical procedure. Cover every `.research-section`.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/circular-rna.html
```

- [ ] **Step 4: Browser-test**

Open the page, toggle caveman, walk every section, verify.

- [ ] **Step 5: Commit**

```bash
git add research/circular-rna.html
git commit -m "feat(caveman): translate circular-rna prose"
```

---

### Task 7: Translate `crypto-stock-timing.html`

**Page-specific term swaps:**
- "crypto" → "magic internet rock" or "crypto" (keep brief in flowing prose)
- "stock" / "equity" → "company rock"
- "timing" / "market timing" → "knowing when to grab"
- "correlation" → "how things move same"
- "lag" / "lead" → "behind" / "ahead"
- "regime" → "weather"
- "signal" → "Ugg sign"
- "backtest" → "look at old days, see if work"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/crypto-stock-timing.html` fully (730 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/crypto-stock-timing.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/crypto-stock-timing.html
git commit -m "feat(caveman): translate crypto-stock-timing prose"
```

---

### Task 8: Translate `functional-group-analysis.html`

**Page-specific term swaps:**
- "functional group" → "doer-bit"
- "molecule" / "compound" → "tiny thing" / "mixed tiny thing"
- "bond" → "hand-hold"
- "reactivity" → "how spicy" / "how mad"
- "polarity" → "which-side-pull"
- "carbonyl" / "hydroxyl" / "amine" → keep chemical names; can append "(the doer-bit with two oxygen)" etc. as gloss in selected spots

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/functional-group-analysis.html` fully (1040 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/functional-group-analysis.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/functional-group-analysis.html
git commit -m "feat(caveman): translate functional-group-analysis prose"
```

---

### Task 9: Translate `global-gdp-patterns.html`

**Page-specific term swaps:**
- "GDP" → keep "GDP"; gloss as "big stonk number of all stuff country make"
- "growth rate" → "how fast country swole"
- "developed" / "developing" / "emerging" economy → "old strong country" / "growing country" / "baby country"
- "trade" → "swap stuff between tribes"
- "inflation" → "shiny coin lose power"
- "monetary policy" → "rock-keeper tribe rule"
- "fiscal policy" → "chief spending rule"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/global-gdp-patterns.html` fully (625 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/global-gdp-patterns.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/global-gdp-patterns.html
git commit -m "feat(caveman): translate global-gdp-patterns prose"
```

---

### Task 10: Translate `grasp.html`

**Page-specific term swaps:**
- "GRASP" → keep the acronym
- "manipulation" / "grasp" (the action) → "grab with hand"
- "policy" (RL) → "Ugg rule for what do"
- "reward" → "treat"
- "agent" → "Ugg-bot"
- "training" → "many tries to learn"
- "demonstration" → "show how"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grasp.html` fully (588 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grasp.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/grasp.html
git commit -m "feat(caveman): translate grasp prose"
```

---

### Task 11: Translate `grn-dual-vs-cross-encoder.html`

**Page-specific term swaps:**
- "encoder" → "squisher" / "Ugg-think-squisher"
- "dual encoder" → "two-squisher (work alone)"
- "cross encoder" → "smush-together squisher"
- "embedding" → "thought-blob"
- "retrieval" → "fetch from pile"
- "ranking" → "put best first"
- "latency" → "wait time"
- "inference" → "Ugg-bot think"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grn-dual-vs-cross-encoder.html` fully (538 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grn-dual-vs-cross-encoder.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/grn-dual-vs-cross-encoder.html
git commit -m "feat(caveman): translate grn-dual-vs-cross-encoder prose"
```

---

### Task 12: Translate `grn-modular-vs-monolithic.html`

**Page-specific term swaps:**
- "modular" → "many small thinky-rock work together"
- "monolithic" → "one big thinky-rock"
- "router" → "path-picker"
- "specialist" / "expert" → "Ugg who only know one thing"
- "generalist" → "Ugg who know many thing little"
- "fine-tune" → "tweak small"
- "scale" → "make bigger" / "bigger stonk"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grn-modular-vs-monolithic.html` fully (512 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grn-modular-vs-monolithic.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/grn-modular-vs-monolithic.html
git commit -m "feat(caveman): translate grn-modular-vs-monolithic prose"
```

---

### Task 13: Translate `grn-two-tower.html`

**Page-specific term swaps:**
- "two-tower" → "two-tall-rock (one for question, one for answer)"
- "query" → "what Ugg ask"
- "document" → "scroll" / "answer-scroll"
- "similarity" → "how close"
- "negative" / "hard negative" → "wrong answer" / "tricky wrong answer"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grn-two-tower.html` fully (548 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/grn-two-tower.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/grn-two-tower.html
git commit -m "feat(caveman): translate grn-two-tower prose"
```

---

### Task 14: Translate `keynesian-abm-coordination.html`

**Page-specific term swaps:**
- "agent-based model" / "ABM" → "many tiny Ugg simulation"
- "Keynesian" → "Keynes-tribe big think"
- "coordination" → "tribes all do same thing same time"
- "equilibrium" → "stuff stop moving"
- "shock" → "big surprise hit"
- "household" → "Ugg family"
- "firm" → "Ugg make-stuff tribe"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/keynesian-abm-coordination.html` fully (507 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/keynesian-abm-coordination.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/keynesian-abm-coordination.html
git commit -m "feat(caveman): translate keynesian-abm-coordination prose"
```

---

### Task 15: Translate `keynesian-abm-fiscal.html`

**Page-specific term swaps:** same as Task 14, plus:
- "fiscal stimulus" → "chief spend more shiny to wake tribe"
- "multiplier" → "how big ripple"
- "deficit" → "chief owe more than have"
- "tax" → "give shiny to chief"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/keynesian-abm-fiscal.html` fully (526 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/keynesian-abm-fiscal.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/keynesian-abm-fiscal.html
git commit -m "feat(caveman): translate keynesian-abm-fiscal prose"
```

---

### Task 16: Translate `neuron-activation-analysis.html`

**Page-specific term swaps:**
- "neuron" → "head-rock"
- "activation" → "head-rock fire"
- "layer" → "stack-level"
- "transformer" → "big-shape-thinky-rock"
- "attention" → "where Ugg look"
- "probe" → "Ugg poke with stick to see"
- "interpretability" → "Ugg see what bot think"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/neuron-activation-analysis.html` fully (504 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/neuron-activation-analysis.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/neuron-activation-analysis.html
git commit -m "feat(caveman): translate neuron-activation-analysis prose"
```

---

### Task 17: Translate `p53-mutation.html`

**Page-specific term swaps:**
- "p53" → keep "p53" (gloss as "the boss tiny-instruction that stop bad lumps")
- "mutation" → "broke spot" / "wrong copy"
- "tumor suppressor" → "bad-lump stopper"
- "oncogene" → "bad-lump maker"
- "apoptosis" → "Ugg-cell die on purpose to save tribe"
- "transcription factor" → "tiny-instruction starter"
- "missense" / "nonsense" / "frameshift" → keep technical terms; gloss once as "wrong letter" / "stop too early" / "all letters shift wrong"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/p53-mutation.html` fully (587 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/p53-mutation.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/p53-mutation.html
git commit -m "feat(caveman): translate p53-mutation prose"
```

---

### Task 18: Translate `som-tsk.html`

**Page-specific term swaps:**
- "self-organizing map" / "SOM" → "Ugg-bot make own map" / keep "SOM"
- "TSK" / "Takagi-Sugeno-Kang" → keep acronyms
- "fuzzy logic" → "kinda-true logic"
- "cluster" → "blob"
- "centroid" → "blob middle"
- "rule base" → "Ugg rule pile"

- [ ] **Step 1: Read the page**

Read `/Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/som-tsk.html` fully (586 lines).

- [ ] **Step 2: Edit prose elements**

Apply procedure.

- [ ] **Step 3: Verify coverage**

```bash
grep -c "prose--caveman" /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/som-tsk.html
```

- [ ] **Step 4: Browser-test**

- [ ] **Step 5: Commit**

```bash
git add research/som-tsk.html
git commit -m "feat(caveman): translate som-tsk prose"
```

---

## Task 19: Final cross-page verification

- [ ] **Step 1: Confirm every page has caveman content**

```bash
# Every research page should have at least one prose--caveman element
for f in /Users/evintleovonzko/Documents/projects/evint/Evintkoo.github.io/research/*.html; do
  count=$(grep -c "prose--caveman" "$f")
  echo "$count  $(basename $f)"
done
```

Expected: every page reports a count > 5. Pages with 0 indicate a missed page.

- [ ] **Step 2: Cross-page persistence smoke test in browser**

Open `bitcoin-portfolio-allocation.html`. Toggle caveman ON. Verify prose changed. Click the nav link to `research.html` (or directly open another research page like `p53-mutation.html`). Verify the new page also displays in caveman mode with no flash of formal text on load.

Toggle OFF on `p53-mutation.html`. Navigate to another research page. Confirm formal mode is restored everywhere.

- [ ] **Step 3: Theme + caveman cross-product test**

On any research page, toggle through all four combinations: dark+formal, dark+caveman, light+formal, light+caveman. Verify each renders cleanly with no broken styling.

- [ ] **Step 4: No-flash test under throttled network**

Open DevTools, set network throttling to "Slow 3G". Toggle caveman ON. Hard-reload. Watch carefully for a flash of formal prose before caveman text appears. Expected: no flash. The prose should render as caveman from the first paint.

- [ ] **Step 5: A11y sanity**

Tab through the nav. The caveman toggle should be reachable via Tab, activatable via Space/Enter, with `aria-pressed` reflecting state. Verify in DevTools Accessibility tree.

- [ ] **Step 6: Final commit (only if anything new was needed)**

If Steps 1–5 surface any fixes, commit them:

```bash
git add -A
git commit -m "chore(caveman): final verification fixes"
```

If everything was already correct, no commit needed.

---

## Definition of Done

- All 14 research pages render in formal mode by default with no visual diff vs. pre-change.
- Clicking the nav club-icon button on any research page swaps every targeted prose block to caveman text.
- Toggle state persists across reloads and across navigation between research pages (localStorage).
- No flash of formal text on load when caveman mode is on (verified under network throttle).
- No JS errors in console on any page.
- Headings, tables, formulas, sidebar, paper meta, and mindmap nodes are unchanged in caveman mode.
- All commits land on `main` with the spec and plan committed alongside.
