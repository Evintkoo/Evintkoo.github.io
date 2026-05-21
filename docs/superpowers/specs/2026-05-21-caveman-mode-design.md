# Caveman Mode — Design Spec

**Date:** 2026-05-21
**Scope:** All 14 pages under `/research/`
**Status:** Approved

## Summary

Add a sitewide toggle that swaps formal research prose to a caveman/brainrot tone on every research page. Mirrors the existing theme toggle: one nav button, `localStorage`-backed, applied before paint via an HTML class to avoid flash-of-formal-content. Hand-authored alternates per prose element. Untranslated elements gracefully fall back to formal.

## Goals

- Make research pages re-readable in a playful "caveman" register for fun / accessibility-as-comedy.
- Zero impact when toggle is off (no extra HTTP, no layout shift, no visible markers).
- Persist user choice across pages and reloads.
- Leave the "academic skeleton" intact (headings, section nav, tables, formulas, mindmap, paper meta).

## Non-Goals

- No algorithmic transformation, no runtime LLM, no build step. All caveman text is hand-authored into the HTML.
- No styling shift in caveman mode (no font swap, no badge, no color change).
- No translation of headings, table data, formulas, sidebar labels, mindmap nodes, paper meta box.
- No mobile-specific placement or interaction — toggle inherits the existing `.nav__actions` responsive behavior.

## User Experience

1. User loads any research page in formal mode (default).
2. User clicks the club-icon button in the nav (immediately left of the theme toggle).
3. Prose blocks in the hero subtitle, research sections, highlight boxes, and hypothesis boxes swap to caveman text. Everything else is unchanged.
4. State is saved. Navigating to another research page (or reloading) preserves caveman mode.
5. Clicking the toggle again reverts to formal.

## Architecture

Three pieces:

1. **Markup convention** — paired sibling elements per prose unit, both present in the DOM, one hidden via CSS.
2. **CSS** — three rules in `assets/css/research.css` that flip visibility based on `<html class="caveman">`.
3. **JS** — additions to `assets/js/main-theme.js`: a pre-paint IIFE that reads `localStorage` and applies the class synchronously, plus toggle wiring inside the existing main IIFE.

### Markup convention

Each prose unit gains a sibling with the caveman alternate. Both have a base class `prose`; the caveman version adds `prose--caveman`.

```html
<p class="prose">BTC is a risk diversifier, not a return maximizer.</p>
<p class="prose prose--caveman">Big stonk BTC no make number go up. It keep rock pile no fall down.</p>
```

**Translated elements:**
- `<p>` inside `.research-section .content-text`
- `<li>` inside `.content-text > ul` (and `> ol`)
- `<p>` inside `.research-highlight .highlight-content`
- `<p>` inside `.hypothesis-box`
- `.hero__subtitle` (single element, paired sibling)

**Untouched elements:**
- All headings (`h1`–`h4`), including `.research-section__title`, `.hero__title`, box `<h3>`/`<h4>` labels.
- The right-side research sidebar (`.rsb`) and its links.
- Paper meta box (`.paper-meta-box`) — author, date, action buttons.
- All tables (`.performance-table`) and their cells.
- Math formulas (anything containing `<sub>`/`<sup>` for variables — e.g., FRC<sub>BTC</sub>).
- Method-card numbers (`.method-number`) and titles, but `.method-content > p` IS translated.
- Mindmap nodes (`#mindmap-svg-container` content, rendered by `mindmap.js`).
- Buttons, nav, footer.

**Fallback:** If a `.prose` element exists without a paired `.prose--caveman` sibling, the formal one remains visible in caveman mode. This is a safety net — the rollout translates all 14 pages, so the fallback only triggers if a future addition forgets the pairing.

**Inline HTML inside prose:** Both versions can contain `<strong>`, `<em>`, `<a>`, `<code>`, `<sub>`, `<sup>`. Authors are encouraged to keep equivalent emphasis (bolded key terms) in both versions.

### CSS

Add to `assets/css/research.css`:

