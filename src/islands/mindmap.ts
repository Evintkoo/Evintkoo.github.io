// ─────────────────────────────────────────────
//  Mindmap — per-page topic concept graph
//  Renders an SVG horizontal dendrogram: center →
//  topic branches → leaf nodes (project/research
//  entries), each leaf given its own dedicated row
//  so labels never overlap regardless of how many
//  leaves a branch has (replaces the old radial
//  fan-out layout, which crowded/overlapped labels
//  once a branch had more than a few leaves).
//  Leaves render as clickable note cards (title +
//  short description), connected by curved paths.
//  Data is computed server-side (see
//  src/pages/research/[slug].astro / src/pages/index.astro).
// ─────────────────────────────────────────────

import { initCanvasStatus } from './canvas-status';

export interface MindmapLeaf {
  title: string;
  // Cross-note connections are modeled directly on PlanOut's own inline
  // "inode" markup (`parseInlineNodes` in lib/flow/parse-inline-nodes.ts):
  // a linked phrase is written straight into the sentence, wrapped in
  // `<inode id="TARGET">phrase</inode>` — NOT a separate "Related: <label>"
  // row appended after the description, and NOT one shared link for the
  // whole card. Each `<inode>` carries its OWN `id`, so a description can
  // contain several distinct `<inode>` spans, each one highlighted phrase
  // connecting to a different node, exactly like PlanOut's own notes.
  // `appendNote` parses every `<inode>` in the description and renders each
  // as its own highlighted, dotted-underline connection point in place,
  // mid-sentence, exactly where it was written — there is no separate
  // label; the highlighted phrase itself is the label.
  //
  // `TARGET` resolves against whichever of this leaf's own two identifiers
  // the *other* leaf used: `href` (a real page, for cross-page connections
  // like the two Keynesian ABM papers referencing each other) or `id` (an
  // internal-only slug with no page of its own, for connections between
  // leaves inside the SAME map — e.g. one branch of a paper's own
  // methodology breakdown referencing another). Both populate the same
  // lookup table (`hrefToPos` in `render()`), so `wireInlineConnections`
  // doesn't need to know or care which kind of identifier it's chasing.
  description?: string;
  // GitHub repo URL, e.g. "https://github.com/Evintkoo/aegis" — only set on
  // project leaves with a `repo:` frontmatter field. When present,
  // appendNote tags the rendered card with data-canvas-repo so
  // src/islands/canvas-status.ts can inject a live status pill.
  repo?: string;
  href?: string;
  id?: string;
}

export interface MindmapBranch {
  label: string;
  description?: string;
  nodes: MindmapLeaf[];
}

export interface MindmapData {
  center: string;
  // A header with no body at all reads as a broken/unfinished card (just a
  // floating color strip) — every other node in the map has a description,
  // so the root needs one too for the same two-part card anatomy.
  centerDescription?: string;
  branches: MindmapBranch[];
}

// Every node — root, branch hub, leaf — is the same rectangular note card
// (PlanOut has no separate "circle" node type; `flow-note-node.tsx` is a
// `bg-white rounded-lg` card no matter what it represents). Edges connect
// directly card-edge to card-edge, with a small on-border handle dot at
// each attachment point — PlanOut's `!size-2` `<Handle>` markers sitting
// exactly on the card's border — never a dot floating off to the side with
// its own dashed leader, which let lines cut behind unrelated cards instead
// of visibly starting/ending on a node.
const CENTER_NOTE_X = 24;
const CENTER_NOTE_W = 220;
const ROOT_HANDLE_X = CENTER_NOTE_X + CENTER_NOTE_W;
const HUB_GAP = 84;
const HUB_NOTE_X = ROOT_HANDLE_X + HUB_GAP;
const HUB_NOTE_W = 200;
const HUB_HANDLE_X = HUB_NOTE_X + HUB_NOTE_W;
const LEAF_GAP = 84;
const NOTE_X = HUB_HANDLE_X + LEAF_GAP;
const NOTE_W = 300;
const NOTE_H = 78;
const RIGHT_PAD = 48;
const W = NOTE_X + NOTE_W + RIGHT_PAD;
const HANDLE_R = 4;
const BRANCH_GAP = 44;
const PAD_Y = 40;
const ROW_GAP = 18;

// Every note's height is measured from its actual title/description text,
// never clamped/truncated — a fixed NOTE_H (the old behavior) either cuts
// off anything longer than ~2 lines or wastes space on anything shorter.
// `wrapLineCount` uses a scratch <canvas> 2D context's `measureText` (the
// same technique browsers use internally for text layout) to count real
// wrapped lines at the card's actual font/width, so the height reserved
// for each card — and the row spacing derived from it — matches what will
// actually render, whether that's one line or six.
let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    measureCtx = ctx;
  }
  return measureCtx;
}

function wrapLineCount(text: string, font: string, maxWidth: number): number {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const ctx = getMeasureCtx();
  ctx.font = font;
  const spaceWidth = ctx.measureText(' ').width;
  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = ctx.measureText(word).width;
    if (lineWidth === 0) {
      lineWidth = wordWidth;
    } else if (lineWidth + spaceWidth + wordWidth > maxWidth) {
      lines++;
      lineWidth = wordWidth;
    } else {
      lineWidth += spaceWidth + wordWidth;
    }
  }
  return lines;
}

// Mirrors the card's actual CSS box model (see the `.mindmap-note__header`/
// `.mindmap-note__body` rules in global.css) so the estimate lines up with
// what the browser will really lay out. A small `+1` line of slack on the
// description absorbs the measurement's inherent approximation (canvas
// `measureText` vs. the browser's own text shaper can differ by a
// sub-pixel per glyph, which is enough to occasionally push real wrapping
// one line further than the estimate) — a little extra card height is a
// far cheaper mistake than clipping the sentence the user asked never be
// truncated.
const HEADER_V_PAD = 10; // 5px top + 5px bottom (.mindmap-note__header)
const BODY_V_PAD = 12; // 6px top + 6px bottom (.mindmap-note__body)
const CARD_BORDER_V = 2; // header's border-bottom + body's border-bottom
const CARD_H_PAD = 20; // 10px left + 10px right, header and body alike
const TITLE_LINE_H = 15.6; // 12px, line-height 1.3
const DESC_LINE_H = 14.7; // 10.5px, line-height 1.4

// The live canvas-status pill (src/islands/canvas-status.ts) sits in the
// card header next to the title and is injected at runtime, AFTER this
// function has already frozen the card's height from a pill-less title
// measurement. Reserving this width up front for any leaf that CAN get a
// pill (entry.repo is set) means the title wraps as if the pill were
// already there, so the frozen height never comes up short. Only the
// longest label ("In Progress") plus its dot/padding/border and the
// header's own gap needs reserving — worth a little unused slack on
// leaves that never publish canvas/data.json, far cheaper than clipping
// text in a box that can't grow (see the file's own no-truncation
// guarantee above).
const STATUS_PILL_RESERVE_W = 110;

function estimateNoteHeight(title: string, description: string | undefined, width: number, reservePillWidth = false): number {
  const bodyFont = css('--font-body').trim() || 'system-ui, sans-serif';
  const textWidth = width - CARD_H_PAD;
  const titleWidth = reservePillWidth ? textWidth - STATUS_PILL_RESERVE_W : textWidth;
  const titleLines = Math.max(1, wrapLineCount(title, `600 12px ${bodyFont}`, titleWidth));
  const plainDesc = description ? description.replace(/<inode\s+id="[^"]+">([\s\S]*?)<\/inode>/g, '$1') : '';
  const descLines = plainDesc ? wrapLineCount(plainDesc, `10.5px ${bodyFont}`, textWidth) + 1 : 0;
  const headerH = HEADER_V_PAD + titleLines * TITLE_LINE_H;
  const bodyH = descLines > 0 ? BODY_V_PAD + descLines * DESC_LINE_H : 0;
  return Math.max(NOTE_H, Math.ceil(headerH + bodyH + CARD_BORDER_V));
}

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) {
    if (Object.prototype.hasOwnProperty.call(attrs, k)) {
      e.setAttribute(k, String(attrs[k]));
    }
  }
  return e;
}

// Note card — an HTML card (title + description) embedded via
// <foreignObject> so it gets real text wrapping/line-clamping. Shared by
// both leaf notes (project/research entries) and hub notes (topic
// categories) — every node in the tree gets the same dot-plus-note
// treatment, not just the leaves.
//
// Cards with an `href` are NOT themselves a link: now that the map is a
// pan/zoom canvas (see `setupPanZoom`), a plain click on a card is exploring
// the canvas, not necessarily "leave this page" — per live-preview QA
// feedback after the canvas landed. A click instead opens a small "Go to
// page" popup (`showGoToPopup`) with the actual navigation link, mirroring
// PlanOut's own note card: its header carries a dedicated "Open" icon
// button rather than making the whole card a navigate-away target.
function appendNote(
  parent: SVGElement,
  entry: MindmapLeaf,
  x: number,
  y: number,
  width: number,
  height: number,
  delay: number,
  showGoToPopup: (card: Element, href: string, title: string) => void,
  modifier?: string,
): void {
  const fo = svgEl('foreignObject', {
    x,
    y: y - height / 2,
    width,
    height,
    class: 'mindmap-note-anim',
    style: 'animation-delay:' + delay + 'ms',
  });
  const hasLink = !!entry.description && /<inode\s+id="/.test(entry.description);
  const classes = ['mindmap-note'];
  if (modifier) classes.push(modifier);
  if (hasLink) classes.push('mindmap-note--linked');
  if (entry.href) classes.push('mindmap-note--clickable');
  const card = document.createElement('div');
  card.className = classes.join(' ');
  if (entry.repo) card.dataset.canvasRepo = entry.repo;
  if (entry.href) {
    const href = entry.href;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.addEventListener('click', (e) => {
      // The inline "Related: <term>" span is its own connection point, not
      // part of "open this card" — let its own click (which does nothing
      // itself today, only hover) pass through undisturbed.
      if ((e.target as HTMLElement).closest('.mindmap-inode')) return;
      showGoToPopup(card, href, entry.title);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showGoToPopup(card, href, entry.title);
      }
    });
  }
  // Two-part anatomy (tinted header strip + bordered body), not a flat
  // single-surface box — matches the actual card shape PlanOut's own note
  // node renders (`flow-note-node.tsx`'s header + `flow-note-node.tsx`'s
  // inner bordered description panel), just recolored for this site's dark
  // theme instead of PlanOut's light pastel palette.
  const header = document.createElement('div');
  header.className = 'mindmap-note__header';
  const title = document.createElement('div');
  title.className = 'mindmap-note__title';
  title.textContent = entry.title;
  if (entry.repo) title.dataset.canvasTitle = '';
  header.appendChild(title);
  if (entry.repo) {
    const statusSlot = document.createElement('span');
    statusSlot.dataset.canvasStatusSlot = '';
    header.appendChild(statusSlot);
  }
  card.appendChild(header);

  if (entry.description) {
    const body = document.createElement('div');
    body.className = 'mindmap-note__body';
    const desc = document.createElement('div');
    desc.className = 'mindmap-note__desc';
    if (entry.repo) desc.dataset.canvasDescription = '';
    if (hasLink) {
      // `<inode id="HREF">highlighted phrase</inode>` inside the
      // description text itself becomes an inline connection point exactly
      // where it's written — not a label bolted on after the sentence, and
      // each `<inode>` carries its own target, so a description can link
      // several distinct phrases to several distinct nodes (PlanOut's own
      // inline-node parsing — see `parseInlineNodes` in
      // lib/flow/parse-inline-nodes.ts — never shares one target across
      // every highlighted span in a note).
      let lastIndex = 0;
      for (const match of entry.description.matchAll(/<inode\s+id="([^"]+)">([\s\S]*?)<\/inode>/g)) {
        const [full, href, text] = match;
        const start = match.index ?? 0;
        if (start > lastIndex) {
          desc.appendChild(document.createTextNode(entry.description.slice(lastIndex, start)));
        }
        const inode = document.createElement('span');
        inode.className = 'mindmap-inode';
        inode.dataset.linkHref = href;
        inode.textContent = text;
        inode.tabIndex = 0;
        inode.setAttribute('role', 'button');
        inode.setAttribute('aria-label', `Find connected card: ${text}`);
        desc.appendChild(inode);
        lastIndex = start + full.length;
      }
      if (lastIndex < entry.description.length) {
        desc.appendChild(document.createTextNode(entry.description.slice(lastIndex)));
      }
    } else {
      desc.textContent = entry.description;
    }
    body.appendChild(desc);
    card.appendChild(body);
  }
  fo.appendChild(card);
  parent.appendChild(fo);
}

