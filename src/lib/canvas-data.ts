export type CanvasStatus = 'planned' | 'in-progress' | 'testing' | 'done';

export interface CanvasNodeData {
  status: CanvasStatus;
  title?: string;
  description?: string;
  // Same concept as the MDX `breakdown` schema's own `repoPath`
  // (src/content.config.ts) — a directory or file within this repo that
  // THIS node's own work actually lives in, e.g. "crates/sast/src/secrets.rs".
  // Lets a repo maintainer declare/update this live in canvas/data.json
  // without touching the site's own MDX frontmatter — see `applyCanvasData`
  // in canvas-status.ts for how it's consumed (overrides the MDX-authored
  // repoPath when the repo publishes its own).
  path?: string;
}

// A full branch/hub, own by the repo itself — the DECENTRALIZED counterpart
// to authoring a breakdown branch in this site's own content.config.ts
// `breakdown` schema. When a repo publishes `branches` in its own
// canvas/data.json, that tree becomes the WHOLE source of truth for its
// mindmap breakdown (see `buildMindmapBreakdown`) — the repo owner never
// needs to touch this site's own content at all, on first publish OR any
// later update: push a new canvas/data.json, the site picks it up.
export interface CanvasBranch {
  label: string;
  description?: string;
  path?: string;
  // Optional — a branch with no explicit status derives one client-side
  // from the worst status among its own `nodes` (same rule the repo ROOT
  // already used — see mindmap.ts's `deriveLocalStatus`), same as leaving
  // it off a hub authored in MDX.
  status?: CanvasStatus;
  nodes: CanvasTreeNode[];
}

export interface CanvasTreeNode {
  // Stable id this node is addressable by (an `<inode id="...">`
  // cross-reference elsewhere in the SAME repo's tree, or this exact key in
  // a flat `nodes` override map below) — defaults to a slugified `title`
  // when omitted, same fallback mindmap.ts's own `slugify` uses.
  id?: string;
  title: string;
  description?: string;
  path?: string;
  status: CanvasStatus;
}

export interface CanvasData {
  status: CanvasStatus;
  title?: string;
  description?: string;
  // Same as `CanvasNodeData.path` above, for the repo/canvas root itself.
  path?: string;
  // The repo's own FULL breakdown tree — see `CanvasBranch` above. When
  // present, `parseCanvasJson` ALSO flattens it into `nodes` below (hubs
  // keyed the same way mindmap.ts's `slugifyHubLabel` would, leaves by
  // their own `id`/slugified title), so the existing per-node live-status
  // overlay (canvas-status.ts) keeps working unchanged on a tree that came
  // from here instead of from MDX.
  branches?: CanvasBranch[];
  // Per-note status for a canvas that has its own sub-nodes (e.g. a
  // paper's own methodology breakdown on its detail page) — keyed by each
  // note's id (see MindmapLeaf.id in src/islands/mindmap.ts). Absent
  // entirely for a plain repo/paper-level-only canvas. Auto-derived from
  // `branches` when that's present (see above) — a repo can still publish
  // this directly instead, for a flat/no-tree canvas.
  nodes?: Record<string, CanvasNodeData>;
}

// Same slug rule as mindmap.ts's own `slugify` — duplicated here (rather
// than imported) to keep this module DOM/browser-agnostic and usable from
// build-time (.astro frontmatter) contexts too.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugifyHubLabel(label: string): string {
  return 'hub-' + slugify(label);
}

const VALID_STATUSES: CanvasStatus[] = ['planned', 'in-progress', 'testing', 'done'];

// A hub/leaf's own "Go to repo" link, scoped to the specific file or
// directory (`path`/`repoPath`) that its own work actually lives in,
// e.g. `https://github.com/x/y/tree/main/sast` instead of just the bare
// repo root. Falls back to the bare `rootRepo` when no path is set.
// Shared by src/islands/mindmap.ts (the MDX-authored `repoPath`) and
// src/islands/canvas-status.ts (a live `canvas/data.json`-declared
// `path`) — both resolve to the exact same link shape.
export function deriveRepoLink(rootRepo: string | undefined, path: string | undefined): string | undefined {
  if (!rootRepo) return undefined;
  if (!path) return rootRepo;
  return `${rootRepo.replace(/\/$/, '')}/tree/main/${path.replace(/^\/+/, '')}`;
}

// Only matches the plain `https://github.com/<owner>/<repo>` shape this
// site's `repo:`/`repoLink` frontmatter fields always use (see
// src/content.config.ts) — an optional trailing slash, nothing else (no
// `.git` suffix, no subpaths).
export function parseGithubRepo(repoUrl: string): { owner: string; name: string } | null {
  const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/);
  if (!match) return null;
  return { owner: match[1], name: match[2] };
}

