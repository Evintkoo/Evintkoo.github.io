# Research Sidebar Redesign

## Goal

Delete and rebuild the research paper sidebar from scratch with a minimal editorial style — no panel, no icons, pure typography — and replace the mobile bottom-sheet with a right-edge pull-tab drawer.

## Applies To

All 8 research HTML pages:
- `research/grn-dual-vs-cross-encoder.html`
- `research/grn-modular-vs-monolithic.html`
- `research/grn-two-tower.html`
- `research/circular-rna.html`
- `research/functional-group-analysis.html`
- `research/global-gdp-patterns.html`
- `research/crypto-stock-timing.html`
- `research/bitcoin-portfolio-allocation.html`

## Design

### Desktop (≥ 1201px)

- Frameless — no card, no background, no border, no blur
- Sticky, aligned to the left of the content column
- Title: `RESEARCH SECTIONS` — tiny all-caps mono label, muted color
- Each item: a horizontal dash followed by the section name
  - **Unvisited**: no dash, text at minimum opacity (dimmed)
  - **Visited** (scrolled past): short grey dash + muted text
  - **Active** (currently in view): rose dash + rose text, no bold
- No icons, no numbers, no progress track line
- Font: `var(--font-mono)` for the title label; Plus Jakarta Sans (body font) for items
- Font size: small (~0.75rem for items, ~0.55rem for title)
- Active section detected via `IntersectionObserver` (same as current)

### Mobile (< 1201px)

- Replaces the current bottom-sheet + FAB entirely
- A narrow tab peeks from the right edge, vertically centered:
  - Width: ~18px, height: ~52px
  - Background: dark semi-transparent (`var(--bg-secondary)` or similar)
  - Contains a rose chevron `›` pointing left (closed) / `‹` pointing right (open)
  - `border-radius` on the left side only (pill half)
  - No border on the right side (flush with screen edge)
- Tapping the tab slides a drawer in from the right:
  - Drawer width: ~200px
  - Background: `var(--bg-primary)` (solid, same as page) so text is legible
  - Same minimal dash + text list inside
  - Closes on: tapping a section link, tapping the tab again, tapping outside the drawer
- The existing `.research-sidebar-toggle` button is removed entirely

### Active/Visited State Logic (JS)

Use `IntersectionObserver` watching each `<section id="...">` element:
- When a section enters the viewport (threshold ~0.2): mark its link `.active`, remove `.active` from others
- When a section has been `.active` and then leaves (scrolled past): mark it `.visited`
- On page load: first section starts `.active`

### HTML Structure (per page)

Replace current sidebar HTML with:

```html
<!-- Sidebar: desktop sticky + mobile right-tab drawer -->
<aside class="rsb" id="rsb" aria-label="Research sections">
  <div class="rsb__inner">
    <p class="rsb__title">Research Sections</p>
    <nav>
      <a href="#abstract"      class="rsb__link active" data-section="abstract">Abstract</a>
      <a href="#introduction"  class="rsb__link"        data-section="introduction">Introduction</a>
      <a href="#methods"       class="rsb__link"        data-section="methods">Methods</a>
      <a href="#results"       class="rsb__link"        data-section="results">Results</a>
      <a href="#discussion"    class="rsb__link"        data-section="discussion">Discussion</a>
      <a href="#conclusion"    class="rsb__link"        data-section="conclusion">Conclusion</a>
    </nav>
  </div>
  <!-- Mobile pull tab -->
  <button class="rsb__tab" id="rsbTab" aria-label="Toggle navigation">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline class="rsb__chevron" points="15 18 9 12 15 6"/>
    </svg>
  </button>
</aside>
<div class="rsb__overlay" id="rsbOverlay"></div>
```

Note: section IDs vary per paper — some have `#abstract`, some start differently. Each HTML file must use its actual section IDs.

### CSS Classes (new, replaces all `.research-sidebar*`)

- `.rsb` — the aside element; desktop: sticky container; mobile: fixed right-side drawer
- `.rsb__inner` — scrollable content area (title + nav links)
- `.rsb__title` — all-caps mono label
- `.rsb__link` — each section link; has dash via `::before` pseudo-element
- `.rsb__link.active` — rose dash + rose color
- `.rsb__link.visited` — grey dash + muted color
- `.rsb__tab` — the pull tab button, only visible on mobile
- `.rsb__chevron` — the `<polyline>` inside the tab SVG; flips on open
- `.rsb__overlay` — transparent full-screen overlay on mobile to catch outside taps; hidden by default
- `.rsb.open` — state class added by JS when drawer is open

### JS Behavior (in `assets/js/main-theme.js`, inside `initResearchFeatures()`)

1. `IntersectionObserver` for active/visited tracking (as above)
2. Tab click: toggle `.rsb.open` on `#rsb`; toggle chevron direction
3. Overlay click: close drawer (remove `.rsb.open`)
4. Link click (mobile only): close drawer after navigation

## Files Changed

| File | Change |
|------|--------|
| `assets/css/research.css` | Delete all `.research-sidebar*` and `.research-sidebar-toggle*` blocks; add new `.rsb*` blocks |
| `assets/js/main-theme.js` | Update `initResearchFeatures()` to use new `.rsb` class names and replace toggle/overlay logic with pull-tab open/close |
| All 8 `research/*.html` | Replace `<aside class="research-sidebar...">` + toggle button with new `<aside class="rsb">` structure |

## Out of Scope

- The reading progress bar, hero metrics, section styles, and all other research page styles are unchanged
- The desktop layout (`research-layout` grid) is unchanged — only the sidebar itself changes
- No changes to `index.html` or `main-theme.css`