// One "Go to page" confirm popup per mindmap instance, shared by every
// clickable card/dot (not one popup element per node) — created once in
// `render()` and positioned over whichever card was last clicked. Plain
// HTML (not SVG), so its screen position is set directly from the card's
// `getBoundingClientRect()` and never has to account for the canvas's own
// pan/zoom transform.
function createGoToPopup(container: HTMLElement): (card: Element, href: string, title: string) => void {
  const popup = document.createElement('div');
  popup.className = 'mindmap-goto-popup';
  popup.setAttribute('role', 'dialog');
  const label = document.createElement('span');
  label.className = 'mindmap-goto-popup__label';
  const link = document.createElement('a');
  link.className = 'mindmap-goto-popup__link';
  link.appendChild(document.createTextNode('Go to page'));
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('viewBox', '0 0 24 24');
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', 'currentColor');
  arrow.setAttribute('stroke-width', '2');
  arrow.setAttribute('stroke-linecap', 'round');
  arrow.setAttribute('stroke-linejoin', 'round');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.innerHTML = '<path d="M5 12h14M12 5l7 7-7 7"/>';
  link.appendChild(arrow);
  popup.appendChild(label);
  popup.appendChild(link);
  container.appendChild(popup);

  let activeCard: Element | null = null;

  function hide(): void {
    popup.classList.remove('is-open');
    if (activeCard) activeCard.classList.remove('mindmap-note--active');
    activeCard = null;
  }

  function show(card: Element, href: string, title: string): void {
    if (activeCard === card) {
      hide();
      return;
    }
    if (activeCard) activeCard.classList.remove('mindmap-note--active');
    activeCard = card;
    card.classList.add('mindmap-note--active');
    label.textContent = title;
    link.href = href;
    const cardRect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    popup.style.left = cardRect.left - containerRect.left + cardRect.width / 2 + 'px';
    // Flip above the card when there isn't room below, so the popup never
    // renders clipped by the canvas's own `overflow: hidden` edge.
    const opensBelow = cardRect.bottom + 56 < containerRect.bottom;
    popup.classList.toggle('mindmap-goto-popup--above', !opensBelow);
    popup.style.top = (opensBelow ? cardRect.bottom - containerRect.top + 8 : cardRect.top - containerRect.top - 8) + 'px';
    popup.classList.add('is-open');
  }

  // Click/scroll/pan/zoom anywhere else dismisses it — a stale popup
  // pointing at a card that's since panned out from under it would be
  // actively misleading, and container clicks already carry `stopPropagation`
  // from the card's own listener so this only fires for genuine "elsewhere".
  document.addEventListener('click', (e) => {
    if (activeCard && !popup.contains(e.target as Node) && !activeCard.contains(e.target as Node)) hide();
  });
  container.addEventListener('mindmap:viewport-change', hide);

  return show;
}

// Length/half-width of the directional arrowhead drawn at the target note's
// edge — same shape (2:1 length:half-width triangle) as PlanOut's
// `flow-edge-arrowhead.tsx`. The map's default fit-to-content zoom sits
// around 0.5x, so these are sized in SVG user-space units to still read as
// a clear triangle (not a smudge) at that scale.
const INODE_ARROW_LENGTH = 14;
const INODE_ARROW_HALF_WIDTH = 7;

// Not part of the PlanOut port: a top/bottom approach's own arrow inset
// alone (`INODE_ARROW_LENGTH`, 14px) nearly fills `ROW_GAP` (18px, the
// space between two vertically stacked cards in the same column) — the
// full-size arrow has nowhere to fit without visibly poking into whichever
// card sits next in that direction, regardless of how small the anchor step
// is trimmed. A smaller arrow just for that approach, sized to actually fit
// within the row gap with a couple px to spare, is the only way to keep it
// looking like "arriving at this card" instead of "overlapping the next
// one".
const ROW_ARROW_LENGTH = 6;
const ROW_ARROW_HALF_WIDTH = 3;

// Cross-reference connectors are a narrow, deliberate exception to the
// single-`--accent` token system: when two or
// more highlighted phrases land near the same row, or two or more arrows
// converge on the same target card, a single shared color makes them read
// as one smeared connection instead of distinct ones — exactly the "just 4
// points" complaint a cramped, same-color stack produces. Each connector
// gets its own color from this small fixed palette (cycled by index, not
// theme-driven), independent of branch/tree-line coloring.
const INODE_COLORS = ['#5b7fff', '#ff9f5b', '#5bffcf', '#d95bff', '#ffe45b', '#5bc8ff'];

// ── Ported directly from PlanOut's own edge-routing/handle-assignment code
// (read from the local reference clone at
// planout2/planout.ai/{lib/flow/edge-realign.ts,orthogonal-edge.ts,
// components/flow/nodes/flow-note-node-inline-handles.tsx}), rather than a
// bespoke approximation of it. PlanOut picks a connector's side per-edge —
// event-driven there (whichever side a manual drag connected to, re-picked
// by `computeEdgeHandles`/`dominantAxis`/`sideToward` only when a node is
// dropped) — but every node on this static map is permanently in its final
// position, so it's always in exactly the state PlanOut's own auto-realign
// would settle it into: this ports that settled computation directly,
// run once at render time.
type Side = 'top' | 'right' | 'bottom' | 'left';
type Box = { x: number; y: number; halfW: number; halfH: number };

// The axis a connection should run along: whichever axis the two card boxes
// are most SEPARATED on (the signed gap between them), not whichever axis
// their centers differ most on — two cards that overlap on X but sit apart
// on Y (every same-column leaf-to-leaf reference on this map) connect
// vertically even though a naive "which side is the target's center on"
// check would still say "left" (`edge-realign.ts`'s `dominantAxis`).
//
// This is exactly why a root or hub's box uses its own children's combined
// vertical span as `halfH` (`territoryHalfH`, set in `render()`), not its
// own short rendered card height: on PlanOut's free canvas a node's box IS
// just its own rendered size, because a user drags every node into place
// individually. Root and hub here are auto-laid-out trunks whose children
// can land hundreds of px away vertically purely because they're deep in a
// long branch list — fed only their own few-line card height, `sepY` reads
// as enormous next to the gap to the next column (`sepX`), so nearly
// every root→hub / hub→leaf link would resolve to the vertical axis and
// bunch into one dense bundle hugging the card, though every child is
// genuinely one column over, not stacked underneath it. Widening the box to
// the territory it actually presides over restores the intent the algorithm
// has no way to see otherwise: this card's reach spans its whole branch, so
// a child inside that span isn't "vertically separated" from it at all.
function dominantAxis(a: Box, b: Box): 'x' | 'y' {
  const sepX = Math.abs(b.x - a.x) - (a.halfW + b.halfW);
  const sepY = Math.abs(b.y - a.y) - (a.halfH + b.halfH);
  return sepX >= sepY ? 'x' : 'y';
}

// The side of `from` that faces `to` along `axis` (`edge-realign.ts`'s
// `sideToward`).
function sideToward(from: LinkPt, to: LinkPt, axis: 'x' | 'y'): Side {
  if (axis === 'x') return to.x >= from.x ? 'right' : 'left';
  return to.y >= from.y ? 'bottom' : 'top';
}

// The point on `box`'s own `side` border at `percent` along it — the literal
// handle position PlanOut's `<Handle style={{left/top: percent+'%'}}>` sits
// at, ported to plain geometry since this map has no live DOM handles.
function portPoint(box: Box, side: Side, percent: number): LinkPt {
  const t = percent / 100;
  if (side === 'top') return { x: box.x - box.halfW + 2 * box.halfW * t, y: box.y - box.halfH };
  if (side === 'bottom') return { x: box.x - box.halfW + 2 * box.halfW * t, y: box.y + box.halfH };
  if (side === 'left') return { x: box.x - box.halfW, y: box.y - box.halfH + 2 * box.halfH * t };
  return { x: box.x + box.halfW, y: box.y - box.halfH + 2 * box.halfH * t };
}

