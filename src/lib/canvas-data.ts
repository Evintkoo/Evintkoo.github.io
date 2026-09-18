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

// Fetches canvas/data.json from the repo's `main` branch. Returns null for
// ANY failure mode (bad URL, network error, non-2xx, malformed/missing
// JSON, invalid status) — the caller treats null as "no canvas data yet",
// never as an error to surface.
export async function fetchCanvasData(repoUrl: string): Promise<CanvasData | null> {
  const parsed = parseGithubRepo(repoUrl);
  if (!parsed) return null;
  const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.name}/main/canvas/data.json`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || typeof json !== 'object' || !VALID_STATUSES.includes(json.status)) return null;
    const data: CanvasData = { status: json.status };
    if (typeof json.title === 'string') data.title = json.title;
    if (typeof json.description === 'string') data.description = json.description;
    if (json.nodes && typeof json.nodes === 'object') {
      const nodes: Record<string, CanvasNodeData> = {};
      for (const [key, value] of Object.entries(json.nodes as Record<string, unknown>)) {
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
  } catch {
    return null;
  }
}
