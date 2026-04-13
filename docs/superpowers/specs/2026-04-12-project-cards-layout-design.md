# Project Cards Layout Rework — Design Spec

**Date:** 2026-04-12  
**Scope:** Layout only — no content, copy, or interaction changes beyond removing carousel nav

---

## Problem

The current `.project-carousel` uses a horizontal scrolling flex container with prev/next arrow buttons. With ~10 projects, users have to navigate the carousel to see all cards — creating unnecessary friction.

## Solution

Replace the horizontal carousel with a responsive CSS grid. All cards are visible at once.

---

## Layout Spec

### HTML Changes

- Remove `.carousel-nav` block (the prev/next arrow buttons) from `index.html`
- Rename class `project-carousel` → `projects-grid` on the container `<div>`

### CSS Changes

**Container** (`.projects-grid`):
```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: var(--space-6);
```

**Breakpoints:**
- ≤1023px: `grid-template-columns: repeat(2, 1fr)`
- ≤639px: `grid-template-columns: 1fr`

**Remove from `.project-card`:**
- `scroll-snap-align: start`
- `flex: 0 0 calc(33.333% - var(--space-6) * 2 / 3)`
- `min-width: 300px` (and breakpoint overrides)

All other card styles remain unchanged (hover lift, gradient top bar, backdrop blur, dark mode, etc.).

### JS Changes

- Remove or disable carousel drag/scroll JS that references `.project-carousel` or `.carousel-btn`

---

## What Stays the Same

- Card content (tags, title, desc, tech tags, links)
- Hover animations and effects
- Dark/light mode support
- Reveal animation (`data-reveal`)
- Filter functionality (`.filter-hidden`)
