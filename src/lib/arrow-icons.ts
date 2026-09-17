// Shared arrow icon markup — replaces the site's plain Unicode arrow glyphs
// (&rarr; →, &nearr; ↗), whose stroke weight/shape rendered inconsistently
// against the surrounding mono type across platforms/fonts (user feedback:
// "i dont like that arrow icon"). Two variants, matching the stroke style
// already used for the "Read Paper →" link in research/[slug].astro:
// - `right`: same-page/internal navigation ("Learn More", "See my work")
// - `external`: opens a new tab (external links, repo/paper links)
export const ARROW_RIGHT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

export const ARROW_EXTERNAL =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M17 7H8M17 7v9"/></svg>';
