# Projects Section Redesign — Design Spec

**Date:** 2026-04-13
**Scope:** Full restructure of the projects/work section — split into two sections, new card designs, remove filter dropdown.

---

## Goal

Replace the single "Selected Work" section (17 uniform cards in a 3-col grid) with two distinct sections: **Projects** (built things) and **Research & Analysis** (papers and analyses). Each section gets a layout appropriate to its content type.

---

## Structure

### Before
- One `#projects` section
- 17 uniform `.project-card` items in `.projects-grid`
- Filter dropdown to switch between categories
- Section title: "Selected Work"

### After
- Two sections: `#projects` and `#research`
- Projects: featured card + compact grid
- Research: editorial rows
- No filter dropdown (sections replace filtering)

---

## Section 1: Projects

**Items:** Kolosal AI (featured), PyTorch Inference, Kolosal AutoML, SOM Plus, APT Fitness, Chain Reaction, Faction, Rebirth, PsychIDN

**Section header:**
- Eyebrow: centered mono label `01 / Projects` with `1px` lines extending left and right
- Title: `"Things I've built"` (Instrument Serif, ~2.75rem)
- Subtitle: `"Open-source tools, platforms, and applications"` (text-tertiary, 0.9rem)

### Featured Card (`.project-featured`)

Kolosal AI gets a full-width dark card (`background: var(--text)`, i.e. `#141210` light / `#ebe8e4` text in dark mode). Layout: 2-column grid — content left, link right (aligned to bottom).

- 2px gradient top bar: `linear-gradient(90deg, var(--accent-warm), var(--accent-sage))`
- Eyebrow tags: "Featured" (pink pill), role tags (dim pill)
- Title: Instrument Serif, ~2.25rem, `color: #ebe8e4`
- Description: `color: #807b76`, max-width ~480px
- Tech tags: mono, semi-transparent background
- Link: bottom-right, pink, bold, `"Visit Platform ↗"`

### Compact Grid (`.projects-grid`)

Remaining 8 items in `display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem`.

Each `.project-card`:
- `background: rgba(250,249,247,0.9)`, `border: 1px solid var(--border-primary)`, `border-radius: 1rem`, `padding: 1.5rem`
- Top: category string in mono (`"Open Source · Infrastructure"`) — replaces pill tags
- Title: Instrument Serif, 1.05rem
- Description: 0.78rem, text-tertiary
- Tech tags: small mono pills, `background: var(--bg-tertiary)`
- Links row: "Learn More →" + "Repo ↗" where applicable
- Hover: `translateY(-4px)`, pink border tint, 2px gradient top bar fades in (same as featured)

**Breakpoints:**
- ≤1023px: 2 columns
- ≤639px: 1 column

---

## Section 2: Research & Analysis

**Items:** Dual-Encoder vs Cross-Encoder, Modular vs Monolithic GRN, Two-Tower GRN, Circular RNA, Functional Group Analysis, GDP Trajectory, Crypto vs Stock, Bitcoin Portfolio

**Section header:**
- Eyebrow: `02 / Research & Analysis`
- Title: `"Papers & analyses"` (Instrument Serif)
- Subtitle: `"First-author research in ML, computational biology, and quantitative finance"`

### Editorial Rows (`.research-row`)

Each item is a `3-column grid` row: `1.1fr 2fr auto`.

- `border-top: 1px solid var(--border-primary)` on first, `border-bottom` on all
- `padding: 1.5rem 0`
- Col 1 (left): Title (Instrument Serif, 1.05rem) + subtitle line (mono, `"Research · Computational Biology"`, text-quaternary)
- Col 2 (middle): Description (0.8rem, text-tertiary, line-height 1.65)
- Col 3 (right): Badge tags stacked + link at bottom
  - "First Author" → purple pill (`rgba(124,58,237,0.1)`, `color: #7c3aed`)
  - "IEEE TNNLS" → pink pill (`rgba(225,29,100,0.1)`, `color: var(--accent-warm)`)
  - Other categories → neutral pill
  - Link: `"Read Paper →"` or `"View Analysis →"` (accent-warm, bold)
- Hover: title transitions to `var(--accent-warm)`
- Entire row is an `<a>` tag linking to the detail page

**Breakpoints:**
- ≤767px: 2-column grid — `grid-template-columns: 1fr auto` (drop the middle description column; description is hidden)
- ≤479px: 1-column — title + subtitle stacked, tags below, description hidden

---

## Removed

- `.filter-dropdown` and all related CSS/JS (filter toggle, filter menu, filter logic)
- `.section__header--with-nav` pattern (already removed in previous task)
- `.carousel-nav` (already removed)
- `id="filterLabel"` span and `id="filterToggle"`, `id="filterMenu"`
- JS: filter click handlers in `animations.js` (search for `filterToggle`, `filterMenu`, `filter-hidden`)

---

## HTML Changes

- `index.html`: Replace the single `<section id="projects">` block with two `<section>` blocks: `#projects` and `#research`
- Move research/analysis cards into `#research` section
- Kolosal AI → `.project-featured`, rest → `.project-card` in `.projects-grid`
- Research items → `.research-row` inside `.research-list`
- Remove entire filter dropdown HTML

## CSS Changes (`assets/css/main-theme.css`)

**New rules:**
- `.section-eyebrow`, `.section-eyebrow__line`, `.section-eyebrow__label`
- `.project-featured` (dark card)
- `.project-featured__eyebrow`, `.project-featured__title`, `.project-featured__desc`, `.project-featured__tech`, `.project-featured__link`
- `.project-card__category` (replaces `.project-card__tags`)
- `.research-list`, `.research-row`, `.research-row__title`, `.research-row__subtitle`, `.research-row__desc`, `.research-row__meta`, `.research-row__tag`, `.research-row__link`
- `.section-divider__dot` (decorative dot between lines)

**Modified rules:**
- `.project-card`: remove `.project-card__tags` styles, add `.project-card__category`, simplify padding to `1.5rem`
- `.projects-grid`: gap reduces from `var(--space-6)` to `1rem`

**Removed rules:**
- `.filter-dropdown`, `.filter-dropdown__toggle`, `.filter-dropdown__menu`, `.filter-dropdown__item`, `.filter-dropdown__icon`, `.filter-dropdown__chevron`
- `.project-card.filter-hidden`

## JS Changes (`assets/js/animations.js`)

- Remove filter dropdown event listeners (toggle open/close, item click, filter logic)
- Remove `filter-hidden` class toggling
- Remove `filterLabel` text update logic

---

## Dark Mode

- `.project-featured`: stays dark in both modes (it's intentionally inverted)
- `.project-card`: `background: rgba(17,17,20,0.62)` in dark mode (same as current)
- `.research-row`: inherits dark mode text/border colors via CSS variables — no extra rules needed
- Badge pills use rgba so they adapt automatically

---

## What Stays the Same

- All card hover animations (lift, gradient top bar)
- `data-reveal` scroll reveal on section containers
- All links and content (no copy changes)
- Dark mode toggle
- nav links (update `#projects` href to still work; add `#research` link)
