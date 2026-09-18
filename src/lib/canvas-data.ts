export type CanvasStatus = 'planned' | 'in-progress' | 'testing' | 'done';

export interface CanvasData {
  status: CanvasStatus;
  title?: string;
  description?: string;
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
    return data;
  } catch {
    return null;
  }
}
