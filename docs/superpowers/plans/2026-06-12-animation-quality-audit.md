# Animation Quality Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply emilkowalski/skill, pbakaus/impeccable, and tasteskill.dev principles to improve animation quality, accessibility, and interaction feel across the portfolio site — no HTML changes, no new dependencies.

**Architecture:** All changes land in `assets/css/main-theme.css` (2507 lines, shared across all pages) and one line in `assets/js/main-theme.js`. CSS changes are independent and can be verified by opening `index.html` in a browser. No build step required.

**Tech Stack:** Vanilla HTML/CSS/JS. No framework. No npm. Open files directly in browser for visual verification.

**Spec:** `docs/superpowers/specs/2026-06-12-animation-quality-audit-design.md`

---

## File Map

| File | What changes |
|------|-------------|
| `assets/css/main-theme.css` | Easing vars (line 84–86), `transition: all` (6 locations), button `:active`, dark mode tint, icon keyframes, hover guards (new section), prefers-reduced-motion expansion (line 2424), reveal entry states (line 2226), research row |
| `assets/js/main-theme.js` | Stagger timing (line 626) |

---

## Task 1: Add Custom Easing Variables

**Files:**
- Modify: `assets/css/main-theme.css:84-86`

- [ ] **Step 1: Edit the three transition vars in `:root` (around line 84)**

Replace:
```css
  --transition-fast: 150ms cubic-bezier(0.25, 0.1, 0.25, 1);
  --transition-base: 280ms cubic-bezier(0.25, 0.1, 0.25, 1);
  --transition-slow: 450ms cubic-bezier(0.25, 0.1, 0.25, 1);
```

With:
```css
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --transition-fast: 150ms var(--ease-out);
  --transition-base: 280ms var(--ease-out);
  --transition-slow: 450ms var(--ease-in-out);
```

- [ ] **Step 2: Visual verification**

Open `index.html` in a browser. Hover over nav links and buttons. The transitions should feel snappier — they start faster and ease out more aggressively than before. If it feels identical, the vars may not have taken effect — check for typos.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat(css): add punchy custom easing variables (Emil skill)"
```

---

## Task 2: Replace `transition: all` (6 Locations)

**Files:**
- Modify: `assets/css/main-theme.css` (lines 545, 777, 1105, 1140, 1748, 2135)

`transition: all` animates every CSS property including layout-triggering ones (height, padding). Emil's checklist lists this as a bug. Replace each with explicit properties.

- [ ] **Step 1: Fix line 545 — `.nav__link--cta`**

Replace:
```css
  transition: all var(--transition-base);
```
With:
```css
  transition: color var(--transition-base), background-color var(--transition-base),
              border-color var(--transition-base), box-shadow var(--transition-base);
```

- [ ] **Step 2: Fix line 777 — `.nav__toggle span`**

Replace:
```css
  transition: all var(--transition-fast);
```
With:
```css
  transition: transform var(--transition-fast), background-color var(--transition-fast);
```

- [ ] **Step 3: Fix line 1105 — `.btn` base rule**

Replace:
```css
  transition: all var(--transition-base);
```
With:
```css
  transition: color var(--transition-base), background-color var(--transition-base),
              border-color var(--transition-base), box-shadow var(--transition-base),
              transform var(--transition-base);
```

- [ ] **Step 4: Fix line 1140 — `.btn--ghost`**

Replace:
```css
  transition: all var(--transition-base);
```
With:
```css
  transition: color var(--transition-base), border-color var(--transition-base);
```

- [ ] **Step 5: Fix line 1748 — `.tech-grid li`**

Replace:
```css
  transition: all var(--transition-base);
```
With:
```css
  transition: color var(--transition-base), background-color var(--transition-base),
              border-color var(--transition-base), transform var(--transition-base);
```

- [ ] **Step 6: Fix line 2135 — `.scroll-to-top`**

Replace:
```css
  transition: all var(--transition-base);
```
With:
```css
  transition: opacity var(--transition-base), transform var(--transition-base),
              background-color var(--transition-base), color var(--transition-base);
```

- [ ] **Step 7: Visual verification**

Open `index.html`. All animated elements should behave identically to before — this change improves performance without changing visible behavior. Scroll to bottom and verify the scroll-to-top button appears and fades correctly. Hover tech tags in the About section.

- [ ] **Step 8: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "fix(css): replace transition:all with explicit properties (Impeccable rule)"
```

---

## Task 3: Button `:active` Press Feedback

**Files:**
- Modify: `assets/css/main-theme.css` (after `.btn--large` rule, around line 1176)