// A research entry's GitHub connection is usually `repoLink`, but a few
// entries only ever set `externalLink` to their repo (no separate
// `repoLink`) — e.g. functional-group-analysis.mdx and p53-mutation.mdx.
// Others' `externalLink` points at a PDF/journal page instead, so only
// treat it as a repo connection when it actually parses as a plain GitHub
// repo URL. Shared by src/pages/index.astro (site-wide mindmap) and
// src/pages/research/[slug].astro (a paper's own breakdown canvas).
export function researchRepo(data: { repoLink?: string; externalLink?: string }): string | undefined {
  if (data.repoLink) return data.repoLink;
  if (data.externalLink && parseGithubRepo(data.externalLink)) return data.externalLink;
  return undefined;
}

const STATUS_SEVERITY: Record<CanvasStatus, number> = { planned: 0, 'in-progress': 1, testing: 2, done: 3 };

// Weakest-first, same rule mindmap.ts's own `deriveLocalStatus` applies to
// the repo root: a branch/hub with no explicit status of its own reads as
// its LEAST complete listed node, not "done" just because most are.
function worstStatus(nodes: { status: CanvasStatus }[]): CanvasStatus {
  let worst: CanvasStatus = 'done';
  for (const n of nodes) {
    if (STATUS_SEVERITY[n.status] < STATUS_SEVERITY[worst]) worst = n.status;
  }
  return worst;
}

function parseCanvasNode(value: unknown): CanvasNodeData | null {
  if (!value || typeof value !== 'object') return null;
  const nodeStatus = (value as { status?: unknown }).status;
  if (!VALID_STATUSES.includes(nodeStatus as CanvasStatus)) return null;
  const node: CanvasNodeData = { status: nodeStatus as CanvasStatus };
  const title = (value as { title?: unknown }).title;
  const description = (value as { description?: unknown }).description;
  const path = (value as { path?: unknown }).path;
  if (typeof title === 'string') node.title = title;
  if (typeof description === 'string') node.description = description;
  if (typeof path === 'string') node.path = path;
  return node;
}

function parseCanvasBranches(raw: unknown): CanvasBranch[] | null {
  if (!Array.isArray(raw)) return null;
  const branches: CanvasBranch[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const label = (entry as { label?: unknown }).label;
    const rawNodes = (entry as { nodes?: unknown }).nodes;
    if (typeof label !== 'string' || !Array.isArray(rawNodes)) continue;
    const nodes: CanvasTreeNode[] = [];
    for (const n of rawNodes) {
      if (!n || typeof n !== 'object') continue;
      const title = (n as { title?: unknown }).title;
      const status = (n as { status?: unknown }).status;
      if (typeof title !== 'string' || !VALID_STATUSES.includes(status as CanvasStatus)) continue;
      const node: CanvasTreeNode = { title, status: status as CanvasStatus };
      const id = (n as { id?: unknown }).id;
      const description = (n as { description?: unknown }).description;
      const path = (n as { path?: unknown }).path;
      if (typeof id === 'string') node.id = id;
      if (typeof description === 'string') node.description = description;
      if (typeof path === 'string') node.path = path;
      nodes.push(node);
    }
    if (nodes.length === 0) continue;
    const branch: CanvasBranch = { label, nodes };
    const description = (entry as { description?: unknown }).description;
    const path = (entry as { path?: unknown }).path;
    const status = (entry as { status?: unknown }).status;
    if (typeof description === 'string') branch.description = description;
    if (typeof path === 'string') branch.path = path;
    if (VALID_STATUSES.includes(status as CanvasStatus)) branch.status = status as CanvasStatus;
    branches.push(branch);
  }
  return branches.length > 0 ? branches : null;
}

// Shared by every fetch path below — validates and normalizes a parsed
// `canvas/data.json` body, regardless of which transport read it (public
// CDN or the authenticated GitHub API — see `fetchCanvasDataWithToken`).
function parseCanvasJson(json: unknown): CanvasData | null {
  if (!json || typeof json !== 'object' || !VALID_STATUSES.includes((json as { status?: unknown }).status as CanvasStatus)) return null;
  const raw = json as { status: CanvasStatus; title?: unknown; description?: unknown; path?: unknown; branches?: unknown; nodes?: unknown };
  const data: CanvasData = { status: raw.status };
  if (typeof raw.title === 'string') data.title = raw.title;
  if (typeof raw.description === 'string') data.description = raw.description;
  if (typeof raw.path === 'string') data.path = raw.path;

  const branches = parseCanvasBranches(raw.branches);
  if (branches) data.branches = branches;

  const nodes: Record<string, CanvasNodeData> = {};
  if (branches) {
    // Flatten the tree into the SAME lookup shape the live per-node
    // overlay (canvas-status.ts) already expects — a hub under its own
    // stable `hub-...` key (mindmap.ts gives every hub this exact id, see
    // `appendNote`'s call site in `render()`), a leaf under its own
    // `id`/slugified title, so nothing downstream needs to know whether a
    // node's data came from here or from a flat `nodes` map directly.
    for (const branch of branches) {
      nodes[slugifyHubLabel(branch.label)] = {
        status: branch.status ?? worstStatus(branch.nodes),
        title: branch.label,
        description: branch.description,
        path: branch.path,
      };
      for (const node of branch.nodes) {
        nodes[node.id ?? slugify(node.title)] = {
          status: node.status,
          title: node.title,
          description: node.description,
          path: node.path,
        };
      }
    }
  }
  if (raw.nodes && typeof raw.nodes === 'object') {
    // A flat `nodes` map (no `branches`) — the original, still-supported
    // shape for a repo that only wants to override status/description/path
    // on a tree MDX already declares, without hosting the tree itself.
    for (const [key, value] of Object.entries(raw.nodes as Record<string, unknown>)) {
      const node = parseCanvasNode(value);
      if (node) nodes[key] = node;
    }
  }
  if (Object.keys(nodes).length > 0) data.nodes = nodes;

  return data;
}