// Unit vector pointing OUTWARD from a card through `side`.
function sideNormal(side: Side): LinkPt {
  if (side === 'top') return { x: 0, y: -1 };
  if (side === 'bottom') return { x: 0, y: 1 };
  if (side === 'left') return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

const isHorizontalSide = (side: Side) => side === 'left' || side === 'right';

// Not part of the PlanOut port: on PlanOut's own free canvas, a user who
// drags a node into an awkward spot can manually reshape any one edge's
// route (`orthogonal-edge.ts`'s `routePoints`/`shiftSegmentRoute`) — the
// polished diagrams that make the default elbow look reliable there are
// really the DEFAULT geometry plus that manual touch-up, and this map has no
// such per-edge editing pass, generating everything auto/unattended. Left as
// a plain midpoint, a horizontal-axis connector whose ends are two columns
// apart (root→leaf, skipping the hub column entirely) put that midpoint
// squarely inside the HUB column — every hub fills its whole column
// top-to-bottom, so the connector's vertical jog visibly cut straight
// through whichever hub cards occupied that stretch. This map's columns are
// fixed and known (`CENTER_NOTE_X`/`HUB_NOTE_X`/`NOTE_X`), unlike PlanOut's
// freeform canvas, so the midpoint can be pinned into a genuinely card-free
// gap instead: ordinarily the gap immediately before the TARGET's own
// column, which is always empty by construction and is exactly where an
// adjacent-column connector's jog already naturally falls anyway.
//
// A root→leaf connector (skipping the hub column entirely — root's own
// hand-authored highlights, not the auto-generated hub/root coverage
// sentences, which always address the adjacent tier) still has to cross the
// full hub column's width once, in ONE horizontal segment, since nothing
// clears the whole height the way the gaps do. Putting the long vertical
// run in the gap right before the LEAF (as the single-column-apart case
// does) puts that one unavoidable crossing at the connector's OWN exit row
// off root — root's exit port can land on any row along its card, with no
// relationship to where hub cards actually break, so nothing keeps it clear.
// Running the long vertical leg in the gap right after ROOT instead moves
// that same unavoidable crossing to the far end, right at the target leaf's
// own row — not a guarantee either, but the leaf tier is far more finely
// divided (dozens of short rows vs. a handful of tall hub cards), so a
// crossing pinned to one specific leaf's row is much less likely to land
// inside an unrelated hub's span than one pinned to root's arbitrary exit
// row was.
const GAP_BEFORE_HUB_X = (ROOT_HANDLE_X + HUB_NOTE_X) / 2;
const GAP_BEFORE_LEAF_X = (HUB_HANDLE_X + NOTE_X) / 2;
function safeJogX(sourceBox: Box, targetBox: Box): number {
  const sourceLeftEdge = sourceBox.x - sourceBox.halfW;
  const targetLeftEdge = targetBox.x - targetBox.halfW;
  const sourceIsRoot = Math.abs(sourceLeftEdge - CENTER_NOTE_X) < 4;
  const targetIsLeaf = Math.abs(targetLeftEdge - NOTE_X) < 4;
  if (sourceIsRoot && targetIsLeaf) return GAP_BEFORE_HUB_X;
  if (targetIsLeaf) return GAP_BEFORE_LEAF_X;
  return GAP_BEFORE_HUB_X;
}

// Even moved next to root's own gap, a root→leaf crossing still lands at the
// target leaf's own row — and a leaf's row always sits inside its own
// parent hub's vertical span (a hub is laid out centered on its own
// leaves), so that crossing reliably clips the leaf's own parent hub. There
// really is no row near the target that avoids every hub — the only rows
// that do are the `BRANCH_GAP` seams between one hub card and the next, so
// this finds whichever seam sits closest to the target's own row and
// crosses there instead, then corrects back onto the target's actual row
// once past the hub column.
function nearestSafeCrossY(targetY: number, hubBoxes: Box[]): number {
  const containing = hubBoxes.find((b) => targetY >= b.y - b.halfH && targetY <= b.y + b.halfH);
  if (!containing) return targetY;
  const sorted = [...hubBoxes].sort((a, b) => a.y - b.y);
  const idx = sorted.indexOf(containing);
  const above = idx > 0 ? sorted[idx - 1] : null;
  const below = idx < sorted.length - 1 ? sorted[idx + 1] : null;
  const gapAboveY = above ? (above.y + above.halfH + (containing.y - containing.halfH)) / 2 : containing.y - containing.halfH - 12;
  const gapBelowY = below ? (containing.y + containing.halfH + (below.y - below.halfH)) / 2 : containing.y + containing.halfH + 12;
  return Math.abs(targetY - gapAboveY) <= Math.abs(targetY - gapBelowY) ? gapAboveY : gapBelowY;
}

// Same reasoning, for a VERTICAL-axis (same-column) connector: every leaf
// shares the one `NOTE_X` column, and every hub the one `HUB_NOTE_X` column,
// so the direct route between two cards that are genuinely next to each
// other in that column is short and clear — but when other cards sit
// between them, that same direct route runs straight down/up through
// whichever of those intervening cards occupy the gap (there's no room
// beside them to slip past within the column itself, unlike the horizontal
// case where a whole other column's width separates source and target).
// True only when nothing else in `allBoxes` shares this column (matched by
// its own halfW — leaves and hubs are different widths, so this alone tells
// the two tiers apart) and sits strictly between the two Y ranges.
function isAdjacentInColumn(a: Box, b: Box, allBoxes: Box[]): boolean {
  const lo = Math.min(a.y, b.y);
  const hi = Math.max(a.y, b.y);
  return !allBoxes.some(
    (box) =>
      Math.abs(box.x - a.x) < 4 &&
      Math.abs(box.halfW - a.halfW) < 4 &&
      box.y > lo + 4 &&
      box.y < hi - 4,
  );
}

// How far a card can step outward from a given vertical (top/bottom) side
// before it would run into whatever OTHER card sits immediately next in
// that direction, in the same column — not necessarily this connector's own
// target, which may be several rows further past that immediate neighbor
// (that's what `safeJogX`'s X-corridor detour is for). A leaf column packs
// its rows only `ROW_GAP` apart by default, so a connector that isn't
// itself row-adjacent to its target can still have a much tighter next-door
// neighbor in the direction it needs to step — using the full `LINK_OFFSET`
// there overshoots straight into that neighbor. Returns `Infinity` when
// there's genuinely nothing in the way (the top/bottom of a column), where
// the full offset is safe.
function verticalClearance(box: Box, side: Side, allBoxes: Box[]): number {
  const dir = side === 'top' ? -1 : 1;
  let clearance = Infinity;
  allBoxes.forEach((other) => {
    if (other === box) return;
    if (Math.abs(other.x - box.x) >= 4 || Math.abs(other.halfW - box.halfW) >= 4) return;
    const gap =
      dir === -1 ? box.y - box.halfH - (other.y + other.halfH) : other.y - other.halfH - (box.y + box.halfH);
    if (gap >= 0) clearance = Math.min(clearance, gap);
  });
  return clearance;
}

// Clamps a vertical-side anchor step to whatever `verticalClearance` says is
// actually safe — floor of `ROW_ANCHOR_OFFSET` (never smaller, even with
// zero clearance, since the arrowhead still needs some room) and ceiling of
// `LINK_OFFSET` (never more than the normal step, even with lots of open
// space), with a couple px of margin off the raw clearance so the stroke
// doesn't render flush against the neighbor's own border.
function safeVerticalAnchorOffset(box: Box, side: Side, allBoxes: Box[]): number {
  const clearance = verticalClearance(box, side, allBoxes);
  if (!Number.isFinite(clearance)) return LINK_OFFSET;
  return Math.max(ROW_ANCHOR_OFFSET, Math.min(LINK_OFFSET, clearance - 2));
}

// Directional arrowhead triangle at `tip`, pointing INTO the card (i.e.
// opposite `sideNormal(side)`) — same 2:1 length:half-width triangle as
// PlanOut's `flow-edge-arrowhead.tsx`, generalized to all four sides instead
// of assuming a left-hand approach. `length`/`halfWidth` are passed in
// (rather than always `INODE_ARROW_LENGTH`/`_HALF_WIDTH`) so a same-column
// approach can use the smaller `ROW_ARROW_*` size that actually fits its
// tight row gap — see `ROW_ARROW_LENGTH`.
function arrowPoints(tip: LinkPt, side: Side, length: number, halfWidth: number): string {
  const n = sideNormal(side);
  const dirX = -n.x;
  const dirY = -n.y;
  const backX = tip.x - dirX * length;
  const backY = tip.y - dirY * length;
  const perpX = -dirY * halfWidth;
  const perpY = dirX * halfWidth;
  return `${tip.x},${tip.y} ${backX + perpX},${backY + perpY} ${backX - perpX},${backY - perpY}`;
}

// Not part of the PlanOut port: `offset` (`LINK_OFFSET`, 32) is sized for a
// horizontal step, where a card has a whole column-gap (`HUB_GAP`/
// `LEAF_GAP`) of clear room to step into. A vertical step off a
// top/bottom side has nowhere near that much room — adjacent rows in the
// same column sit only `ROW_GAP` (18px) apart — so the SAME offset there
// overshoots straight into whichever card is immediately next in that
// direction, even when that card has nothing to do with this connector.
// Vertical anchors get their own much smaller step instead. Paired with
// `ROW_ARROW_LENGTH` (6px) at the target end, the total reach out from a
// card's own edge is at most 6 + 2 = 8px, safely under the row gap
// with a couple px of clearance either way.
const ROW_ANCHOR_OFFSET = 2;

// A single continuous curve from one card border to the next. Same-column
// links bow through the clear column gap instead of running through cards.
function bezierPath(source: LinkPt, target: LinkPt, sourceSide: Side, targetSide: Side, corridorX?: number): string {
  const sn = sideNormal(sourceSide);
  const tn = sideNormal(targetSide);
  const dx = Math.abs(target.x - source.x);
  const dy = Math.abs(target.y - source.y);
  // Long cross-row links need proportionally longer handles. A short cap
  // makes their middle read as a straight diagonal with bent ends.
  const reach = Math.min(320, Math.max(32, Math.hypot(dx, dy) * 0.38));
  const sourceHandle = isHorizontalSide(sourceSide) ? reach : Math.min(120, Math.max(12, dy * 0.3));
  const targetHandle = isHorizontalSide(targetSide) ? reach : Math.min(120, Math.max(12, dy * 0.3));
  const c1 = { x: source.x + sn.x * sourceHandle, y: source.y + sn.y * sourceHandle };
  const c2 = { x: target.x + tn.x * targetHandle, y: target.y + tn.y * targetHandle };
  if (corridorX !== undefined) {
    c1.x = corridorX;
    c2.x = corridorX;
  }
  return `M${source.x},${source.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${target.x},${target.y}`;
}

// Draws the dashed connector — with a directional arrowhead at its target
// end, matching PlanOut's `flow-custom-edge.tsx` + `flow-edge-arrowhead.tsx`
// — from each inline node span to the note CARD its `data-link-href` points
// at (see `hrefToPos`, which stores each card's left-border position/size,
// not a separate dot marker). Runs after the SVG is attached to the DOM
// (foreignObject content only has real layout once mounted), and uses the
// SVG's screen CTM to map on-screen rects into the same user-space
// coordinates as the rest of the tree, so lines land correctly regardless
// of how the SVG is scaled by its container.
function wireInlineConnections(
  svg: SVGSVGElement,
  connectLayer: SVGGElement,
  hrefToPos: Map<string, { x: number; y: number; noteH: number; noteW: number; territoryHalfH?: number }>,
  hrefToCard: Map<string, HTMLElement>,
): void {
  // `connectLayer`'s own CTM (not `svg`'s) so the screen→SVG mapping
  // already composes the viewport `<g>`'s pan/zoom transform — see
  // `setupPanZoom`. `svg` itself is still needed below for
  // `createSVGPoint`/`querySelectorAll`, which only exist on the root.
  const ctm = connectLayer.getScreenCTM();
  if (!ctm) return;
  const inverse = ctm.inverse();
  const spans = Array.from(svg.querySelectorAll<HTMLElement>('.mindmap-inode[data-link-href]')).filter(
    (span) => hrefToPos.has(span.dataset.linkHref ?? ''),
  );

  const toSvgPoint = (x: number, y: number): LinkPt => {
    const pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    return pt.matrixTransform(inverse);
  };

  // Every card's own box, gathered once up front — used below to detect
  // whether a same-column (vertical-axis) connector's two cards are
  // genuinely adjacent in that column or have other cards between them (see
  // the `safeJogX` comment on why the direct route isn't always safe).
  const allBoxes: Box[] = Array.from(svg.querySelectorAll<HTMLElement>('.mindmap-note')).map((card) => {
    const r = card.getBoundingClientRect();
    const tl = toSvgPoint(r.left, r.top);
    const br = toSvgPoint(r.right, r.bottom);
    return { x: (tl.x + br.x) / 2, y: (tl.y + br.y) / 2, halfW: (br.x - tl.x) / 2, halfH: (br.y - tl.y) / 2 };
  });
  // Just the hub tier, for `nearestSafeCrossY` — matched by width, since
  // hubs are the one tier with `HUB_NOTE_W`.
  const hubBoxes = allBoxes.filter((b) => Math.abs(b.halfW - HUB_NOTE_W / 2) < 4);

  interface ConnGeom {
    span: HTMLElement;
    color: string;
    sourceBox: Box;
    targetBox: Box;
    sourceSide: Side;
    targetSide: Side;
    sourcePort: LinkPt;
    lineEndTarget: LinkPt;
    tip: LinkPt;
    sharedAxis: 'x' | 'y' | null;
    naturalMid: number;
    // The connector's own rough position along whichever axis ISN'T
    // `naturalMid` — e.g. for a horizontal-axis connector (shared X), this
    // is its Y midpoint. Used only to scope corridor-bucketing to
    // connectors that are actually near each other — see the bucket-key
    // comment below.
    corridorCross: number;
    waypoints: LinkPt[] | null;
    // Each endpoint's own resolved anchor step — see `orthogonalPath`'s own
    // comment on why this can't be a single shared value or a fixed
    // per-side-type constant.
    sourceAnchorOffset: number;
    targetAnchorOffset: number;
  }

  const geoms: ConnGeom[] = spans.map((span, colorIndex): ConnGeom => {
    const href = span.dataset.linkHref as string;
    const target = hrefToPos.get(href)!;
    // Every connector gets its own color (`INODE_COLORS`, cycled) — the
    // source highlight, its dashed line, its arrowhead, and its target
    // handle all share it, so a viewer can trace exactly which phrase a
    // given arrow belongs to even when several converge on one card.
    const color = INODE_COLORS[colorIndex % INODE_COLORS.length];
    const cardEl = span.closest<HTMLElement>('.mindmap-note');
    const cardRect = cardEl ? cardEl.getBoundingClientRect() : span.getBoundingClientRect();
    const cardTopLeft = toSvgPoint(cardRect.left, cardRect.top);
    const cardBottomRight = toSvgPoint(cardRect.right, cardRect.bottom);
    // A root or hub's `data-territory-half-h` (set in `render()`) is half the
    // vertical span its OWN children are laid out across, not its own short
    // rendered card height — see the `dominantAxis` comment below for why
    // that's the box height this algorithm actually needs for those two
    // tiers. A leaf has none (it has no children to span), so it falls back
    // to its own real rendered height, as does any card the CTM/DOM lookup
    // above couldn't resolve.
    //
    // Tried removing this special-casing outright (root/hub using their own
    // plain rendered box, like a leaf) to chase a reported "drift" in a
    // root→hub connector's landing spot — measured live, that connector was
    // always exactly centered on the correct side both before and after, so
    // the drift wasn't coming from here. Removing it instead reintroduced
    // the original bug this fixed (root/hub connectors cutting through
    // unrelated cards — confirmed via a live offender-scan: 0 overlaps with
    // this in place, 15 without it), so it stays.
    const territoryHalfH = cardEl?.dataset.territoryHalfH ? Number(cardEl.dataset.territoryHalfH) : null;
    const sourceBox: Box = {
      x: (cardTopLeft.x + cardBottomRight.x) / 2,
      y: (cardTopLeft.y + cardBottomRight.y) / 2,
      halfW: (cardBottomRight.x - cardTopLeft.x) / 2,
      halfH: (cardBottomRight.y - cardTopLeft.y) / 2,
    };
    // Measured EXACTLY like `sourceBox` above — off the target card's own
    // live `getBoundingClientRect()`, position and size both — rather than
    // trusting any of `hrefToPos`'s numbers (`x`/`y`/`noteW`/`noteH`),
    // which are the layout pass's own PRE-RENDER numbers: `noteH` is
    // `estimateNoteHeight()`'s text-wrap guess, and `x`/`y` are just
    // wherever that guess (compounded across every earlier card in the
    // same column — `ly`/`by`'s running total) put this card, not
    // necessarily where it actually rendered. This mirrors how PlanOut
    // itself sources a node's box for edge geometry: React Flow's own
    // node store, kept in sync with each node's REAL measured DOM size —
    // never a pre-render estimate. `hrefToCard`'s own comment covers why
    // trusting the estimate for even just the target's height already
    // caused a real, reported mismatch; the same reasoning applies to
    // every other number here, so none of them come from the estimate.
    const targetCardEl = hrefToCard.get(href);
    const targetCardRect = targetCardEl?.getBoundingClientRect();
    const targetTopLeft = targetCardRect ? toSvgPoint(targetCardRect.left, targetCardRect.top) : null;
    const targetBottomRight = targetCardRect ? toSvgPoint(targetCardRect.right, targetCardRect.bottom) : null;
    const targetTerritoryHalfH = targetCardEl?.dataset.territoryHalfH ? Number(targetCardEl.dataset.territoryHalfH) : null;
    const targetBox: Box =
      targetTopLeft && targetBottomRight
        ? {
            x: (targetTopLeft.x + targetBottomRight.x) / 2,
            y: (targetTopLeft.y + targetBottomRight.y) / 2,
            halfW: (targetBottomRight.x - targetTopLeft.x) / 2,
            halfH: (targetBottomRight.y - targetTopLeft.y) / 2,
          }
        : {
            // `hrefToCard` couldn't resolve an element for this href — falls
            // back to the pre-render layout numbers, same as before.
            x: target.x + target.noteW / 2,
            y: target.y,
            halfW: target.noteW / 2,
            halfH: target.noteH / 2,
          };

    // Territory is useful for choosing a tier's direction, but a handle
    // must always be placed on the card's actual rendered border.
    const sourceRoutingBox = { ...sourceBox, halfH: territoryHalfH ?? sourceBox.halfH };
    const targetRoutingBox = { ...targetBox, halfH: targetTerritoryHalfH ?? target.territoryHalfH ?? targetBox.halfH };
    const axis = dominantAxis(sourceRoutingBox, targetRoutingBox);
    const sourceSide = sideToward(sourceBox, targetBox, axis);
    const targetSide = sideToward(targetBox, sourceBox, axis);

    return {
      span,
      color,
      sourceBox,
      targetBox,
      sourceSide,
      targetSide,
      sourcePort: { x: 0, y: 0 }, // filled in below once every span's (card, side) group size is known
      lineEndTarget: { x: 0, y: 0 },
      tip: { x: 0, y: 0 },
      sharedAxis: null,
      naturalMid: 0,
      corridorCross: 0,
      waypoints: null,
      // Matches `orthogonalPath`'s old fixed per-side-type default — only
      // overridden below for the same-axis case, which is the one that
      // actually needs a case-by-case answer (see `safeVerticalAnchorOffset`).
      sourceAnchorOffset: isHorizontalSide(sourceSide) ? LINK_OFFSET : ROW_ANCHOR_OFFSET,
      targetAnchorOffset: isHorizontalSide(targetSide) ? LINK_OFFSET : ROW_ANCHOR_OFFSET,
    };
  });

  // Each target uses the center of its physical card side; each source is
  // aligned with its own highlighted phrase below.
  const DEFAULT_HANDLE_PERCENT = 50;

  geoms.forEach((g) => {
    // Start on the real card border beside the highlighted phrase. A
    // territory-sized routing box or an arbitrary distributed slot can put
    // the line's origin in empty canvas, far above/below its source card.
    const phraseRect = g.span.getBoundingClientRect();
    const phraseCenter = toSvgPoint(
      (phraseRect.left + phraseRect.right) / 2,
      (phraseRect.top + phraseRect.bottom) / 2,
    );
    const clampToCard = (value: number, center: number, half: number): number =>
      Math.max(center - half + 8, Math.min(center + half - 8, value));
    g.sourcePort = isHorizontalSide(g.sourceSide)
      ? { x: g.sourceBox.x + (g.sourceSide === 'right' ? g.sourceBox.halfW : -g.sourceBox.halfW),
          y: clampToCard(phraseCenter.y, g.sourceBox.y, g.sourceBox.halfH) }
      : { x: clampToCard(phraseCenter.x, g.sourceBox.x, g.sourceBox.halfW),
          y: g.sourceBox.y + (g.sourceSide === 'bottom' ? g.sourceBox.halfH : -g.sourceBox.halfH) };
    const targetPort = portPoint(g.targetBox, g.targetSide, DEFAULT_HANDLE_PERCENT);
    g.tip = targetPort;
    // Inset the line's endpoint by the arrow length, back along the target
    // side's outward normal, so the dashed stroke stops at the arrow's
    // base instead of running under it (PlanOut's `insetEndpoint`,
    // generalized to whichever of the four sides `targetSide` is) — using
    // the smaller `ROW_ARROW_LENGTH` for a top/bottom approach, since the
    // full-size arrow doesn't fit the row gap (see its own comment).
    const tn = sideNormal(g.targetSide);
    const targetArrowLen = isHorizontalSide(g.targetSide) ? INODE_ARROW_LENGTH : ROW_ARROW_LENGTH;
    g.lineEndTarget = { x: targetPort.x + tn.x * targetArrowLen, y: targetPort.y + tn.y * targetArrowLen };

    const sourceHoriz = isHorizontalSide(g.sourceSide);
    const targetHoriz = isHorizontalSide(g.targetSide);
    if (sourceHoriz === targetHoriz) {
      const sn = sideNormal(g.sourceSide);
      // A vertical-side pair only gets the fixed `ROW_ANCHOR_OFFSET` when
      // it's a genuine same-row jog (physically 18px apart, see
      // `isAdjacentInColumn`) — that pairing is already tuned to coexist
      // with `ROW_ARROW_LENGTH` inside the one real row gap. Every other
      // vertical-side case below (the `safeJogX` detour, two-or-more cards
      // apart in the column) doesn't have that same fixed gap to work
      // with — its actual clearance depends on whatever card happens to sit
      // immediately next door in that direction, which may be much less
      // than a full `LINK_OFFSET` even though it isn't this connector's own
      // target (see `safeVerticalAnchorOffset`). Decided up front so it's
      // known before `sourceAnchor`/`targetAnchor` (which the `else if`
      // branches below also read) are computed, and stored on `g` so the
      // `orthogonalPath` call in the render pass below uses the same
      // anchors.
      const isRowAdjacent = !sourceHoriz && isAdjacentInColumn(g.sourceBox, g.targetBox, allBoxes);
      g.sourceAnchorOffset = sourceHoriz
        ? LINK_OFFSET
        : isRowAdjacent
          ? ROW_ANCHOR_OFFSET
          : safeVerticalAnchorOffset(g.sourceBox, g.sourceSide, allBoxes);
      g.targetAnchorOffset = targetHoriz
        ? LINK_OFFSET
        : isRowAdjacent
          ? ROW_ANCHOR_OFFSET
          : safeVerticalAnchorOffset(g.targetBox, g.targetSide, allBoxes);
      const sourceAnchor = {
        x: g.sourcePort.x + sn.x * g.sourceAnchorOffset,
        y: g.sourcePort.y + sn.y * g.sourceAnchorOffset,
      };
      const targetAnchor = {
        x: g.lineEndTarget.x + tn.x * g.targetAnchorOffset,
        y: g.lineEndTarget.y + tn.y * g.targetAnchorOffset,
      };
      // The connector's rough position on whichever axis its shared jog
      // DOESN'T vary on — a shared-X jog still needs to know roughly where
      // along Y this connector sits, so two connectors that land on the
      // same gap corridor but are nowhere near each other in Y (e.g. one
      // hub→leaf link near the top of a tall page, another near the
      // bottom) don't compete for the same handful of lanes — see the
      // corridor-bucketing pass below.
      g.corridorCross = sourceHoriz ? (sourceAnchor.y + targetAnchor.y) / 2 : (sourceAnchor.x + targetAnchor.x) / 2;
      const sourceIsRoot = Math.abs(g.sourceBox.x - g.sourceBox.halfW - CENTER_NOTE_X) < 4;
      const targetIsLeaf = Math.abs(g.targetBox.x - g.targetBox.halfW - NOTE_X) < 4;
      if (sourceHoriz && sourceIsRoot && targetIsLeaf) {
        // Root→leaf, skipping the hub column: one jog isn't enough — see
        // `nearestSafeCrossY`. Still tagged with the same `sharedAxis`/
        // `naturalMid` as a plain root→hub link (both run their first leg
        // through `GAP_BEFORE_HUB_X`) so the corridor-bucketing pass below
        // gives it its own lane too — a root description can genuinely
        // carry several of these (hand-authored highlights straight to a
        // leaf, alongside the usual hub links), and left all on the exact
        // same X they render as one indistinguishable overlapping line.
        // The final render loop applies that lane's offset to this route's
        // two `GAP_BEFORE_HUB_X` waypoints — see `laneMid` below.
        const crossY = nearestSafeCrossY((sourceAnchor.y + targetAnchor.y) / 2, hubBoxes);
        g.sharedAxis = 'x';
        g.naturalMid = GAP_BEFORE_HUB_X;
        g.waypoints = [
          { x: GAP_BEFORE_HUB_X, y: sourceAnchor.y },
          { x: GAP_BEFORE_HUB_X, y: crossY },
          { x: GAP_BEFORE_LEAF_X, y: crossY },
          { x: GAP_BEFORE_LEAF_X, y: targetAnchor.y },
        ];
      } else if (sourceHoriz) {
        g.sharedAxis = 'x';
        g.naturalMid = safeJogX(g.sourceBox, g.targetBox);
      } else if (isRowAdjacent) {
        // Genuinely next to each other in the column — the direct shared-Y
        // jog is short and has nothing else in its way.
        g.sharedAxis = 'y';
        g.naturalMid = (sourceAnchor.y + targetAnchor.y) / 2;
      } else {
        // Other cards sit between them in the shared column — route the
        // jog by X through the clear gap instead, same as the horizontal
        // case, even though both sides are still top/bottom.
        g.sharedAxis = 'x';
        g.naturalMid = safeJogX(g.sourceBox, g.targetBox);
      }
    }
  });

  // Two UNRELATED connectors that both happen to run along the same shared
  // axis (both horizontal, or both vertical) can still land on nearly the
  // same natural mid coordinate — e.g. every hub→leaf link on the ENTIRE
  // page shares the exact same `GAP_BEFORE_LEAF_X`, regardless of which hub
  // or leaf. Left alone, that reads as one card having more connections
  // than it really does. Bucket connectors whose natural corridor is within
  // ~30px of each other, separately per axis, and fan them out into their
  // own parallel lanes — but ALSO only within `CROSS_BUCKET` of each other
  // on the other axis (`corridorCross`): two hub→leaf links from opposite
  // ends of a tall page share a corridor X but are nowhere near each other
  // on screen, so bucketing on X alone would still lump them into one
  // shared lane budget, diluting the separation for connectors that
  // actually do sit close together (this was the very "why is it still
  // bunched" bug the X-only version of this bucketing had).
  const CORRIDOR_BUCKET = 30;
  const CROSS_BUCKET = 200;
  const byCorridor = new Map<string, ConnGeom[]>();
  geoms.forEach((g, i) => {
    if (g.sharedAxis === null) return;
    // A genuinely row-adjacent connector (`g.sharedAxis === 'y'` — the only
    // place that value gets set, see the `isRowAdjacent` branch above)
    // already runs through the one real `ROW_GAP` between two SPECIFIC
    // cards, not a shared column-wide corridor — there's no spare width to
    // fan multiple lanes into the way a hub/leaf column gap has. Spreading
    // it anyway (e.g. two adjacent cards that reference each other in both
    // directions, competing for the same bucket) pushes the jog past the
    // row gap and into the neighboring cards' own vertical space, which
    // reads as a small tangled "staple" rather than two clean lines. Each
    // one keeps its own natural position instead of competing for a lane.
    const key =
      g.sharedAxis === 'y'
        ? `y-solo:${i}`
        : `${g.sharedAxis}:${Math.round(g.naturalMid / CORRIDOR_BUCKET)}:${Math.round(g.corridorCross / CROSS_BUCKET)}`;
    (byCorridor.get(key) ?? byCorridor.set(key, []).get(key)!).push(g);
  });
  const laneMid = new Map<ConnGeom, number>();
  byCorridor.forEach((groupGeoms) => {
    groupGeoms.forEach((g, slot) => {
      const spread = Math.min(CORRIDOR_BUCKET * 0.9, 10 * (groupGeoms.length - 1));
      const perStep = groupGeoms.length > 1 ? spread / (groupGeoms.length - 1) : 0;
      laneMid.set(g, g.naturalMid + (groupGeoms.length > 1 ? -spread / 2 + slot * perStep : 0));
    });
  });

  geoms.forEach((g) => {
    const mid = g.sharedAxis !== null ? { axis: g.sharedAxis, value: laneMid.get(g)! } : null;
    // No dot at the source end — PlanOut draws no marker at an inline
    // node's text-side handle either; its `<Handle>` there is fully
    // transparent except on hover-to-drag (`flow-inline-node-span.tsx`),
    // which doesn't apply here since nothing on this static map can be
    // dragged. The stroke simply starts at the card's own border port —
    // the highlighted phrase itself carries no drawn line, only its shared
    // color with the connector.
    // Row-adjacent same-column links (`sharedAxis === 'y'`) run only the
    // `ROW_GAP` between two stacked cards — short enough for the 8,4
    // dash pattern to read as a line rather than a couple of disconnected
    // dots, so those get a solid stroke instead.
    const isRowAdjacent = g.sharedAxis === 'y';
    const path = svgEl('path', {
      d: bezierPath(
        g.sourcePort,
        g.lineEndTarget,
        g.sourceSide,
        g.targetSide,
        !isHorizontalSide(g.sourceSide) && !isHorizontalSide(g.targetSide) && mid?.axis === 'x'
          ? mid.value
          : undefined,
      ),
      stroke: g.color,
      'stroke-width': isRowAdjacent ? '1.5' : '1.2',
      ...(isRowAdjacent ? {} : { 'stroke-dasharray': '8,4' }),
      fill: 'none',
      class: 'mindmap-inode-connector',
    });
    const arrow = svgEl('polygon', {
      points: isHorizontalSide(g.targetSide)
        ? arrowPoints(g.tip, g.targetSide, INODE_ARROW_LENGTH, INODE_ARROW_HALF_WIDTH)
        : arrowPoints(g.tip, g.targetSide, ROW_ARROW_LENGTH, ROW_ARROW_HALF_WIDTH),
      fill: g.color,
      class: 'mindmap-inode-arrowhead',
    });
    // A small handle dot at the connector's own dedicated entry point —
    // visually confirms this is a separate port from any other connector
    // arriving on the same card.
    const inodeHandle = svgEl('circle', {
      cx: g.tip.x,
      cy: g.tip.y,
      r: HANDLE_R - 1,
      fill: g.color,
      class: 'mindmap-inode-handle',
    });
    g.span.style.color = g.color;
    g.span.style.textDecorationColor = g.color;
    connectLayer.appendChild(path);
    connectLayer.appendChild(arrow);
    connectLayer.appendChild(inodeHandle);
    // PlanOut's own inline-node wiring keeps its connector dim (opacity 0
    // resting, full on hover) rather than permanently on — a static "always
    // drawn" line reads as clutter once more than one cross-note connection
    // exists on screen. Mirrored here: the connector rests dim and only
    // brightens while its highlighted phrase is hovered — the path itself
    // stays `pointer-events: none` (see global.css) so this thin line never
    // steals clicks from the note cards it crosses.
    g.span.addEventListener('mouseenter', () => {
      path.classList.add('is-active');
      arrow.classList.add('is-active');
      inodeHandle.classList.add('is-active');
    });
    g.span.addEventListener('mouseleave', () => {
      path.classList.remove('is-active');
      arrow.classList.remove('is-active');
      inodeHandle.classList.remove('is-active');
    });
  });
}

type LinkPt = { x: number; y: number };

const LINK_OFFSET = 32;

// Extracts every `id="..."` already referenced by an `<inode id="...">` tag
// inside a description string — used by `ensureFullCoverage` to know which
// children a hand-authored description already links to.
function extractInodeIds(text: string): Set<string> {
  const ids = new Set<string>();
  for (const m of text.matchAll(/<inode\s+id="([^"]+)">/g)) ids.add(m[1]);
  return ids;
}

// Internal-only slug for a branch/hub, so a root description's `<inode>`
// can target a hub the same way a leaf targets another leaf by its own
// `id` — hubs have no page of their own, so this is never a real href.
function slugifyHubLabel(label: string): string {
  return 'hub-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');
}