Emil: "Add `transform: scale(0.97)` on `:active` for instant press feedback. This confirms the interface heard the user."

- [ ] **Step 1: Add `:active` rule after `.btn--large` (around line 1180)**

Add this block:
```css
/* Press feedback — confirms the interface heard the user (Emil Kowalski) */
.btn:active {
  transform: scale(0.97);
  transition-duration: 100ms;
}
```

Note: `.project-card:active` and `.experience-item:active` already have press feedback — do not change those.

- [ ] **Step 2: Visual verification**

Open `index.html`. Click the "See my work" and "About me" buttons in the hero. You should feel a slight physical press (scale down then back up). If the effect isn't visible, ensure the rule isn't being overridden by a more specific selector.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat(css): add button :active press feedback scale(0.97)"
```

---

## Task 4: Dark Mode Tint + Icon Entry Scale Fix

**Files:**
- Modify: `assets/css/main-theme.css` (lines 95–98, 614, 638)

Two changes in this task:

**4a — Dark mode warm tint:** Impeccable: "Never pure black/gray — always tint." Current dark bg is `#0a0a0c` (near-pure black). Warm tint harmonizes with the light mode ivory palette.

**4b — Icon entry scale:** Emil: "Never animate from scale(0). Nothing in reality appears from nothing." Sun enters from `scale(0.15)`, moon from `scale(0.2)`.

- [ ] **Step 1: Update dark mode background vars (around line 95)**

Replace:
```css
  --bg-primary: #0a0a0c;
  --bg-secondary: #111114;
  --bg-tertiary: #1a1a1f;
  --bg-accent: #24242b;
```
With:
```css
  --bg-primary: #0c0b09;
  --bg-secondary: #131210;
  --bg-tertiary: #1c1a18;
  --bg-accent: #252320;
```

- [ ] **Step 2: Fix sun-enter keyframe 0% (around line 614)**

Replace:
```css
  0%   { opacity: 0; transform: scale(0.15) rotate(-120deg); }
```
With:
```css
  0%   { opacity: 0; transform: scale(0.6) rotate(-120deg); }
```

- [ ] **Step 3: Fix moon-enter keyframe 0% (around line 638)**

Replace:
```css
  0%   { opacity: 0; transform: translate(10px, -10px) scale(0.2) rotate(50deg); }
```
With:
```css
  0%   { opacity: 0; transform: translate(10px, -10px) scale(0.6) rotate(50deg); }
```

- [ ] **Step 4: Visual verification**

Switch to dark mode (`index.html`). The background should feel warmer and less "dead black" — subtle but noticeable against text. Click the theme toggle several times and watch the sun/moon icons. They should enter with the same spring character but starting from a more visible initial size (no longer "popping from nothing").

- [ ] **Step 5: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "fix(css): warm-tint dark mode backgrounds; fix icon entry from near-zero scale"
```

---

## Task 5: Hover Media Query Guards

**Files:**
- Modify: `assets/css/main-theme.css` (lines 1122–1174, 1432–1436, 1610–1616)

Emil: "Touch devices trigger hover on tap, causing false positives. Gate hover **transform-based** animations behind `@media (hover: hover) and (pointer: fine)`." Color-only hovers are safe and stay unguarded.

This task has two steps: (a) strip `transform` + lift `box-shadow` from the existing hover rules, then (b) re-add them inside a guarded block.

- [ ] **Step 1: Remove transforms from `.btn--primary:hover` (around line 1122)**

Replace:
```css
.btn--primary:hover {
  background-color: var(--accent-warm);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(225, 29, 100, 0.2);
}

.btn--primary:hover svg {
  transform: translateX(3px);
}
```
With:
```css
.btn--primary:hover {
  background-color: var(--accent-warm);
  color: #fff;
}
```
(Delete the `.btn--primary:hover svg` block entirely — it moves to the guarded section in Step 5.)

- [ ] **Step 2: Remove transforms from `.btn--secondary:hover` (around line 1165)**

Replace:
```css
.btn--secondary:hover {
  border-color: var(--accent-warm);
  color: var(--accent-warm);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(225, 29, 100, 0.1);
}

