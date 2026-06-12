# Animation & Design Quality Audit — Spec

**Date:** 2026-06-12
**Approach:** B — CSS + JS improvements
**Skills applied:** emilkowalski/skill, pbakaus/impeccable, tasteskill.dev
**Scope:** `assets/css/main-theme.css`, `assets/js/main-theme.js`
**No HTML changes required.**

---

## 1. Easing System Overhaul

**Problem:** All transitions use a single generic `cubic-bezier(0.25, 0.1, 0.25, 1)` (equivalent to CSS `ease`). This is incorrect for entering/exiting elements — it starts slowly, making UI feel sluggish.

**Fix:** Replace the three transition variables with a proper 3-curve system and add named ease variables to `:root`.

```css
/* Add to :root */
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

/* Repoint existing vars */
--transition-fast: 150ms var(--ease-out);
--transition-base: 280ms var(--ease-out);
--transition-slow: 450ms var(--ease-in-out);
```

The spring curve `cubic-bezier(0.34, 1.56, 0.64, 1)` already used on icon animations is correct — keep it.

**Rule (Emil):** `ease-out` for entries/exits (fast start = responsive feel), `ease-in-out` for morphing/moving on screen. Never `ease-in` for UI.

---

## 2. Animation Hygiene

### 2a. Replace `transition: all`

`transition: all` animates every CSS property, including layout-triggering ones (`height`, `padding`). Emil's checklist explicitly lists this as a bug.

**Locations to fix (by line in main-theme.css):**
- Line 545 (nav__link--cta): replace with `color, background-color, border-color, box-shadow`
- Line 777 (nav__toggle span): replace with `transform, background-color`
- Line 1105 (btn--secondary): replace with `color, background-color, border-color, box-shadow, transform`
- Line 1140 (project-card__link area): replace with `color, transform`
- Line 1748 (tech-grid li): replace with `color, background-color, border-color, transform`
- Line 2135 (footer__link): replace with `color`

### 2b. Hover Guards

40+ hover rules apply transform-based effects on touch devices, causing false-tap hover states. Color/opacity hovers are safe — transform-based hovers must be gated.

**Fix:** Wrap all hover rules that use `transform`, `scale`, `translateX/Y`, or `box-shadow` behind:
```css
@media (hover: hover) and (pointer: fine) { ... }
```

Color-only hover transitions (text color, border color) can remain ungated.

### 2c. `prefers-reduced-motion`

The site has no reduced-motion support. Add a block at the bottom of `main-theme.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This kills movement but preserves instant state changes for comprehension.

---

## 3. Interactive Feedback

### 3a. Button Press Feedback

Add `transform: scale(0.97)` on `:active` for all `.btn` variants. Emil: "This confirms the interface heard the user."

```css
.btn:active {
  transform: scale(0.97);
  transition-duration: 100ms;
}
```

Project cards already have `:active` scale — keep as-is.

### 3b. Dark Mode Tint

**Problem:** `--bg-primary: #0a0a0c` (dark mode) is near-pure black. Impeccable rule: "Never pure black/gray — always tint."

**Fix:**
```css
/* Dark mode — warm-tinted blacks */
--bg-primary:    #0c0b09;   /* was #0a0a0c */
--bg-secondary:  #131210;   /* was #111114 */
--bg-tertiary:   #1c1a18;   /* was #1a1a1f */
--bg-accent:     #252320;   /* was #24242b */
```

The warm tint harmonizes with the warm ivory light mode palette and removes the "dead black" feeling.

### 3c. Entry Animation Starting Scale

**Problem:** Sun/moon icon enter keyframe starts from `scale(0.15)` — Emil rule: "Never animate from scale(0). Nothing in reality appears from nothing."

**Fix:** Change 0% keyframe of `sun-enter` and `moon-enter` animations from `scale(0.15)` to `scale(0.6)`, combined with `opacity: 0`.

---

## 4. Scroll Reveal & Stagger

### 4a. Stagger Timing (JS)

In `main-theme.js` line 626, the `[data-stagger]` observer sets `children[i].style.transitionDelay = (i * 0.09) + 's'` — 90ms between items. Emil: "Keep stagger delays short (30-80ms between items)."

**Fix:** Change `0.09` to `0.05` (50ms). This is within the recommended band and reduces the "things feel slow" sensation on the projects grid which has 9+ items.

```js
children[i].style.transitionDelay = (i * 0.05) + 's';
```

### 4b. Entry Animation Refinement

Current reveal entries (`main-theme.css` line 2226) start from `translateY(36px)` — a large shift. Add a subtle `scale(0.98)` to the initial state for depth. The existing transition curve `cubic-bezier(0.16, 1, 0.3, 1)` is already a well-tuned ease-out — do NOT replace it with `var(--ease-out)`.

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(24px) scale(0.98);  /* was translateY(36px) — tighter + adds depth */
  /* transition unchanged — cubic-bezier(0.16, 1, 0.3, 1) is correct */
}

[data-stagger] > * {
  opacity: 0;
  transform: translateY(16px) scale(0.98);  /* was translateY(28px) */
  /* transition unchanged */
}
```

**Note:** The easing overhaul in Section 1 applies to `--transition-fast/base/slow` variables only. The scroll-reveal transitions use hardcoded `cubic-bezier(0.16, 1, 0.3, 1)` — this is correct and must be preserved.

### 4c. `@starting-style` Declarations

For Chrome 117+/Firefox 129+/Safari 17.5+ — add `@starting-style` to project cards and research rows so they animate on first paint without requiring the JS IntersectionObserver. No `@supports` wrapper needed — browsers that don't support `@starting-style` silently ignore the block.

```css
.project-card {
  @starting-style {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}
```

The IntersectionObserver JS fallback stays for older browsers that don't support `@starting-style`.

### 4d. Research Row Hover Slide

Replace `transition: all` on `.research-row` with explicit properties and add a directional slide:

```css
@media (hover: hover) and (pointer: fine) {
  .research-row:hover {
    transform: translateX(4px);
  }
}
.research-row {
  transition: background-color 200ms var(--ease-out),
              transform 200ms var(--ease-out);
}
```

---

## Files Changed

| File | Changes |
|------|---------|
| `assets/css/main-theme.css` | Easing vars, transition:all replacements, hover guards, prefers-reduced-motion block, dark mode tint, button active states, entry scale fix |
| `assets/js/main-theme.js` | Stagger delay timing, reveal entry state (translateY + scale) |

---

## Out of Scope

- HTML structure changes
- New dependencies
- Visual redesign of cards or hero section (Approach C)
- Font changes
- Color palette changes beyond dark mode tint