interface Coverable {
  keys: string[];
  linkKey: string;
  title: string;
}

// The map has exactly one rule for every relationship on it: a connection
// is a highlighted phrase with its own arrow, never a bare line between two
// cards (see the doc comments on `MindmapLeaf`/`wireInlineConnections`).
// Hand-authored descriptions cover the genuinely meaningful connections,
// but can't be relied on to happen to name literally every child by
// coincidence — so this appends one short, auto-generated closing sentence
// naming whichever children the hand-written text didn't already reach,
// guaranteeing full coverage without discarding or duplicating any
// hand-authored phrase (a child already covered by `keys` is left alone).
function ensureFullCoverage(description: string | undefined, children: Coverable[]): string {
  const base = description ?? '';
  const covered = extractInodeIds(base);
  const missing = children.filter((c) => c.linkKey && !c.keys.some((k) => covered.has(k)));
  if (missing.length === 0) return base;
  const links = missing.map((c) => `<inode id="${c.linkKey}">${c.title}</inode>`);
  const list =
    links.length === 1
      ? links[0]
      : links.length === 2
        ? `${links[0]} and ${links[1]}`
        : `${links.slice(0, -1).join(', ')}, and ${links[links.length - 1]}`;
  const sep = base.trim().length > 0 ? ' ' : '';
  return `${base}${sep}It also includes ${list}.`;
}