// Converts a repo's own published `branches` (`CanvasData.branches`) into
// the plain-object shape src/islands/mindmap.ts's `MindmapData` expects —
// field names deliberately mirror MindmapBranch/MindmapLeaf 1:1
// (`path`→`repoPath`) so this is a direct map, not a redesign. Returns
// `null` when the repo hasn't published a tree of its own yet, so the
// caller can fall back to whatever this site's own MDX still declares.
export function buildMindmapBreakdown(
  data: CanvasData,
  center: string,
  centerDescription: string | undefined,
): { center: string; centerDescription?: string; branches: Array<{ label: string; description?: string; repoPath?: string; nodes: Array<{ title: string; description?: string; id?: string; repoPath?: string }> }> } | null {
  if (!data.branches) return null;
  return {
    center,
    centerDescription: centerDescription ?? data.description,
    branches: data.branches.map((b) => ({
      label: b.label,
      description: b.description,
      repoPath: b.path,
      nodes: b.nodes.map((n) => ({
        title: n.title,
        description: n.description,
        id: n.id,
        repoPath: n.path,
      })),
    })),
  };
}

// Fetches canvas/data.json from the repo's `main` branch. Returns null for
// ANY failure mode (bad URL, network error, non-2xx, malformed/missing
// JSON, invalid status) — the caller treats null as "no canvas data yet",
// never as an error to surface. Works ONLY for a public repo — a private
// one 404s here regardless of whether the file exists, since this is a
// plain unauthenticated request (see `fetchCanvasDataWithToken` for the
// build-time-only path that actually reads a private repo).
export async function fetchCanvasData(repoUrl: string): Promise<CanvasData | null> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) return null;
  const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.name}/main/canvas/data.json`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return parseCanvasJson(await res.json());
  } catch {
    return null;
  }
}

// Build-time-only counterpart to `fetchCanvasData`, for a PRIVATE repo:
// `raw.githubusercontent.com` can never serve one, no matter what's in it
// (confirmed live — chain_reaction_simulation's own canvas/data.json sat
// there unreachable for hours after being pushed, purely because the repo
// is private, not because the file was missing). The GitHub Contents API
// can read a private repo given a token with that repo's `contents: read`
// access; `Accept: application/vnd.github.raw+json` makes it hand back
// the raw file bytes directly, so parsing is identical to the public path.
// Called only from .astro frontmatter (Node/build context — the token
// must never reach the client bundle), never from an island.
export async function fetchCanvasDataWithToken(repoUrl: string, token: string): Promise<CanvasData | null> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) return null;
  const url = `https://api.github.com/repos/${parsed.owner}/${parsed.name}/contents/canvas/data.json`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) return null;
    return parseCanvasJson(await res.json());
  } catch {
    return null;
  }
}

// Resolves every DISTINCT repo among `repos` (root + every leaf, some
// undefined, some duplicated — e.g. three GRN papers all sharing
// grn-encoder-comparison) that the PUBLIC path can't reach, into a repo →
// CanvasData map to embed in the page as canvas-status.ts's prefetch seed
// (see `initCanvasStatus`).
//
// Deliberately does NOT also include repos the public fetch already
// resolved: seeding those into the client's own fetch cache would make
// canvas-status.ts skip its live re-fetch for them too (the cache doesn't
// distinguish "seeded at build time" from "already fetched this
// pageload" — an entry is an entry), silently turning every public repo's
// badge from live-per-visit into stale-as-of-last-deploy. Only a repo the
// public path genuinely cannot reach (private, so this run had to fall
// back to the authenticated API) is included — everything else is left
// for the client's existing live fetch, completely untouched.
export async function buildCanvasPrefetch(repos: (string | undefined)[], token: string | undefined): Promise<Record<string, CanvasData>> {
  if (!token) return {};
  const distinct = Array.from(new Set(repos.filter((r): r is string => !!r)));
  const entries = await Promise.all(
    distinct.map(async (repo): Promise<[string, CanvasData] | null> => {
      // Only attempted because the public path already failed — a repo it
      // resolves is never added here (see above).
      const viaPublic = await fetchCanvasData(repo);
      if (viaPublic) return null;
      const viaToken = await fetchCanvasDataWithToken(repo, token);
      return viaToken ? [repo, viaToken] : null;
    }),
  );
  const prefetch: Record<string, CanvasData> = {};
  for (const entry of entries) {
    if (entry) prefetch[entry[0]] = entry[1];
  }
  return prefetch;
}
