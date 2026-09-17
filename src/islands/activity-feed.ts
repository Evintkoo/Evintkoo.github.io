// ─────────────────────────────────────────────
//  Activity Feed — GitHub public events
//  Ported from assets/js/activity-feed.js.
//  Fetches, caches (10 min), renders recent activity.
//  Fails silently + hides itself if no data.
// ─────────────────────────────────────────────

interface GitHubEventPayload {
  size?: number;
  action?: string;
  ref_type?: string;
  ref?: string;
  release?: { tag_name?: string };
}

interface GitHubEventRepo {
  name: string;
}

interface GitHubEvent {
  type: string;
  payload?: GitHubEventPayload;
  repo?: GitHubEventRepo;
  created_at?: string;
}

interface GitHubProfile {
  created_at?: string;
  public_repos?: number;
  followers?: number;
}

interface CacheEntry<T> {
  ts: number;
  data: T;
}

interface EventDescription {
  tone: string;
  icon: string;
  text: string;
}

const CACHE_KEY = 'elv:gh-activity:v1';
const TTL = 10 * 60 * 1000; // 10 min
const SHOW = 5; // rows
const PROFILE_KEY = 'elv:gh-profile:v1';
const PROFILE_TTL = 60 * 60 * 1000; // 1 h — profile changes slowly

// ── icons (stroke style matches the rest of the site) ──
const I: Record<string, string> = {
  commit: '<circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6"/>',
  pr: '<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M6 8.4v3.1c0 2 1 3 3 3h4"/>',
  issue: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  branch:
    '<circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="9" r="2.2"/><path d="M6 7.2v9.6M8.2 9c0 2.5 1.8 4 4 4"/>',
  tag: '<path d="M3 11.5V3h8.5L21 12.5 12.5 21z"/><circle cx="7" cy="7" r="1.4"/>',
  star: '<polygon points="12 3 14.4 9 21 9.4 16 13.5 17.6 20 12 16.6 6.4 20 8 13.5 3 9.4 9.6 9"/>',
  fork: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="19" r="2.2"/><path d="M6 8.2V10c0 2 2 3 6 3s6-1 6-3V8.2M12 13v4"/>',
  comment: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-8.5A8.4 8.4 0 1 1 21 11.5z"/>',
  repo: '<path d="M4 4v16M4 4h12l-2 4 2 4H4"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
};

function wrap(paths: string, extra?: string): string {
  return (
    '<svg class="activity-feed__icon ' +
    (extra || '') +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    paths +
    '</svg>'
  );
}

function escapeHtml(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[c];
  });
}

function cap(s: string | undefined): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : (s ?? '');
}

