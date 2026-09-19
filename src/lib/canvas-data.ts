export type CanvasStatus = 'planned' | 'in-progress' | 'testing' | 'done';

export interface CanvasNodeData {
  status: CanvasStatus;
  title?: string;
  description?: string;
}

export interface CanvasData {
  status: CanvasStatus;
  title?: string;
  description?: string;
  // Per-note status for a canvas that has its own sub-nodes (e.g. a
  // paper's own methodology breakdown on its detail page) — keyed by each
  // note's id (see MindmapLeaf.id in src/islands/mindmap.ts). Absent
  // entirely for a plain repo/paper-level-only canvas.
  nodes?: Record<string, CanvasNodeData>;
}

const VALID_STATUSES: CanvasStatus[] = ['planned', 'in-progress', 'testing', 'done'];

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

// Shared by every fetch path below — validates and normalizes a parsed
// `canvas/data.json` body, regardless of which transport read it (public
// CDN or the authenticated GitHub API — see `fetchCanvasDataWithToken`).
function parseCanvasJson(json: unknown): CanvasData | null {
  if (!json || typeof json !== 'object' || !VALID_STATUSES.includes((json as { status?: unknown }).status as CanvasStatus)) return null;
  const raw = json as { status: CanvasStatus; title?: unknown; description?: unknown; nodes?: unknown };
  const data: CanvasData = { status: raw.status };
  if (typeof raw.title === 'string') data.title = raw.title;
  if (typeof raw.description === 'string') data.description = raw.description;
  if (raw.nodes && typeof raw.nodes === 'object') {
    const nodes: Record<string, CanvasNodeData> = {};
    for (const [key, value] of Object.entries(raw.nodes as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const nodeStatus = (value as { status?: unknown }).status;
      if (!VALID_STATUSES.includes(nodeStatus as CanvasStatus)) continue;
      const node: CanvasNodeData = { status: nodeStatus as CanvasStatus };
      const nodeTitle = (value as { title?: unknown }).title;
      const nodeDescription = (value as { description?: unknown }).description;
      if (typeof nodeTitle === 'string') node.title = nodeTitle;
      if (typeof nodeDescription === 'string') node.description = nodeDescription;
      nodes[key] = node;
    }
    if (Object.keys(nodes).length > 0) data.nodes = nodes;
  }
  return data;
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