```css
.prose--caveman { display: none; }
html.caveman .prose:not(.prose--caveman) { display: none; }
html.caveman .prose--caveman { display: revert; }
```

`display: revert` restores the user-agent default for the element type (so `<li class="prose--caveman">` becomes a list item, `<p>` becomes a block). No other style changes — typography, spacing, colors all inherit unchanged.

### JS — flash prevention + toggle

`main-theme.js` is loaded with `defer`, which means its top-level IIFE runs after HTML parsing — too late to prevent a flash of formal prose, because the browser may already have painted. So the flash-prevention IIFE goes inline in the `<head>` of each research page, while the toggle wiring stays in `main-theme.js`.

**Pre-paint inline `<script>`** added to each research page `<head>`, *before* any stylesheet `<link>`:

```html
<script>
  if (localStorage.getItem('caveman') === '1') {
    document.documentElement.classList.add('caveman');
  }
</script>
```

This runs synchronously during head parsing, so by the time the body is parsed and the CSS rules match, `<html class="caveman">` is already set and the formal prose never paints.

**Toggle wiring** (inside the existing main IIFE in `main-theme.js`, after the existing `themeToggle` block):

```js
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
    localStorage.setItem('caveman', on ? '1' : '0');
    syncCaveman();
  });
}
```

### Toggle button HTML

Insert into `.nav__actions` on every research page, **before** `#themeToggle`:

```html
<button class="caveman-toggle" id="cavemanToggle" aria-label="Toggle caveman mode" aria-pressed="false" title="Caveman mode">
  <svg class="caveman-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 20l6-6"/>
    <path d="M14 4c3 0 6 3 6 6s-3 6-6 6-6-3-6-6 3-6 6-6z"/>
    <path d="M11 7l2 2"/>
  </svg>
</button>
```

Sized to match `.theme-toggle` (same width/height, same hit area).

CSS additions to `assets/css/main-theme.css`, placed immediately after the `.theme-toggle` block (currently starting at line 568) so the two button styles live together:

```css
.caveman-toggle {
  /* mirror the .theme-toggle reset: background, border, padding, cursor, color, size */
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 0; cursor: pointer; color: inherit;
  padding: 8px;
}
.caveman-toggle .caveman-icon { width: 20px; height: 20px; }
.caveman-toggle.is-active .caveman-icon { fill: currentColor; }
```

The active state fills the club's bulb to indicate "on". Implementation reads the actual `.theme-toggle` rule to copy exact width/height/padding values so the two buttons align visually.

## Voice Guide for Caveman Translations

To keep the tone coherent across 14 pages:

**Sentence shape**
- Short sentences. One idea per sentence.
- Present tense, active voice.
- Drop articles ("the", "a") often but not always.
- First person plural ("Ugg see", "we look") or impersonal ("rock pile shake").

**Domain swaps** (use consistently within a page; pages can diverge by topic)
- "portfolio" → "rock pile"
- "model" / "framework" → "thinky-rock" / "big think"
- "gene" / "protein" → "tiny instruction" / "tiny worker"
- "neuron" / "activation" → "head-rock" / "head-rock fire"
- "volatility" → "shake"
- "return" / "profit" → "shiny coin"
- "loss" / "drawdown" → "ouch" / "big ouch"
- "optimal" → "best"
- "increases" / "rises" → "go big" / "go up"
- "decreases" / "falls" → "go small" / "go down"
- "evidence" → "Ugg see with eye"
- "hypothesis" → "Ugg think maybe"
- "analysis" → "look hard"
- "framework" → "big plan"

**Brainrot accents** (sparingly — flavor not flood; aim for one per paragraph max)
- "stonk", "no cap", "fr fr", "rizz", "ohio", "lowkey", "lit"
- Don't pile multiple in one sentence.

**Preserve**
- Numbers, percentages, tickers (BTC, SPY, BND), units (%, bps), dates.
- Bold/emphasis on the same key terms as the formal version.
- Inline math notation if present (sub/sup tags).