.btn--secondary:hover svg {
  transform: translate(2px, -2px);
}
```
With:
```css
.btn--secondary:hover {
  border-color: var(--accent-warm);
  color: var(--accent-warm);
}
```
(Delete the `.btn--secondary:hover svg` block entirely — it moves to the guarded section in Step 5.)

- [ ] **Step 3: Remove transform from `.project-card:hover` (around line 1432)**

Replace:
```css
.project-card:hover {
  transform: translateY(-8px);
  border-color: rgba(244, 63, 122, 0.4);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(244, 63, 122, 0.15);
}
```
With:
```css
.project-card:hover {
  border-color: rgba(244, 63, 122, 0.4);
  /* transform and box-shadow moved to hover guard below */
}
```

- [ ] **Step 4: Remove transform from `.experience-item:hover` (around line 1610)**

Replace:
```css
.experience-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(244, 63, 122, 0.15);
  border-color: rgba(244, 63, 122, 0.4);
}
```
With:
```css
.experience-item:hover {
  border-color: rgba(244, 63, 122, 0.4);
  /* transform and box-shadow moved to hover guard below */
}
```

- [ ] **Step 5: Add the guarded block before the REDUCED MOTION section (before line ~2420)**

Add this entire block:
```css
/* ================================
   HOVER GUARD
   Transform-based lifts and SVG arrow movements only apply on
   real pointer devices. Touch screens get color-only hover.
   Emil Kowalski: gate transform hovers behind (hover: hover) and (pointer: fine).
================================ */
@media (hover: hover) and (pointer: fine) {
  .btn--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(225, 29, 100, 0.2);
  }

  .btn--primary:hover svg {
    transform: translateX(3px);
  }

  .btn--secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(225, 29, 100, 0.1);
  }

  .btn--secondary:hover svg {
    transform: translate(2px, -2px);
  }

  .project-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(244, 63, 122, 0.15);
  }

  .experience-item:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(244, 63, 122, 0.15);
  }
}
```

- [ ] **Step 6: Visual verification**

Open `index.html` on desktop. Hover buttons, project cards, and experience items — they should lift exactly as before (no regression on desktop). Color changes on all hover states remain active.

Optional: in Chrome DevTools, switch to a touch device profile. Hover (tap) should show color changes but no lift or box-shadow on cards/buttons.

- [ ] **Step 7: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "fix(css): gate transform-based hover lifts behind (hover:hover) and (pointer:fine)"
```

---

## Task 6: Expand `prefers-reduced-motion` Block

**Files:**
- Modify: `assets/css/main-theme.css` (lines 2424–2459 — existing block)

The reduced-motion block exists but is partial. It handles hero, data-reveal, project-card, and scene-bg. It misses: custom cursor, sun/moon animations, scroll animations, and all other `@keyframes`. Add a global catch-all at the top of the block.

- [ ] **Step 1: Add global catch-all at the top of the existing `@media (prefers-reduced-motion: reduce)` block (line 2424)**

The block currently opens with `.hero__greeting, .hero__title, ...`. Add these lines immediately after the `@media (prefers-reduced-motion: reduce) {` opening:

```css
  /* Global catch-all: kill all movement animations */
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
```

The existing rules below it remain — they use `opacity: 1 !important` overrides which are still useful to ensure elements appear even without their reveal animations.

- [ ] **Step 2: Add cursor suppression to the same block (after the global catch-all)**

```css
  .cursor-dot,
  .cursor-ring {
    display: none;
  }
```

- [ ] **Step 3: Visual verification**

On macOS: System Settings → Accessibility → Display → "Reduce motion". Open `index.html`. The page should load with all elements visible immediately — no scroll reveals, no hero fade-in, no cursor ring, no 3D canvas (already hidden). Text and layout should be fully readable.

Turn reduce motion back off and verify normal animations return.