function render(data: MindmapData, container: HTMLElement): void {
  // Each branch gets a dedicated vertical span sized to the SUM of its own
  // leaves' actual measured row heights (minimum one row, for branches with
  // zero leaves) — not leaf count × a fixed row height, since every leaf's
  // card is now sized to its own real content (see `estimateNoteHeight`).
  // This is what guarantees no two notes ever overlap, regardless of how
  // unevenly leaves are distributed across branches or how long any one
  // description runs.
  const spans = data.branches.map((b) =>
    b.nodes.length
      ? b.nodes.reduce((sum, leaf) => sum + estimateNoteHeight(leaf.title, leaf.description, NOTE_W, !!leaf.repo) + ROW_GAP, 0)
      : NOTE_H + ROW_GAP,
  );
  const totalH = spans.reduce((sum, s) => sum + s, 0) + BRANCH_GAP * (spans.length - 1) + PAD_Y * 2;
  const CY = totalH / 2;

  const svg = svgEl('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    role: 'img',
    'aria-label': data.center + ' concept map',
  });

  // Everything pans/zooms together inside this one group — see
  // `setupPanZoom` below. The dot-grid background (PlanOut's `<Background
  // size={2} color="#dadada" />`, ported to our dark theme) lives inside it
  // too, so the dots track content instead of staying fixed underneath it.
  const viewport = svgEl('g', { class: 'mindmap-viewport' });
  svg.appendChild(viewport);

  const GRID = 22;
  // Generous enough that normal panning/zooming rarely reveals bare edges,
  // without tiling a pattern
  // across an unnecessarily huge area.
  const bgPad = 600;
  const defs = svgEl('defs', {});
  const dotPattern = svgEl('pattern', {
    id: 'mindmap-dot-grid',
    width: GRID,
    height: GRID,
    patternUnits: 'userSpaceOnUse',
  });
  dotPattern.appendChild(svgEl('circle', { cx: 1, cy: 1, r: 1, class: 'mindmap-grid-dot' }));
  defs.appendChild(dotPattern);
  viewport.appendChild(defs);
  viewport.appendChild(
    svgEl('rect', {
      x: -bgPad,
      y: -bgPad,
      width: W + bgPad * 2,
      height: totalH + bgPad * 2,
      fill: 'url(#mindmap-dot-grid)',
    }),
  );

  // Layer order: lines → leaf nodes/notes → branch nodes + labels →
  // cross-note connectors (drawn above notes so the inline "Related:" link
  // is visibly attached to its term) → center. There is deliberately no
  // separate "structural line" layer any more — every root→hub and
  // hub→leaf relationship is now drawn by `wireInlineConnections`, exactly
  // like a cross-reference, via `ensureFullCoverage` below. A plain
  // card-to-card line with no highlighted phrase behind it is the one
  // thing this map is never allowed to render.
  const leafLayer = svgEl('g', {});
  const branchLayer = svgEl('g', {});
  const connectLayer = svgEl('g', {});
  const centerLayer = svgEl('g', {});
  viewport.appendChild(connectLayer);
  viewport.appendChild(leafLayer);
  viewport.appendChild(branchLayer);
  const showGoToPopup = createGoToPopup(container);
  viewport.appendChild(centerLayer);

  // href → rendered leaf-card position, so an inline linked phrase
  // elsewhere in the tree can find the node it should connect to once the
  // whole layout is known (see `wireInlineConnections`, called after mount).
  // Also holds one entry per branch/hub, under its own internal `slugifyHubLabel`
  // key, so the root's own description can link to a hub the same way a
  // leaf links to another leaf.
  // `territoryHalfH`, hub entries only: half the vertical span this hub's OWN
  // children are laid out across — see the `dominantAxis` comment in
  // `wireInlineConnections` for why a hub's box needs this instead of its own
  // rendered card height.
  const hrefToPos = new Map<string, { x: number; y: number; noteH: number; noteW: number; territoryHalfH?: number }>();
  const hubKeys: string[] = [];
  // One entry per draggable card (every leaf/hub/root note), so
  // `setupNodeDrag` can move it by `x`/`y` on its own `foreignObject`
  // without re-deriving which `hrefToPos` key(s) it owns. Where a card
  // also has `hrefToPos` entries, `pos` below is the SAME object referenced
  // there (not a copy) — moving it updates every alias (`href`/`id`/
  // fallback key) at once, and `wireInlineConnections` picks the new
  // position up next time it's called. `original` is a one-time snapshot of
  // that starting position, kept separate from `pos` so the "Reset
  // positions" button has something fixed to restore to.
  const cardPos = new Map<
    HTMLElement,
    { fo: SVGForeignObjectElement; pos: { x: number; y: number }; original: { x: number; y: number }; height: number }
  >();
  // href/id/fallback-key → the card's own DOM element, so `wireInlineConnections`
  // can measure a connector's TARGET box from the card's real rendered size —
  // same as it already does for the SOURCE box — instead of trusting
  // `hrefToPos`'s `noteH`, which is only `estimateNoteHeight()`'s text-wrap
  // GUESS at that height. The guess and the real rendered height can diverge
  // (different font-rendering/text-shaping between browsers, a custom font
  // not yet loaded at estimate time, ...), and since a target's Y-center is
  // computed from that number, any divergence lands the arrival port
  // somewhere other than the card's true center — small enough to miss at
  // the map's default zoomed-out size, obvious once zoomed in or
  // fullscreened. Keyed the same way as `hrefToPos` (multiple keys can
  // share one element).
  const hrefToCard = new Map<string, HTMLElement>();

  let branchTop = PAD_Y;

  data.branches.forEach((branch, i) => {
    const span = spans[i];
    const by = branchTop + span / 2;
    const nodes = Array.isArray(branch.nodes) ? branch.nodes : [];
    let leafTop = branchTop;
    nodes.forEach((leaf, j) => {
      const noteH = estimateNoteHeight(leaf.title, leaf.description, NOTE_W, !!leaf.repo);
      const rowH = noteH + ROW_GAP;
      const ly = leafTop + rowH / 2;
      leafTop += rowH;

      const nd = j * 28;
      // The inline connector's target is the note CARD itself — see
      // `wireInlineConnections`. PlanOut's inline-node edges always
      // terminate on the actual note node, never on a separate marker.
      // Registered under every identifier this leaf has, so an
      // `<inode id="...">` elsewhere can address it by its real page
      // (`href`, cross-page), its own internal slug (`id`, same-map only),
      // or — for a leaf with neither, which nothing could ever target
      // before `ensureFullCoverage` existed — a positional fallback key,
      // so literally every leaf on this map is addressable by something.
      const fallbackKey = `leaf-${i}-${j}`;
      const leafPos = { x: NOTE_X, y: ly, noteH, noteW: NOTE_W };
      if (leaf.href) hrefToPos.set(leaf.href, leafPos);
      if (leaf.id) hrefToPos.set(leaf.id, leafPos);
      hrefToPos.set(fallbackKey, leafPos);

      appendNote(leafLayer, leaf, NOTE_X, ly, NOTE_W, noteH, nd + 20, showGoToPopup);
      const leafFo = leafLayer.lastElementChild as SVGForeignObjectElement | null;
      const leafCard = leafFo?.querySelector<HTMLElement>('.mindmap-note');
      if (leafFo && leafCard) {
        cardPos.set(leafCard, { fo: leafFo, pos: leafPos, original: { x: leafPos.x, y: leafPos.y }, height: noteH });
        if (leaf.href) hrefToCard.set(leaf.href, leafCard);
        if (leaf.id) hrefToCard.set(leaf.id, leafCard);
        hrefToCard.set(fallbackKey, leafCard);
      }
    });

    // Every leaf this hub owns must be reachable through a highlighted
    // phrase in the hub's OWN description — hand-authored phrases cover the
    // genuinely meaningful relationships; `ensureFullCoverage` appends a
    // short closing sentence naming any leaf that isn't already reached, so
    // this hub never has a child with no inline connection to it at all
    // (the plain "node-to-node" line this map used to draw for every
    // hub→leaf pair, regardless of whether the description said anything
    // about that leaf, is gone — see the layer-order comment above).
    const hubDescription = ensureFullCoverage(
      branch.description,
      nodes.map((leaf, j): Coverable => {
        const fallbackKey = `leaf-${i}-${j}`;
        return {
          keys: [leaf.href, leaf.id, fallbackKey].filter((k): k is string => !!k),
          linkKey: leaf.href ?? leaf.id ?? fallbackKey,
          title: leaf.title,
        };
      }),
    );
    const hubNoteH = estimateNoteHeight(branch.label, hubDescription, HUB_NOTE_W);
    const hubKey = slugifyHubLabel(branch.label);
    hubKeys.push(hubKey);
    const hubPos = { x: HUB_NOTE_X, y: by, noteH: hubNoteH, noteW: HUB_NOTE_W, territoryHalfH: span / 2 };
    hrefToPos.set(hubKey, hubPos);
    appendNote(branchLayer, { title: branch.label, description: hubDescription }, HUB_NOTE_X, by, HUB_NOTE_W, hubNoteH, 0, showGoToPopup, 'mindmap-note--hub');
    // Tag the just-appended card with that same territory height so
    // `wireInlineConnections` can look it up when this hub is a connector's
    // SOURCE (the `hrefToPos` entry above only covers it as a TARGET).
    const hubFo = branchLayer.lastElementChild as SVGForeignObjectElement | null;
    const hubCard = hubFo?.querySelector<HTMLElement>('.mindmap-note');
    if (hubCard) hubCard.setAttribute('data-territory-half-h', String(span / 2));
    if (hubFo && hubCard) {
      cardPos.set(hubCard, { fo: hubFo, pos: hubPos, original: { x: hubPos.x, y: hubPos.y }, height: hubNoteH });
      hrefToCard.set(hubKey, hubCard);
    }

    branchTop += span + BRANCH_GAP;
  });

  // Root card — same note-card anatomy as every other node (PlanOut has no
  // special "circle" node type; every node, root included, is the same
  // rounded-rect card). Same full-coverage rule as every hub above: any
  // branch the root's own description doesn't already reach by a
  // highlighted phrase gets one appended, naming it by its own hub key.
  const rootDescription = ensureFullCoverage(
    data.centerDescription,
    data.branches.map((b, i): Coverable => ({ keys: [hubKeys[i]], linkKey: hubKeys[i], title: b.label })),
  );
  const centerNoteH = estimateNoteHeight(data.center, rootDescription, CENTER_NOTE_W);
  appendNote(centerLayer, { title: data.center, description: rootDescription }, CENTER_NOTE_X, CY, CENTER_NOTE_W, centerNoteH, 0, showGoToPopup, 'mindmap-note--root');
  // Root is never a connector's TARGET (nothing links into it), so unlike a
  // hub it only needs the DOM tag, read when it's a connector's SOURCE.
  const rootFo = centerLayer.lastElementChild as SVGForeignObjectElement | null;
  const rootCard = rootFo?.querySelector<HTMLElement>('.mindmap-note');
  if (rootCard) rootCard.setAttribute('data-territory-half-h', String(totalH / 2));
  // No `hrefToPos` entry to share (root is never addressed by key), so this
  // one gets its own standalone position object instead of reusing one.
  if (rootFo && rootCard) {
    cardPos.set(rootCard, {
      fo: rootFo,
      pos: { x: CENTER_NOTE_X, y: CY },
      original: { x: CENTER_NOTE_X, y: CY },
      height: centerNoteH,
    });
  }

  container.appendChild(svg);

  // Sets the SVG's viewBox/initial transform from the now-mounted
  // container's real size — must run before `wireInlineConnections` below,
  // which depends on `connectLayer.getScreenCTM()` reflecting that same
  // viewBox and the viewport's initial pan/zoom transform.
  setupPanZoom(container, svg, viewport, W, totalH);
  setupInodeNavigation(container, hrefToCard);

  // Foreign-object content only has real layout once the SVG is mounted, so
  // the inline "Related:" connectors are wired up as a post-mount pass.
  // Each connector picks its own color from `INODE_COLORS` internally — see
  // `wireInlineConnections`. `setupNodeDrag` owns this FIRST wiring too (not
  // just re-wiring later), calling it synchronously — see its own comment
  // for why that has to stay synchronous rather than deferred.
  setupNodeDrag(container, svg, connectLayer, hrefToPos, hrefToCard, cardPos);
}