**Tone**
- Playful but not insulting. The caveman is enthusiastic and earnest, not stupid.
- Never break character with meta-jokes ("oh look, an LLM translated this").
- Keep the same factual claims as the formal text — caveman mode is a register shift, not a content change.

## Authoring Workflow (per page)

For each research page:

1. Scan for the targeted prose containers (see "Translated elements" above).
2. For each prose element, duplicate the line in the HTML source.
3. Add `class="prose"` to the original (or merge into existing class).
4. Add `class="prose prose--caveman"` to the duplicate and rewrite the inner content per the voice guide.
5. Keep both elements visually paired in source (caveman immediately after formal) for editorial clarity.

The 14 pages: `bitcoin-portfolio-allocation`, `circular-rna`, `crypto-stock-timing`, `functional-group-analysis`, `global-gdp-patterns`, `grasp`, `grn-dual-vs-cross-encoder`, `grn-modular-vs-monolithic`, `grn-two-tower`, `keynesian-abm-coordination`, `keynesian-abm-fiscal`, `neuron-activation-analysis`, `p53-mutation`, `som-tsk`.

## Files Changed

- `assets/css/research.css` — three rules added (`.prose--caveman`, two `html.caveman …` selectors).
- `assets/css/main-theme.css` — `.caveman-toggle` button styles, next to existing `.theme-toggle` at line 568.
- `assets/js/main-theme.js` — toggle wiring inside the existing main IIFE.
- `research/*.html` (14 files) — inline pre-paint `<script>` at top of `<head>`, `#cavemanToggle` button in `.nav__actions` before `#themeToggle`, `class="prose"` on existing prose elements, `.prose--caveman` siblings with translated text.

## Edge Cases & Decisions

- **Toggle on non-research pages:** The button is only added to `/research/*.html`. Pages like `index.html`, `about.html`, `projects.html` don't show it. Caveman state in localStorage is harmless when no `.prose` elements exist.
- **Reading progress bar:** No impact — `.prose--caveman` blocks have similar height to their formal siblings; scroll position is preserved on toggle.
- **Mindmap section:** Mindmap nodes are generated by `mindmap.js` from data. Out of scope — node labels stay formal. If users find this jarring later, can be revisited.
- **Print:** `@media print` rules untouched. Caveman state applies to print too; if undesired, add `@media print { html.caveman .prose--caveman { display: none; } html.caveman .prose:not(.prose--caveman) { display: revert; } }` — defer until requested.
- **SEO:** Both formal and caveman text are in the DOM. Search engines see both. Acceptable trade-off; meta description and OG tags remain formal.
- **Accessibility:** `aria-pressed` reflects state. The button has `aria-label` and `title`. Screen readers will hear both text versions in DOM order; if this is a problem, add `aria-hidden="true"` to the hidden version via the CSS rule (`html.caveman .prose:not(.prose--caveman) { display: none; }` already removes from a11y tree because `display: none` hides from assistive tech).

## Testing

- **Smoke:** Load `bitcoin-portfolio-allocation.html` formal → toggle → caveman → reload → still caveman → toggle → formal → reload → still formal.
- **Cross-page persistence:** Toggle on, navigate to `p53-mutation.html`, verify caveman is on.
- **Fallback:** Manually delete a `.prose--caveman` sibling, verify the formal prose remains visible in caveman mode.
- **No flash:** With caveman on, hard-reload and watch for a flicker of formal text. (Run in dev tools network throttle if needed.)
- **No regression in formal:** With caveman off, every page renders exactly as before.
- **Theme + caveman:** Toggle both light theme and caveman mode; ensure both persist independently.
- **Keyboard:** Tab to caveman toggle, Space/Enter toggles. Focus ring matches theme toggle.

## Rollout

Single PR. Infra + all 14 page translations land together. The pre-paint IIFE and CSS rules are inert without `.prose` markup, so the order within the PR doesn't matter — but for review clarity:

1. Add CSS rules and JS.
2. Add toggle button to all 14 pages.
3. Add `class="prose"` to existing prose elements and write `.prose--caveman` siblings, one page at a time.

After landing, the writing-plans skill produces the step-by-step plan.