- [ ] **Step 4: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat(css): expand prefers-reduced-motion with global catch-all and cursor suppression"
```

---

## Task 7: Scroll Reveal Entry States (Scale Depth)

**Files:**
- Modify: `assets/css/main-theme.css` (lines 2226–2258)

Emil: Add `scale(0.98)` to initial reveal state for a subtle 3D depth feel on entry. Also reduce `translateY` from 36px to 24px (less distance = faster feeling reveal). The existing transition curve `cubic-bezier(0.16, 1, 0.3, 1)` is already a well-tuned ease-out — do NOT change it.

- [ ] **Step 1: Update `[data-reveal]` initial state (around line 2226)**

Replace:
```css
[data-reveal] {
  opacity: 0;
  transform: translateY(36px);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
}
```
With:
```css
[data-reveal] {
  opacity: 0;
  transform: translateY(24px) scale(0.98);
  transition:
    opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 2: Update `[data-reveal="left"]` and `[data-reveal="right"]` (around lines 2234–2240)**

Replace:
```css
[data-reveal="left"] {
  transform: translateX(-36px) translateY(0);
}

[data-reveal="right"] {
  transform: translateX(36px) translateY(0);
}
```
With:
```css
[data-reveal="left"] {
  transform: translateX(-24px) translateY(0) scale(0.98);
}

[data-reveal="right"] {
  transform: translateX(24px) translateY(0) scale(0.98);
}
```

- [ ] **Step 3: Update `[data-stagger] > *` initial state (around line 2252)**

Replace:
```css
[data-stagger] > * {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
```
With:
```css
[data-stagger] > * {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 4: Visual verification**

Scroll down through `index.html`. Each section should animate in with a very subtle scale + translate — looks like elements rising from slightly smaller into focus. The difference from before is subtle but makes entries feel more three-dimensional.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat(css): add scale(0.98) depth to scroll reveal entry states"
```

---

## Task 8: Fix Stagger Delay Timing (JS)

**Files:**
- Modify: `assets/js/main-theme.js:626`

Emil: "Keep stagger delays short (30-80ms between items). Long delays make the interface feel slow." Current: `i * 0.09` = 90ms per item. The projects grid has 9 cards — the last card waits 720ms before appearing. Change to 50ms.

- [ ] **Step 1: Find and fix stagger delay (line 626)**

Open `assets/js/main-theme.js`. Find line 626:
```js
children[i].style.transitionDelay = (i * 0.09) + 's';
```

Replace with:
```js
children[i].style.transitionDelay = (i * 0.05) + 's';
```

- [ ] **Step 2: Visual verification**

Open `index.html` and scroll to the Projects section. The 9 project cards should fan in faster — last card appears at ~450ms instead of ~810ms. The cascade should feel snappy rather than slow.

- [ ] **Step 3: Commit**

```bash
git add assets/js/main-theme.js
git commit -m "fix(js): reduce stagger delay from 90ms to 50ms per item (Emil skill)"
```

---

## Task 9: Research Row Hover Slide + Transition Fix

**Files:**
- Modify: `assets/css/main-theme.css` (lines 1990–2000, 2078–2092)

Emil: "Arrow indicators should animate to reinforce the direction of action." Add a subtle `translateX(4px)` slide-right on research row hover. Also the row has no explicit transition — add one.

- [ ] **Step 1: Add transition to `.research-row` (around line 1998–1999)**

Add `transition` to the existing `.research-row` rule:
```css
.research-row {
  display: grid;
  grid-template-columns: 1.1fr 2fr auto;
  gap: var(--space-8);
  align-items: start;
  padding: var(--space-6) 0;
  border-bottom: 1px solid var(--border-primary);
  text-decoration: none;
  color: inherit;
  transition: transform 200ms var(--ease-out);
}
```

- [ ] **Step 2: Add hover slide rule (inside hover guard to be safe)**

After the `.research-row:hover .research-row__title` rule (line 2005), add:
```css
@media (hover: hover) and (pointer: fine) {
  .research-row:hover {
    transform: translateX(4px);
  }
}
```

- [ ] **Step 3: Visual verification**

Scroll to the Research section. Hover over each research row. The entire row should slide 4px to the right and the title should turn warm pink. Remove your mouse — it should slide back. The effect should use the new punchy `ease-out` curve (from Task 1's `--ease-out` var).

- [ ] **Step 4: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat(css): add directional hover slide to research rows (Emil skill)"
```

---

## Task 10: Final Cross-Browser Verification

No code changes. Verification only.

- [ ] **Step 1: Open `index.html` in browser, run through the golden path**

Check each of these in sequence:
1. Hero loads — title and description fade in smoothly
2. Scroll down — sections reveal with subtle scale + translate
3. Projects grid fans in — 9 cards, each 50ms apart (last card at ~450ms)
4. Hover a project card — lifts on desktop, no lift on mobile (if testing on mobile/simulator)
5. Click any `.btn` — feel the press (scale down briefly)
6. Hover research rows — slide 4px right + title turns pink
7. Click theme toggle — sun/moon icons enter from larger starting scale (no "pop from nothing")
8. Dark mode — backgrounds should look warm-tinted, not dead black
9. Hover nav CTA button ("Get in touch") — transition should feel snappy

- [ ] **Step 2: Check `about.html`, `projects.html`, `research.html` for visual regressions**

These pages share `main-theme.css` and `main-theme.js` — all fixes apply globally. Open each and confirm no broken layouts or missing animations.

- [ ] **Step 3: Final commit (if any cleanup needed)**

```bash
git add -p  # stage any remaining fixes
git commit -m "fix(css): post-audit visual regression fixes"
```

---

## Out of Scope (Documented for Future)

- `@starting-style` on project cards — would conflict with the existing IntersectionObserver; the IO approach already handles this correctly
- Visual card redesign (Approach C)
- HTML structure changes
- Font changes