// PlanOut's own canvas (`flow-canvas.tsx`) is a full ReactFlow instance:
// dot-grid background, drag-to-pan, pinch/ctrl-wheel-to-zoom clamped to
// [the fit scale or MIN_ZOOM, MAX_ZOOM], with node dragging/connecting gated behind a
// `canWrite` flag. This site has no ReactFlow (and no write mode to gate —
// the mindmap has never supported dragging nodes or drawing connections),
// so this ports just the view: pan + zoom + dot grid, natively, with
// nothing wired up that could edit the graph.
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

const FULLSCREEN_ICON = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>';
const FULLSCREEN_EXIT_ICON = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>';

// A fullscreen toggle for the whole canvas — PlanOut's own canvas is a
// full-page app and never needed one, but every mindmap on this site sits
// inline in a fixed-height, clipped viewport (`#mindmapContainer`, see
// setupPanZoom's `fitAndCenter`), so there's real value in being able to
// blow it up to the full screen to explore a dense map. Native Fullscreen
// API rather than a CSS-only "modal" overlay, so it actually uses the OS
// fullscreen surface (bigger than the browser viewport on most setups).
function setupFullscreenButton(container: HTMLElement, fitAndCenter: () => void): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mindmap-fullscreen-btn';
  btn.setAttribute('aria-label', 'Enter fullscreen');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = FULLSCREEN_ICON;
  btn.appendChild(icon);
  btn.addEventListener('click', () => {
    if (document.fullscreenElement === container) {
      document.exitFullscreen().catch(() => {});
    } else if (container.requestFullscreen) {
      // Some embedding contexts (an iframe without `allow="fullscreen"`, a
      // few in-app/automation browser surfaces) reject this even from a
      // real click — nothing to recover from client-side, so just swallow
      // it instead of leaving an unhandled rejection in the console.
      container.requestFullscreen().catch(() => {});
    }
  });
  container.appendChild(btn);
  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = document.fullscreenElement === container;
    container.classList.toggle('mindmap-is-fullscreen', isFullscreen);
    btn.setAttribute('aria-label', isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
    icon.innerHTML = isFullscreen ? FULLSCREEN_EXIT_ICON : FULLSCREEN_ICON;
    // The container's real pixel size just changed (screen-sized vs its
    // normal inline height) — re-fit so the map isn't left scaled/centered
    // for the size it had a moment ago.
    requestAnimationFrame(fitAndCenter);
  });
}