function pretty(t: string): string {
  return t.replace(/Event$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function describe(ev: GitHubEvent): EventDescription {
  const p = ev.payload || {};
  switch (ev.type) {
    case 'PushEvent':
      return {
        tone: '--warm',
        icon: I.commit,
        text: 'Pushed <b>' + (p.size || 1) + '</b> commit' + ((p.size || 1) > 1 ? 's' : '') + ' to',
      };
    case 'PullRequestEvent':
      return { tone: '--warm', icon: I.pr, text: cap(p.action) + ' pull request in' };
    case 'IssuesEvent':
      return { tone: '--warm', icon: I.issue, text: cap(p.action) + ' issue in' };
    case 'IssueCommentEvent':
      return { tone: '', icon: I.comment, text: 'Commented in' };
    case 'CreateEvent':
      return {
        tone: '--warm',
        icon: I.branch,
        text: 'Created ' + (p.ref_type || 'ref') + (p.ref ? ' <b>' + escapeHtml(p.ref) + '</b>' : '') + ' in',
      };
    case 'DeleteEvent':
      return { tone: '', icon: I.branch, text: 'Deleted ' + (p.ref_type || 'ref') + ' in' };
    case 'WatchEvent':
      return { tone: '--sage', icon: I.star, text: 'Starred' };
    case 'ForkEvent':
      return { tone: '--sage', icon: I.fork, text: 'Forked' };
    case 'ReleaseEvent':
      return {
        tone: '--warm',
        icon: I.tag,
        text: 'Released <b>' + escapeHtml((p.release && p.release.tag_name) || 'v?') + '</b> in',
      };
    case 'PublicEvent':
      return { tone: '--sage', icon: I.repo, text: 'Open-sourced' };
    case 'MemberEvent':
      return { tone: '', icon: I.user, text: 'Added a collaborator to' };
    default:
      return { tone: '', icon: I.dot, text: pretty(ev.type) + ' in' };
  }
}

function ago(ms: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd';
  const mo = Math.floor(d / 30);
  if (mo < 12) return mo + 'mo';
  return Math.floor(mo / 12) + 'y';
}

export function initActivityFeed(container: HTMLElement, username: string): void {
  container.innerHTML =
    '<div class="activity-feed__panel">' +
    '<header class="activity-feed__head">' +
    '<div class="activity-feed__status">' +
    '<span class="activity-feed__pulse" aria-hidden="true"></span>' +
    '<span class="activity-feed__label">Live</span>' +
    '<span class="activity-feed__sub" data-activity-sub>from GitHub</span>' +
    '</div>' +
    '<a class="activity-feed__focus" data-activity-focus href="https://github.com/' +
    username +
    '" target="_blank" rel="noopener noreferrer">' +
    '<span class="activity-feed__focus-kicker">Currently focused on</span>' +
    '<span class="activity-feed__focus-repo" data-activity-focus-repo>&mdash;</span>' +
    '</a>' +
    '</header>' +
    '<div class="activity-feed__stats" data-activity-stats></div>' +
    '<ul class="activity-feed__list" data-activity-list aria-live="polite">' +
    '<li class="activity-feed__item activity-feed__item--loading">' +
    '<span class="activity-feed__pulse" aria-hidden="true"></span>' +
    '<span>Fetching latest activity&hellip;</span>' +
    '</li>' +
    '</ul>' +
    '</div>';

  const listEl = container.querySelector<HTMLUListElement>('[data-activity-list]');
  const subEl = container.querySelector<HTMLElement>('[data-activity-sub]');
  const focusEl = container.querySelector<HTMLAnchorElement>('[data-activity-focus]');
  const focusRepoEl = container.querySelector<HTMLElement>('[data-activity-focus-repo]');
  const statsEl = container.querySelector<HTMLElement>('[data-activity-stats]');

  if (!listEl) return;

  function hide(): void {
    container.classList.add('is-hidden');
  }

  function render(events: GitHubEvent[] | null | undefined, cacheAgeMs: number | null): void {
    if (!events || !events.length) {
      hide();
      return;
    }

    // "Currently focused on" → first active/code event's repo
    const focusEv = events.find((e) => /Push|Create|Release|PullRequest/.test(e.type)) || events[0];
    if (focusEv && focusEv.repo && focusRepoEl) {
      focusRepoEl.textContent = focusEv.repo.name;
      if (focusEl) focusEl.href = 'https://github.com/' + focusEv.repo.name;
    }

    const rows = events.slice(0, SHOW).map((ev) => {
      const d = describe(ev);
      const repo = ev.repo && ev.repo.name ? ev.repo.name : 'unknown';
      const url = 'https://github.com/' + repo;
      const t = ev.created_at ? Date.parse(ev.created_at) : Date.now();
      return (
        '<li class="activity-feed__item">' +
        wrap(d.icon, d.tone ? 'activity-feed__icon' + d.tone : '') +
        '<a class="activity-feed__text" href="' +
        url +
        '" target="_blank" rel="noopener noreferrer">' +
        '<span class="activity-feed__action">' +
        d.text +
        ' </span>' +
        '<span class="activity-feed__repo">' +
        escapeHtml(repo) +
        '</span>' +
        '</a>' +
        '<time class="activity-feed__time" datetime="' +
        (ev.created_at || '') +
        '">' +
        ago(t) +
        ' ago</time>' +
        '</li>'
      );
    });
    listEl!.innerHTML = rows.join('');

    if (subEl && cacheAgeMs != null) {
      subEl.textContent = 'updated ' + ago(Date.now() - cacheAgeMs) + ' ago';
    }
  }

  function readCache(): CacheEntry<GitHubEvent[]> | null {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as CacheEntry<GitHubEvent[]> | null;
      if (c && c.data) return c;
    } catch {
      /* ignore */
    }
    return null;
  }
  function writeCache(data: GitHubEvent[]): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      /* ignore */
    }
  }

  async function fetchEvents(): Promise<GitHubEvent[]> {
    const res = await fetch('https://api.github.com/users/' + username + '/events/public', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('http ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('bad shape');
    return data;
  }

  function readProfileCache(): CacheEntry<GitHubProfile> | null {
    try {
      const c = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as CacheEntry<GitHubProfile> | null;
      if (c && c.data) return c;
    } catch {
      /* ignore */
    }
    return null;
  }
  function writeProfileCache(data: GitHubProfile): void {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      /* ignore */
    }
  }

  function renderProfile(p: GitHubProfile | null | undefined): void {
    if (!p || !statsEl) return;
    const since = p.created_at ? new Date(p.created_at).getUTCFullYear() : null;
    const yrs = since ? Math.max(1, new Date().getUTCFullYear() - since) : null;
    const stats = [
      { num: p.public_repos != null ? p.public_repos : '—', label: 'repositories' },
      { num: p.followers != null ? p.followers : '—', label: 'followers' },
      { num: yrs ? yrs + 'y' : '—', label: since ? 'since ' + since : 'on github' },
    ];
    statsEl.innerHTML = stats
      .map(
        (s) =>
          '<div class="activity-feed__stat">' +
          '<span class="activity-feed__stat-num">' +
          escapeHtml(String(s.num)) +
          '</span>' +
          '<span class="activity-feed__stat-label">' +
          escapeHtml(s.label) +
          '</span>' +
          '</div>',
      )
      .join('');
  }

  async function fetchProfile(): Promise<GitHubProfile> {
    const res = await fetch('https://api.github.com/users/' + username, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('http ' + res.status);
    return res.json();
  }

  async function loadProfile(): Promise<void> {
    const cached = readProfileCache();
    if (cached) renderProfile(cached.data);
    if (cached && Date.now() - cached.ts < PROFILE_TTL) return;
    try {
      const data = await fetchProfile();
      writeProfileCache(data);
      renderProfile(data);
    } catch {
      /* keep stale cache, or leave empty */
    }
  }

  async function load(): Promise<void> {
    const cached = readCache();
    if (cached) render(cached.data, Date.now() - cached.ts); // instant paint

    if (cached && Date.now() - cached.ts < TTL) return; // rate-limit friendly

    try {
      const data = await fetchEvents();
      if (data.length) {
        writeCache(data);
        render(data, 0);
      } else if (!cached) {
        hide();
      }
    } catch {
      if (!cached) hide(); // keep stale cache otherwise
    }
  }

  // refresh relative-time labels every minute without refetching
  setInterval(() => {
    const cached = readCache();
    if (cached && cached.data) render(cached.data, Date.now() - cached.ts);
  }, 60000);

  load();
  loadProfile();
}
