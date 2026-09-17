# Project Screenshot Gather — Manifest

Generated 2026-09-17. Result: **no images copied.** Every reachable source repo was
checked (README embeds + common screenshot folders + full `git ls-files` image scan,
so gitignored/build-only files don't hide anything), and none contained a genuine,
already-committed UI/output screenshot. Where images did exist, they were logos,
framework-boilerplate icons, CI badges, or decorative stock photography — all
explicitly out of scope per the task brief. No app was run/built to generate new
screenshots, per instructions.

## 1. apt-fitness.mdx — APT Fitness Assistant
- Repo per frontmatter: `https://github.com/Evintkoo/APT-Fitness-Assistant`
- **Not found.** `git ls-remote` returns "Repository not found" (tried exact
  case, lowercase, and underscore variants). GitHub search for the repo name
  under Evintkoo/KolosalAI returns nothing. Likely renamed, deleted, or made
  private. No screenshots obtainable.

## 2. chain-reaction-simulation.mdx — Chain Reaction Simulation
- Repo: `https://github.com/Evintkoo/chain_reaction_simulation`
- Already cloned at `~/Documents/projects/evint/chain_reaction_simulation`.
- `git ls-files` shows **zero tracked images** (no png/jpg/gif/webp/svg) and no
  screenshot/media/.github image folders. README has no `![...]` image embeds.
- Note: `data/plots/combustion/*.png` exist on disk in the local clone (10
  matplotlib-style analysis charts) but are **untracked** — not part of the
  actual repo history, so not used (would misrepresent what's really in the repo).
- Result: nothing found.

## 3. faction-app.mdx — Faction: Stock Analysis App
- Repo: `https://github.com/Evintkoo/FactionApp`
- Already cloned at `~/Documents/projects/evint/FactionApp`.
- Tracked images: Tauri app icons (`app/src-tauri/icons/*`), default
  `tauri.svg`/`vite.svg`/`react.svg` boilerplate, and 3 files under
  `static/images/` (`campaign-hero.jpg`, `campaign-technical.jpg`,
  `campaign-fundamental.jpg`). Checked these directly — they're generic stock
  photography of a candlestick chart on a screen, used as decorative hero/card
  backgrounds on the `docs/index.html` marketing landing page, not actual
  screenshots of the app's own UI.
- Result: nothing found (only logos/icons/stock photos, all excluded by brief).

## 4. kolosal-automl.mdx — Kolosal AutoML Platform
- Repo per frontmatter: `https://github.com/KolosalAI/kolosal_automl`, which
  redirects (301) to `https://github.com/Evintkoo/automl` — already cloned at
  `~/Documents/projects/evint/automl`, confirmed same repo.
- `git ls-files` shows **zero tracked images** of any kind. README has only
  Rust/License shields.io badges, no screenshots.
- Result: nothing found.

## 5. orderflow-rs.mdx — orderflow-rs
- Repo: `https://github.com/Evintkoo/orderflow-rs`
- Already cloned at `~/Documents/projects/evint/orderflow-rs`.
- `git ls-files` shows **zero tracked images**. No README image embeds.
- Result: nothing found.

## 6. psychidn.mdx — PsychIDN Community
- No `repo:` field in frontmatter (confirmed).
- Searched GitHub (`api.github.com/search/repositories?q=psychidn`) — **zero
  results**. No plausible repo under github.com/Evintkoo or github.com/KolosalAI.
- Per instructions, did not guess/fabricate a URL.
- Result: no source repo found.

## 7. rebirth.mdx — Rebirth Educational Platform
- No `repo:` field in frontmatter (confirmed). MDX content itself describes the
  platform as "currently in development" with no repo/tech listed.
- Searched GitHub broadly. Found one superficially similar-named repo,
  `callixtafidelia/rebirdth` ("A platform by Indonesian students... research
  stories, scholarship insights... OPSI, OSN alumni & BIM scholars"), but it is
  owned by a different GitHub user, its description doesn't match the specific
  mentorship/course platform described in the mdx, and there's no confirmed
  link to Evintkoo as the creator. Too uncertain to treat as the right repo —
  not used, per the "don't fabricate" instruction.
- Result: no source repo found.

## 8. som-plus.mdx — SOM Plus Clustering
- Repo: `https://github.com/Evintkoo/SOM_plus_clustering`
- Already cloned at `~/Documents/projects/evint/SOM_plus_clustering`.
- Tracked images: `som-ui/public/images/logo-dark.png` and `logo-light.png`
  only (project wordmark/logo, not a screenshot). README has only
  crates.io/docs.rs/CI shields.io badges.
- Result: nothing found (only a logo, excluded by brief).

## 9. torch-inference.mdx — PyTorch Inference Framework
- Repo per frontmatter: `https://github.com/KolosalAI/torch-inference`, which
  redirects (301) to `https://github.com/Evintkoo/torch-inference` — already
  cloned at `~/Documents/projects/evint/torch-inference`, confirmed same repo.
- Tracked images: only `tests/e2e/fixtures/test.jpg` (a Playwright test fixture
  image, not a product screenshot). README has no image embeds.
- Note: the local clone also has untracked Playwright test-failure captures
  under `tests/playwright/results/**/test-failed-1.png` and two loose files at
  repo root (`bw-verify.png`, `bw-theme-light.png`, 1200px wide) — none of
  these are committed to git; they're artifacts of prior local test/agent runs,
  not real repo screenshots, so excluded.
- Result: nothing found.

## 10. tribe-playground.mdx — TRIBE v2: Neural Prediction Workstation
- Repo: `https://github.com/Evintkoo/tribe-playground`
- Already cloned at `~/Documents/projects/evint/tribe-playground`.
- No README file exists in the repo at all. `git ls-files` shows **zero
  tracked images**.
- Result: nothing found.

---

**Net outcome:** 0 of 10 projects yielded usable screenshots. 8 repos were
reachable and thoroughly checked (git-tracked file listing + README embeds +
common screenshot/media folder names); all 8 contain only logos, app icons,
framework boilerplate, CI badges, or unrelated stock photography — no actual
product screenshots were ever committed to any of these repositories. 2
projects (psychidn, rebirth) have no discoverable source repo. 1 project
(apt-fitness) has a repo URL in its frontmatter that no longer resolves on
GitHub.