function setupInodeNavigation(container: HTMLElement, hrefToCard: Map<string, HTMLElement>): void {
  const popup = document.createElement('div');
  popup.className = 'mindmap-goto-popup mindmap-inode-popup';
  popup.setAttribute('role', 'dialog');
  const label = document.createElement('span');
  label.className = 'mindmap-goto-popup__label';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'mindmap-goto-popup__link';
  button.textContent = 'Show node →';
  popup.append(label, button);
  container.appendChild(popup);
  let active: HTMLElement | null = null;
  let target: HTMLElement | null = null;
  const hide = () => { popup.classList.remove('is-open'); active = null; target = null; };
  const show = (span: HTMLElement) => {
    const card = hrefToCard.get(span.dataset.linkHref ?? '');
    if (!card) return;
    if (active === span) { hide(); return; }
    active = span;
    target = card;
    label.textContent = card.querySelector('.mindmap-note__title')?.textContent ?? 'Connected card';
    const rect = span.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    popup.style.left = `${Math.max(100, Math.min(bounds.width - 100, rect.left - bounds.left + rect.width / 2))}px`;
    const below = rect.bottom + 64 < bounds.bottom;
    popup.classList.toggle('mindmap-goto-popup--above', !below);
    popup.style.top = `${below ? rect.bottom - bounds.top + 8 : rect.top - bounds.top - 8}px`;
    popup.classList.add('is-open');
  };
  container.addEventListener('click', (event) => {
    const span = (event.target as Element).closest<HTMLElement>('.mindmap-inode');
    if (span) { event.stopPropagation(); show(span); }
  });
  container.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const span = (event.target as Element).closest<HTMLElement>('.mindmap-inode');
    if (span) { event.preventDefault(); show(span); }
  });
  button.addEventListener('click', () => {
    if (target) container.dispatchEvent(new CustomEvent('mindmap:focus-node', { detail: target }));
    hide();
  });
  document.addEventListener('click', (event) => {
    if (active && !popup.contains(event.target as Node) && !active.contains(event.target as Node)) hide();
  });
  container.addEventListener('mindmap:viewport-change', hide);
}

