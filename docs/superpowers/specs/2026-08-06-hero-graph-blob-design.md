# Design: Data-Driven Hero Graph Blob

**Date:** 2026-08-06
**Status:** Approved

---

## Overview

Replace the hero's abstract, hand-authored icosahedron blob (`assets/js/hero-scene.js`) with a 3D node-link graph built at load time from the site's existing content taxonomy (`window.MINDMAP_DATA`, derived in `assets/js/data.js`). The blob's shape becomes the actual graph of topics → projects/research articles, and stays in sync automatically as entries are added to `data.js` — no separate authoring step.

Clicking the graph expands it into a fullscreen explorer where every node is labeled and clickable, navigating to that project/research page. A back button returns to the normal embedded hero state.

---

## 1. Data Source

No new data modeling. Reuses what already exists:

- `window.SITE_DATA` (`assets/js/data.js`) — every project + research item, each with `id`, `label`, `title`, `href`, `topic`.
- `window.MINDMAP_DATA` (derived in the same file) — `{ center, branches: [{ label, nodes: [itemLabel, ...] }] }`, one branch per topic that has ≥1 item.

`hero-scene.js` will build its node/edge list from `SITE_DATA` directly (not `MINDMAP_DATA`'s label-only branches), since it needs each leaf's `href` and `id` for click-navigation. It replicates the same grouping logic already in `buildMindmap()`: group `projects.concat(research)` by `topic`, one hub per topic with ≥1 member.

**Scope: homepage only.** `#heroCanvas` / `hero-scene.js` is not unique to the homepage — it's the shared ambient background canvas loaded via `.scene-bg` on ~25 pages (every research article, project page, `about.html`, `research.html`, `projects.html`). Only `index.html` loads `data.js`; on every other page `window.SITE_DATA` is undefined, and `SITE_DATA`'s project/research `href`s are root-relative (e.g. `research/grasp.html`), which would resolve incorrectly if clicked from inside `/research/*.html` or `/projects/*.html`. Rather than rolling the graph out site-wide (which would require adding `data.js` to every page and rewriting href resolution for nested folders), this feature ships **homepage-only**: `hero-scene.js` checks for `window.SITE_DATA` at init. When present (index.html only) it builds and renders the new graph with click-to-expand. When absent (every other page), it renders the **original icosahedron blob exactly as it works today** (same geometry, displacement, particles, drag, scroll zig-zag — no expand/click) — so no other page's appearance or behavior changes at all.

---

## 2. Graph Model

| Node type | Count (current data) | Size | Source |
|---|---|---|---|
| Topic hub | 6 (only topics with ≥1 item) | large point | `TOPICS` in `data.js` |
| Article/project leaf | ~25 | small point | `projects.concat(research)` filtered to `topic != null` |

Items with `topic: null` (e.g. `apt-fitness`, `chain-reaction`, `rebirth`, `psychidn`) are **excluded from the graph** — they have no hub to attach to. (Not worth inventing an "Other" hub for four items; if the user later tags them, they'll appear automatically.)

**Edges**: one `LineSegments` segment per leaf → its hub, styled with the existing wire color/opacity from `getThemeColors()`.

**Layout (hero + expanded share the same 3D positions):**
- Hubs placed on a sphere shell of radius `R_hub` (≈ existing `radius`), evenly distributed via a Fibonacci sphere distribution (deterministic, no randomness — `Math.random()` is fine here since this is a one-time layout computation, not per-frame).
- Each leaf placed near its parent hub: offset from the hub position by a small random direction × `R_leaf_offset` (deterministic per-item via a seeded hash of `item.id`, so layout is stable across reloads rather than reshuffling every page load).
- This clustering (tight leaf groups around spaced-out hubs) is what produces the lumpy, blob-like silhouette instead of a uniform sphere.

**Motion (carried over from current implementation, reattached to the new node positions):**
- Per-node jitter using the existing `displace()` layered-sine function, applied to each node's offset from its base position (replaces per-vertex mesh displacement, since there's no fixed mesh anymore).
- Ambient background particles: unchanged.
- Auto-rotation, drag-to-nudge with spring-back, scroll zig-zag: unchanged, applied to the whole group.
- Light/dark theme color swap via existing `MutationObserver`: unchanged.
- `prefers-reduced-motion`: skip jitter/rotation/zig-zag, render a static graph (entrance scale still applies, per current `isReduced` handling).

---

## 3. Click vs. Drag Disambiguation

Currently `mousedown`/`touchstart` on the canvas starts a drag immediately. New behavior:

- On `pointerdown`, record start position + timestamp; do not start dragging yet.
- On `pointermove` past a 4px threshold, begin the existing drag-to-nudge behavior (as today).
- On `pointerup`, if movement stayed under the 4px threshold, treat it as a **click** → trigger expand.
- This replaces the current separate `mousedown`/`touchstart` handlers with a unified pointer-event flow (simplifies mouse+touch into one path).

---

## 4. Expand / Collapse Transition

**Trigger:** click (per §3) anywhere on the canvas, while in the collapsed (hero-embedded) state.

**Expand animation (~700ms eased tween):**
1. Canvas element switches to `position: fixed; inset: 0; z-index: <above nav>` — same overlay pattern as the existing `.nav-overlay` (blurred backdrop layered behind the canvas, `document.body.classList.add('no-scroll')`).
2. Camera animates from its current position/FOV to a pulled-back framing that fits the whole graph in view (tween camera `position.z` and `group.position`/rotation back toward origin/neutral).
3. A back button (fixed, top-left, reusing existing icon-button styling from the site's nav/close-button conventions) fades in.
4. Node labels (HTML overlays, see §5) fade in once the camera tween completes.

**Collapse (back button click):** reverses the tween — labels fade out first, then camera animates back to the hero framing, canvas returns to its normal embedded layout, `no-scroll` removed, backdrop removed.

While expanded: auto-rotation continues (slowly) but drag/zig-zag-from-scroll are suspended (page scroll is locked anyway); dragging in expanded state instead orbits the camera around the graph (reuse the same drag delta math, applied to `group.rotation` directly rather than `position`, since the graph is now centered).

---

## 5. Expanded-State Labels & Interaction

- Every node gets an HTML `<div>` label (absolutely positioned, not SVG/canvas text) — computed each frame via `THREE.Vector3.project(camera)` → NDC → screen pixel coords. Hubs render bold/larger, leaves smaller/dimmer.
- Labels for nodes facing away from the camera or occluded by the graph's own depth are dimmed via a simple depth/facing check (project z or dot product with camera direction) — not full occlusion culling, just enough to avoid overlapping-label clutter on the far side.
- **Hover** (raycasting against leaf node point positions, small hit-radius in screen space): highlight the node (scale up slightly + brighten) and its one edge; cursor becomes `pointer`. Hubs are not clickable (no `href`).
- **Click** on a leaf: `window.location.href = item.href` (same tab).
- Mobile: no hover, tap directly triggers navigation (standard tap = click semantics already handled by §3's pointer flow, since in expanded state there's no drag-to-nudge to disambiguate against — tap-to-navigate is immediate).

---

## 6. Files Touched

| File | Change |
|---|---|
| `assets/js/hero-scene.js` | Rewritten: graph construction from `SITE_DATA`, new layout/motion model, click/drag disambiguation, expand/collapse tween, raycasting + label overlay in expanded state |
| `index.html` | Add container for expanded-state HTML label overlays + back button markup near `#heroCanvas` |
| `assets/css/main-theme.css` (or `components.css`) | Styles for fullscreen canvas overlay state, back button, node label divs (reusing existing backdrop-blur/overlay conventions) |

No changes to `assets/js/data.js` or `assets/js/mindmap.js` — this feature only reads `SITE_DATA`/`MINDMAP_DATA`, doesn't modify them.

---

## 7. Performance & Mobile

- Node/edge counts (~31 nodes, ~25 edges) are small; per-frame label projection and raycasting are cheap even on low-end mobile.
- Existing `isMobile` branch (reduced ambient particle count, lower icosahedron detail — the latter no longer applies since there's no mesh) is kept for particle count and camera FOV/distance tuning.
- Expanded view on mobile: same label treatment, smaller font size to reduce crowding given the smaller viewport.

---

## 8. Testing / Verification Plan

Manual browser verification (this is a visual/interactive feature, not unit-testable in isolation):
- Light and dark theme
- Desktop: drag-to-nudge still works without triggering expand; click cleanly triggers expand
- Mobile: tap-to-expand works; tap-to-navigate works in expanded state
- Scroll zig-zag still smooth in collapsed state
- Expand/collapse animation both directions, back button
- Node click in expanded state navigates to the correct project/research page for a sample of nodes across different topics
- `prefers-reduced-motion`: graph renders static, expand/collapse still functions (can skip the tween easing if needed)
- Adding a new item to `SITE_DATA` (temporarily, for verification) causes it to appear in the graph on next reload without further changes
