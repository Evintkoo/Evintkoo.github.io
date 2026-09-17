# Content & Wireframe Parity QA Checklist

Task 29 of `docs/superpowers/plans/2026-09-16-astro-rebrand.md`. Every page checked against
its pre-migration source (legacy files, still present in the working tree at QA time) for
1:1 content and wireframe parity, per the binding rule in
`docs/superpowers/specs/2026-09-16-astro-rebrand-design.md` §11.

Legend: ✅ pass (no changes needed) · 🔧 fixed during this QA pass (now passing)

## Root pages (4/4)

| Page | Content parity | Wireframe parity | Notes |
|---|---|---|---|
| `/` (homepage) | 🔧 | 🔧 | Was a near-empty stub — missing the projects grid, research list, topic mindmap, experience section, about/tech-stack section, and closing CTA; hero copy had also been shortened. Fully rebuilt. Root cause: the original plan's own homepage template was itself incomplete and no later task revisited it. |
| `/about` | ✅ | ✅ | Already a thorough, verbatim migration — no changes needed. |
| `/projects` | 🔧 | 🔧 | Missing the featured Kolosal AI card, tech tags, and repo/paper links per project (data existed in frontmatter, just wasn't rendered). |
| `/research` | 🔧 | 🔧 | Missing `metaLabel`/`metaValue` badges per item; 3 titles corrected to use the source's shorter listing title via a new `shortTitle` field. |

**Shared components fixed alongside root pages:** `Footer.astro` (was using one source page's outlier wording site-wide instead of the 3-page majority pattern), `Nav.astro` (missing the "Get in touch" CTA link present on every source page).

**Disclosed, deliberately unfixed:** the homepage's combined search+tag-filter "Explore" bar with paginated research list, and the projects/research listing pages' drag-and-drop tag-filter dock + mobile filter sheet. Both are substantial net-new interactive builds, not dropped facts — every underlying fact/link/tag is present and browsable, just not filterable/paginated. See the project ledger for the full ruling.

## Project pages (10/10)

| Page | Content parity | Wireframe parity |
|---|---|---|
| torch-inference | ✅ | ✅ |
| kolosal-automl | ✅ | ✅ |
| apt-fitness | ✅ | ✅ |
| chain-reaction-simulation | ✅ | ✅ |
| faction-app | ✅ | ✅ |
| tribe-playground | ✅ | ✅ |
| orderflow-rs | ✅ | ✅ |
| psychidn | ✅ | ✅ |
| rebirth | ✅ | ✅ |
| som-plus | ✅ | ✅ |

All 10 pages passed with zero fixes needed on this QA pass.

## Research pages (14/14)

| Page | Content parity | Wireframe parity | Notes |
|---|---|---|---|
| keynesian-abm-fiscal | ✅ | ✅ | |
| keynesian-abm-coordination | ✅ | ✅ | |
| som-tsk | ✅ | ✅ | |
| grasp | 🔧 | 🔧 | Generic "Methods"/"Discussion" headings replaced with source's actual "Pipeline"/"Theoretical Analysis" titles; one fabricated intro sentence (no source counterpart) removed. |
| grn-dual-vs-cross-encoder | ✅ | ✅ | |
| grn-modular-vs-monolithic | ✅ | ✅ | |
| grn-two-tower | ✅ | ✅ | |
| circular-rna | ✅ | ✅ | |
| functional-group-analysis | 🔧 | 🔧 | "Methods" → "Methodology"; "References" promoted from h3 back to h2 to match source. |
| global-gdp-patterns | ✅ | ✅ | |
| crypto-stock-timing | ✅ | ✅ | |
| bitcoin-portfolio-allocation | ✅ | ✅ | Largest source page (1378 lines) — fully verified including chart formulas and every data table. |
| neuron-activation-analysis | 🔧 | 🔧 | Invented "Discussion" heading (no source counterpart) replaced with the actual "Theory Evaluation" section title. |
| p53-mutation | 🔧 | 🔧 | "Methods" → "Research Methods"; "Results" → "Key Findings"; "References" promoted from h3 back to h2. |

## False positives investigated and disproven

An earlier, less-rigorous review pass claimed 4 pages' `tagline` fields were paraphrased from
source: torch-inference, kolosal-automl, grn-two-tower, and circular-rna. All 4 were
independently re-verified character-for-character against source during this QA pass and
found to be exactly verbatim — the original claim was a mis-verification (in circular-rna's
case, traced to comparing against the wrong source element). No fix was needed for any of
the 4; this is recorded here so the false claim isn't mistaken for an open item.

## Build verification

`npm run build` — 28 pages, 0 errors, confirmed after every fix in this pass.