function setupPanZoom(
  container: HTMLElement,
  svg: SVGSVGElement,
  viewport: SVGGElement,
  contentW: number,
  contentH: number,
): void {
  let scale = 1;
  let minScale = MIN_ZOOM;
  let tx = 0;
  let ty = 0;

  function apply(): void {
    viewport.setAttribute('transform', 'translate(' + tx + ',' + ty + ') scale(' + scale + ')');
    // Closes any open "Go to page" popup (see `createGoToPopup`) — its
    // position is computed once from the clicked card's screen rect, so it
    // would go stale (pointing at empty canvas) the moment the view pans or
    // zooms out from under it.
    container.dispatchEvent(new CustomEvent('mindmap:viewport-change'));
  }

  function fitAndCenter(): void {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    // Whole map visible by default (today's behavior) — pan/zoom is an
    // added way to explore, not a requirement just to see the graph.
    // Dense maps can need less than the usual interactive zoom floor to fit
    // inside the fixed-height canvas. Use that fit as the effective minimum
    // so the bottom rows are visible on initial load and after a reset.
    const fitPadding = 12;
    const fitScale = Math.min(
      Math.max(0, rect.width - fitPadding * 2) / contentW,
      Math.max(0, rect.height - fitPadding * 2) / contentH,
    );
    minScale = Math.min(MIN_ZOOM, fitScale);
    scale = Math.min(MAX_ZOOM, fitScale);
    tx = (rect.width - contentW * scale) / 2;
    ty = (rect.height - contentH * scale) / 2;
    apply();
  }

  fitAndCenter();
  window.addEventListener('resize', fitAndCenter);
  setupFullscreenButton(container, fitAndCenter);

  function zoomAt(factor: number, px: number, py: number): void {
    const prevScale = scale;
    scale = Math.min(MAX_ZOOM, Math.max(minScale, scale * factor));
    if (scale === prevScale) return;
    tx = px - ((px - tx) / prevScale) * scale;
    ty = py - ((py - ty) / prevScale) * scale;
    apply();
  }
  container.addEventListener('mindmap:zoom', (event) => {
    const factor = (event as CustomEvent<number>).detail;
    if (!Number.isFinite(factor) || factor <= 0) return;
    zoomAt(factor, container.clientWidth / 2, container.clientHeight / 2);
  });
  container.addEventListener('mindmap:focus-node', (event) => {
    const card = (event as CustomEvent<HTMLElement>).detail;
    const fo = card?.closest('foreignObject');
    if (!fo) return;
    const x = Number(fo.getAttribute('x')) + Number(fo.getAttribute('width')) / 2;
    const y = Number(fo.getAttribute('y')) + Number(fo.getAttribute('height')) / 2;
    scale = Math.min(MAX_ZOOM, Math.max(minScale, 1));
    tx = container.clientWidth / 2 - x * scale;
    ty = container.clientHeight / 2 - y * scale;
    apply();
    card.classList.add('mindmap-note--focused');
    window.setTimeout(() => card.classList.remove('mindmap-note--focused'), 1800);
  });

  // Drag-to-pan on the empty canvas (background dots, or anywhere that
  // isn't a note card/link) — PlanOut reserves left-drag for node
  // selection since its canvas is editable; ours never is, so left-drag is
  // free for panning, like a "hand tool" (Figma/Google Maps convention).
  let panning = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let baseTx = 0;
  let baseTy = 0;

  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const target = e.target as Element;
    if (target.closest('a, .mindmap-note')) return;
    panning = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    baseTx = tx;
    baseTy = ty;
    svg.classList.add('is-panning');
  });
  window.addEventListener('pointermove', (e) => {
    if (!panning) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    if (!moved) return;
    tx = baseTx + dx;
    ty = baseTy + dy;
    apply();
  });
  window.addEventListener('pointerup', () => {
    panning = false;
    svg.classList.remove('is-panning');
  });

  // Zoom only on ctrl/cmd+wheel (trackpad pinch reports as a ctrl-modified
  // wheel event in every major browser) or pinch gestures — a plain wheel
  // is left alone to scroll the page, since this map sits inline in normal
  // page flow rather than owning the whole viewport the way PlanOut's
  // canvas does.
  svg.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      zoomAt(Math.exp(-e.deltaY * 0.01), px, py);
    },
    { passive: false },
  );
}

// Drag-to-reposition: a viewer can nudge any card (leaf/hub/root) to see how
// it reads against different neighbors — the arrangement is exploratory,
// not a fixed diagram. This only ever changes a card's `foreignObject`
// `x`/`y` (never a CSS `transform` — see the "no transform here on purpose"
// comment on `.mindmap-note` in global.css for the Chromium foreignObject
// repaint bug that rules that out); the card's own text content is never
// made editable, there's no contenteditable or input anywhere in it, only
// its position moves. Positions live in memory only (`cardPos`/`hrefToPos`)
// and reset on reload — there's no backend to persist them against, and the
// map's default layout is already deterministic from the content itself.
function setupNodeDrag(
  container: HTMLElement,
  svg: SVGSVGElement,
  connectLayer: SVGGElement,
  hrefToPos: Map<string, { x: number; y: number; noteH: number; noteW: number; territoryHalfH?: number }>,
  hrefToCard: Map<string, HTMLElement>,
  cardPos: Map<
    HTMLElement,
    { fo: SVGForeignObjectElement; pos: { x: number; y: number }; original: { x: number; y: number }; height: number }
  >,
): void {
  let dragEntry: { fo: SVGForeignObjectElement; pos: { x: number; y: number }; height: number } | null = null;
  let dragCard: HTMLElement | null = null;
  let startClientX = 0;
  let startClientY = 0;
  let startPosX = 0;
  let startPosY = 0;
  let scale = 1;
  let dragged = false;
  let suppressClick = false;
  let rafHandle = 0;

  // Re-derives every connector from the cards' current positions —
  // `wireInlineConnections` already reads a source card's box live off its
  // `getBoundingClientRect()`, so moving a `foreignObject` is picked up
  // automatically; only a card's TARGET-side box comes from `hrefToPos`
  // (see its own comment), which `cardPos.pos` shares a reference with, so
  // that's covered too. It doesn't clear itself between calls, so the old
  // paths/arrows/handles are removed first.
  function rewire(): void {
    while (connectLayer.firstChild) connectLayer.removeChild(connectLayer.firstChild);
    wireInlineConnections(svg, connectLayer, hrefToPos, hrefToCard);
  }

  function applyDrag(clientX: number, clientY: number): void {
    if (!dragEntry) return;
    const dx = (clientX - startClientX) / scale;
    const dy = (clientY - startClientY) / scale;
    if (!dragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) dragged = true;
    if (!dragged) return;
    dragEntry.pos.x = startPosX + dx;
    dragEntry.pos.y = startPosY + dy;
    dragEntry.fo.setAttribute('x', String(dragEntry.pos.x));
    dragEntry.fo.setAttribute('y', String(dragEntry.pos.y - dragEntry.height / 2));
    if (!rafHandle) {
      rafHandle = requestAnimationFrame(() => {
        rafHandle = 0;
        rewire();
      });
    }
  }

  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const target = e.target as Element;
    // The inline "Related: <term>" span inside a description is its own
    // click target (see `appendNote`'s `mindmap-inode` handling) — never a
    // drag handle for the whole card underneath it.
    if (target.closest('.mindmap-inode')) return;
    const card = target.closest<HTMLElement>('.mindmap-note');
    if (!card) return;
    const entry = cardPos.get(card);
    if (!entry) return;
    dragEntry = entry;
    dragCard = card;
    startClientX = e.clientX;
    startClientY = e.clientY;
    startPosX = entry.pos.x;
    startPosY = entry.pos.y;
    dragged = false;
    // Fixed for the whole drag — zoom is gated behind ctrl/cmd+wheel (see
    // `setupPanZoom`), which a single-button drag can't also be doing.
    const ctm = connectLayer.getScreenCTM();
    scale = ctm?.a || 1;
    card.classList.add('mindmap-note--dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragEntry) return;
    applyDrag(e.clientX, e.clientY);
  });

  window.addEventListener('pointerup', () => {
    if (!dragEntry) return;
    if (dragged) {
      suppressClick = true;
      rewire();
    }
    dragCard?.classList.remove('mindmap-note--dragging');
    dragEntry = null;
    dragCard = null;
  });

  // Puts every card back at its original layout position — the one
  // deliberate way to undo any amount of dragging, since positions are
  // in-memory only and there's no per-move undo stack.
  function resetPositions(): void {
    cardPos.forEach((entry) => {
      entry.pos.x = entry.original.x;
      entry.pos.y = entry.original.y;
      entry.fo.setAttribute('x', String(entry.pos.x));
      entry.fo.setAttribute('y', String(entry.pos.y - entry.height / 2));
    });
    rewire();
  }

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'mindmap-reset-btn';
  resetBtn.setAttribute('aria-label', 'Reset node positions');
  resetBtn.title = 'Reset node positions';
  const resetIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  resetIcon.setAttribute('viewBox', '0 0 24 24');
  resetIcon.setAttribute('fill', 'none');
  resetIcon.setAttribute('stroke', 'currentColor');
  resetIcon.setAttribute('stroke-width', '2');
  resetIcon.setAttribute('stroke-linecap', 'round');
  resetIcon.setAttribute('stroke-linejoin', 'round');
  resetIcon.setAttribute('aria-hidden', 'true');
  resetIcon.innerHTML = '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>';
  resetBtn.appendChild(resetIcon);
  resetBtn.addEventListener('click', resetPositions);
  container.appendChild(resetBtn);

  // Re-derive every connector whenever ANY card's real rendered box changes
  // size — not just on a window resize or fullscreen toggle, which was only
  // ever a guess at what else could invalidate the geometry. PlanOut itself
  // never trusts a one-time measurement either: its own edge geometry comes
  // from ReactFlow's `internalNode.measured.width/height`, which ReactFlow
  // keeps continuously in sync with the real DOM via its own ResizeObserver,
  // and it re-derives every edge's handles the moment that changes (see
  // `use-flow-edge-realign.ts`'s `anchorBox`). This mirrors that directly: a
  // `ResizeObserver` on every `.mindmap-note` card, instead of a fixed list
  // of events that might invalidate it. This is what actually closes the
  // Safari gap — `wireInlineConnections` runs once, synchronously, right
  // after mount, using whatever each card's rendered box is AT THAT EXACT
  // INSTANT. If a card's real size settles later for ANY reason (its font
  // finishing loading and reflowing the text it measures — browsers differ
  // on when a page paints relative to when a custom font is ready, and nothing
  // here was pinning `wireInlineConnections` to wait for it), that one-time
  // snapshot goes stale and nothing was watching for it to correct itself.
  let resizeRewireHandle = 0;
  const cardResizeObserver = new ResizeObserver(() => {
    if (resizeRewireHandle) return;
    resizeRewireHandle = requestAnimationFrame(() => {
      resizeRewireHandle = 0;
      rewire();
    });
  });
  cardPos.forEach((_, card) => cardResizeObserver.observe(card));

  // The FIRST wiring, synchronous, right here — tried gating this behind
  // `document.fonts.ready` + a couple of `requestAnimationFrame`s to dodge a
  // font-swap race, but that's a strictly worse trade: a backgrounded or
  // not-yet-visible tab throttles `requestAnimationFrame` (confirmed live —
  // it can simply never fire), which would leave the WHOLE map with zero
  // connectors, silently, forever, instead of the narrower bug it was
  // trying to avoid. A card's rendered box is CSS-locked to its declared
  // height regardless of font (`height:100%` + `overflow:hidden` inside the
  // foreignObject — confirmed live too), so there was no font-swap race to
  // dodge here in the first place. The `ResizeObserver` above is the actual
  // safety net for anything that genuinely changes a card's real size later.
  rewire();

  // A drag that actually moved the card shouldn't also fire the card's own
  // "open Go to page" click handler on release (`appendNote`'s click
  // listener, bubble-phase on the card) — capture-phase on `svg` runs
  // before that, so it can swallow just this one click.
  svg.addEventListener(
    'click',
    (e) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
}

export function initMindmap(container: HTMLElement, data: MindmapData): void {
  if (!data || !Array.isArray(data.branches) || data.branches.length === 0) {
    return;
  }
  render(data, container);
  // Layout.astro's global initCanvasStatus() call runs before this
  // function builds #mindmapContainer's own data-canvas-repo elements (see
  // canvas-status.ts's fetchCache — safe to call again here), so the
  // mindmap must re-trigger its own scan after render() populates them.
  initCanvasStatus();
}
