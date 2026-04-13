# Project Cards Layout Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the horizontal scrolling carousel on the projects section with a responsive 3-column CSS grid so all cards are visible at once.

**Architecture:** Two file changes only — remove carousel HTML from `index.html`, and swap carousel CSS for grid CSS in `main-theme.css`. No JS changes needed (the carousel JS file referenced in HTML doesn't exist on disk).

**Tech Stack:** Vanilla HTML/CSS, no build step.

---

## File Map

| File | Change |
|------|--------|
| `index.html` | Remove `.carousel-nav` block; rename class `project-carousel` → `projects-grid` on container; remove `section__header--with-nav` class (no longer needed) |
| `assets/css/main-theme.css` | Replace `.project-carousel` with `.projects-grid` (grid layout); remove `.carousel-nav` / `.carousel-btn` rules; update `.project-card` to drop flex-sizing; update breakpoints |

---

### Task 1: Update HTML

**Files:**
- Modify: `index.html:133` (section header), `index.html:155-166` (carousel-nav), `index.html:169` (container class)

- [ ] **Step 1: Remove the `.carousel-nav` block**

In `index.html`, delete lines 155–166 (the entire `<div class="carousel-nav">...</div>` block):

```html
<!-- DELETE THIS ENTIRE BLOCK -->
<div class="carousel-nav">
    <button class="carousel-btn carousel-btn--prev" aria-label="Previous project">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    </button>
    <button class="carousel-btn carousel-btn--next" aria-label="Next project">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    </button>
</div>
```

- [ ] **Step 2: Remove `section__header--with-nav` modifier from the header**

On line 133, change:
```html
<div class="section__header section__header--with-nav" data-reveal>
```
to:
```html
<div class="section__header" data-reveal>
```

- [ ] **Step 3: Rename the carousel container class**

On line 169, change:
```html
<div class="project-carousel" data-reveal>
```
to:
```html
<div class="projects-grid" data-reveal>
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: replace project carousel container with grid in HTML"
```

---

### Task 2: Replace Carousel CSS with Grid CSS

**Files:**
- Modify: `assets/css/main-theme.css`

- [ ] **Step 1: Replace the `.project-carousel` block with `.projects-grid`**

Find the block starting at line 1108:
```css
.project-carousel {
  display: flex;
  gap: var(--space-6);
  overflow-x: auto;
  ...
  cursor: grab;
}

.project-carousel:active {
  cursor: grabbing;
}

.project-carousel::-webkit-scrollbar {
  display: none;
}
```

Replace the entire `.project-carousel`, `.project-carousel:active`, and `.project-carousel::-webkit-scrollbar` rules with:
```css
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}
```

- [ ] **Step 2: Update `.project-card` — remove flex-sizing and scroll-snap**

Find `.project-card` (around line 1132). Remove these three lines:
```css
scroll-snap-align: start;
flex: 0 0 calc(33.333% - var(--space-6) * 2 / 3);
min-width: 300px;
```

Leave everything else (background, backdrop-filter, border, border-radius, padding, display, flex-direction, transition, position, overflow, min-height, cursor) unchanged.

- [ ] **Step 3: Remove `.carousel-nav` and `.carousel-btn` rules**

Delete the following CSS blocks (around lines 1071–1107):
```css
.carousel-nav { ... }
.carousel-btn { ... }
.carousel-btn:hover:not(:disabled) { ... }
.carousel-btn:disabled { ... }
.carousel-btn svg { ... }
```

- [ ] **Step 4: Update breakpoint for `.project-card` at ≤1023px**

Find the `@media (max-width: 1023px)` block that contains:
```css
.project-card {
  flex: 0 0 calc(50% - var(--space-6) / 2);
  min-width: 280px;
}
```

Replace it with the grid breakpoint on the container — add `.projects-grid` rule and remove the card flex override:
```css
@media (max-width: 1023px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

(Remove the `.project-card` flex rule from this breakpoint entirely — the card no longer needs explicit sizing at this breakpoint.)

- [ ] **Step 5: Update breakpoint for `.project-card` at ≤639px**

Find the `@media (max-width: 639px)` block that contains:
```css
.project-card {
  flex: 0 0 85%;
  min-width: 260px;
  min-height: 280px;
}
```

Replace with:
```css
@media (max-width: 639px) {
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .project-card {
    min-height: 280px;
  }
}
```

(Keep `min-height: 280px` on the card — remove only the flex sizing.)

- [ ] **Step 6: Remove tablet `.project-carousel` breakpoint override**

In the tablet media query (around line 1955), find and delete:
```css
/* Project cards */
.project-carousel {
  gap: var(--space-4);
  margin: 0 calc(var(--space-3) * -1);
  padding: var(--space-3);
}
```

If that block is inside a shared breakpoint with other rules, remove only the `.project-carousel` rule. The `.project-card` padding/font overrides in that same breakpoint (`padding: var(--space-5)`, `min-height: 260px`, `.project-card__title`, `.project-card__desc`, `.project-card__tags`, `.project-card__tech`) stay.

- [ ] **Step 7: Remove `.carousel-nav` / `.carousel-btn` tablet/mobile overrides**

Find and delete these blocks from tablet/mobile breakpoints (around lines 1911–1923 and 1893–1913):
```css
.section__header--with-nav {
  display: flex;
  flex-direction: column;
  ...
}
.section__header--with-nav .section__title { ... }
.section__title-group { ... }
.carousel-nav { justify-content: flex-end; }
.carousel-btn { width: 38px; height: 38px; }
.carousel-btn svg { width: 16px; height: 16px; }
```

- [ ] **Step 8: Remove the comment stubs referencing carousel**

Delete these two comment lines (they're now stale):
- `/* (Slider styles replaced by .project-carousel above) */` (line ~1732)
- `/* (Card tilt removed — carousel uses CSS hover effects) */` (line ~1872)

- [ ] **Step 9: Commit**

```bash
git add assets/css/main-theme.css
git commit -m "feat: replace project carousel with responsive 3-column grid"
```

---

### Task 3: Verify

- [ ] **Step 1: Open `index.html` in a browser**

Open the file directly (e.g., `open index.html`) or serve it locally. Navigate to the Projects section.

Expected:
- All project cards are visible in a 3-column grid (no horizontal scrollbar)
- No prev/next arrow buttons visible
- Resize to ~900px wide: grid collapses to 2 columns
- Resize to ~600px wide: grid collapses to 1 column
- Hover on any card: pink lift + gradient top bar still animates
- Dark mode toggle still works

- [ ] **Step 2: Commit (if any final tweaks were needed)**

```bash
git add -p
git commit -m "fix: adjust grid layout after visual verification"
```
