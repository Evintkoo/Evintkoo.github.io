import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const topic = z.enum(['ml', 'bio', 'fin', 'econ', 'infra', 'neuro']);

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    tags: z.array(z.string()),
    topic: topic.nullable(),
    tech: z.array(z.string()),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    paperLink: z.string().optional(),
    ctaHeading: z.string().optional(),
    ctaSubtitle: z.string().optional(),
    ctaLink: z.string().url().optional(),
    ctaLabel: z.string().optional(),
    // Legacy per-page og:description copy where it genuinely differs from
    // `tagline` (final-review.md I1) — og:title never differed from
    // `${title} | Evint Leovonzko` on any project page, so no ogTitle field
    // is needed here.
    ogDescription: z.string().optional(),
    featured: z.boolean().default(false),
    hasPlayground: z.boolean().default(false),
    order: z.number(),
    // This project's own feature breakdown (src/islands/mindmap.ts's
    // `MindmapData`) — same shape/purpose as the `research` collection's
    // `breakdown` below (see its comment for the full rationale): each
    // branch is a major area of the project, each branch's `nodes` are its
    // individual features/components. Optional — only projects with a repo
    // worth mapping get one; src/pages/projects/[slug].astro renders this
    // section only when present, unlike research's sitewide-map fallback
    // (a project page with no breakdown just omits the section entirely).
    breakdown: z
      .object({
        center: z.string(),
        centerDescription: z.string().optional(),
        branches: z.array(
          z.object({
            label: z.string(),
            description: z.string().optional(),
            // Directory within THIS project's own `repo` (above) that this
            // hub/branch's own work actually lives in, e.g. "src/sast" —
            // when set, the hub's "Go to repo" link points at
            // `<repo>/tree/main/<repoPath>` instead of the bare repo root.
            repoPath: z.string().optional(),
            nodes: z.array(
              z.object({
                title: z.string(),
                description: z.string().optional(),
                id: z.string().optional(),
                // Same as the branch-level `repoPath` above, scoped to this
                // one leaf's own subdirectory.
                repoPath: z.string().optional(),
              }),
            ),
          }),
        ),
      })
      .optional(),
  }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    // Some source listing rows use a shorter marketing title than the
    // detail page's full academic title — set only when they differ.
    shortTitle: z.string().optional(),
    tagline: z.string(),
    tags: z.array(z.string()),
    topic,
    date: z.coerce.date().optional(),
    order: z.number(),
    // Same field name/pattern as the `projects` schema (Task 19) — used by
    // som-tsk, the only research page with the SOM playground island.
    hasPlayground: z.boolean().default(false),
    authors: z.string().optional(),
    affiliation: z.string().optional(),
    // Legacy per-page og:title/og:description copy where it genuinely
    // differs from `title`/`tagline` (final-review.md I1) — e.g. grasp's
    // og:title is "GRASP: Autonomous Spectral Clustering" while its <title>
    // is the full "GRASP: Graph-Routed Adaptive Spectral Partitioning".
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    metrics: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .default([]),
    // Site-relative path into public/files/ (e.g. "/files/foo.pdf"), not a
    // full URL — intentionally not .url() (that would reject relative
    // paths). externalLink is a real absolute URL (GitHub, etc.) so it
    // keeps .url().
    pdf: z.string().optional(),
    externalLink: z.string().url().optional(),
    // Secondary "View Code" link, alongside (not instead of) pdf/
    // externalLink — the source's secondary GitHub repo button, present
    // on only 4 of the 8 pages that have a primary paper link.
    repoLink: z.string().url().optional(),
    // Generic label:value pair for the source's "paper-meta-box" line —
    // "Published: March 2026", "Award: Best Research Project (UBC
    // Vantage)", etc. Not all of these are dates, so this is deliberately
    // separate from the unused `date` field above, which stays untouched.
    metaLabel: z.string().optional(),
    metaValue: z.string().optional(),
    // Internal cross-link to a paired/companion paper (e.g. the
    // keynesian-abm-fiscal <-> keynesian-abm-coordination pair, Task 24).
    // Site-relative path, not a full URL — same rationale as `pdf` above.
    // Rendered as an extra secondary button in ResearchHero.astro,
    // alongside (not instead of) pdf/externalLink/repoLink.
    pairedLink: z.string().optional(),
    pairedLinkLabel: z.string().optional(),
    // The mindmap's cross-note connection(s) (src/islands/mindmap.ts's
    // `appendNote`): a full sentence describing this paper's relationship
    // to one or more other leaves, with each linking phrase wrapped in
    // `<inode id="/research/other-slug/">phrase</inode>` — the `id` is the
    // target leaf's own href, so multiple distinct phrases in one sentence
    // can each connect to a different node (PlanOut's own inline-node
    // markup: `lib/flow/parse-inline-nodes.ts`). Renders as a highlighted,
    // dotted-underline span in place — mid-sentence, not a generic
    // "Related: Companion paper" row appended after a truncated tagline.
    // Optional: only entries that actually have a cross-reference get one;
    // falls back to the plain `tagline` (no connector) when absent.
    mindmapNote: z.string().optional(),
    // The source's "paper-meta-snapshot" aside ("Research Snapshot" card):
    // a summary sentence, a secondary set of highlight metrics (genuinely
    // distinct from the primary `metrics` above — verified non-redundant
    // per the Task 24 fix-round audit), and label:value detail rows. The
    // aside's tag pills are intentionally NOT modeled here — they
    // duplicate the `tags` array already rendered elsewhere on the page.
    snapshot: z
      .object({
        summary: z.string().optional(),
        highlights: z
          .array(z.object({ value: z.string(), label: z.string() }))
          .optional(),
        details: z
          .array(z.object({ label: z.string(), value: z.string() }))
          .optional(),
        // The source aside's own "paper-meta-tags" pill footer — a
        // finer-grained, page-specific tag vocabulary genuinely distinct
        // from the collection's top-level `tags` (verified per-page in
        // Task 24's fix round 2: only 1-2 pills typically overlap the
        // top-level tags, not a duplicate list). Both coexist on these
        // pages; don't conflate this with the top-level `tags` field.
        tags: z.array(z.string()).optional(),
      })
      .optional(),
    // "Simple mode" (the caveman-mode toggle, src/islands/caveman-mode.ts):
    // per-section plain-language rewrites, one entry per `## heading` in
    // this entry's MDX body, in the same order — NOT a single collapsed
    // abstract. Each `heading` should match the real section heading text
    // so simple mode preserves the paper's actual structure while
    // translating every section (not just the abstract) into plain
    // language. Optional: research entries have this structured per-section
    // content instead.
    simpleSections: z
      .array(z.object({ heading: z.string(), body: z.string() }))
      .optional(),
    // The source's assets/js/research-recommendations.js "Related papers"
    // card copy — a hand-written subtitle/description distinct from
    // `tagline` and not derivable from anything else in this schema
    // (confirmed via `git show` against the pre-migration source: these
    // strings exist nowhere else in the migrated site). Populated verbatim
    // for all 14 entries the legacy recommender covered; entries outside
    // that set (e.g. this page is never itself recommended, or predates
    // the recommender) leave these unset and the related-papers card falls
    // back to `tagline`.
    recSubtitle: z.string().optional(),
    recDescription: z.string().optional(),
    // Serializable chart data/config only (Task 20's ResearchChartConfig).
    // formatX/formatY/formatValue are functions and cannot survive a
    // frontmatter (YAML) round-trip or JSON.stringify in a <script
    // type="application/json"> tag — those are reconstructed at render
    // time in src/pages/research/[slug].astro, keyed off the
    // data-chart-format attribute on the chart container div written
    // directly in each entry's MDX body (see Task 23).
    chart: z
      .object({
        height: z.number().optional(),
        logY: z.boolean().optional(),
        type: z.enum(['line', 'bar']).optional(),
        xs: z.array(z.number()),
        series: z.array(
          z.object({
            name: z.string().optional(),
            values: z.array(z.number()),
            color: z.string().optional(),
          }),
        ),
      })
      .optional(),
    // This paper's own concept map (src/islands/mindmap.ts's `MindmapData`)
    // — a breakdown of ITS OWN methodology/components, not the site-wide
    // topic map. `center`/`centerDescription` are the paper's own
    // name/one-line summary; each branch is a major stage or component
    // (e.g. "Data", "Model", "Evaluation"), and each branch's `nodes` are
    // the specific techniques/results within it. A leaf's `description` can
    // carry `<inode id="TARGET">...</inode>` cross-reference markup, same
    // as `mindmapNote` above — but since these leaves are internal
    // sub-topics with no page of their own, `TARGET` here is normally
    // another leaf's own `id` (a short internal slug, e.g. "zlb-frequency"),
    // not a URL — give the REFERENCED leaf that `id` and point the
    // REFERRING leaf's `<inode id="...">` at it. Only add these where a
    // genuine methodological relationship exists between two leaves in
    // THIS SAME breakdown; not every leaf needs one. Optional: entries
    // without a `breakdown` at all fall back to the site-wide topic map on
    // their own page (src/pages/research/[slug].astro) until authored.
    breakdown: z
      .object({
        center: z.string(),
        centerDescription: z.string().optional(),
        branches: z.array(
          z.object({
            label: z.string(),
            description: z.string().optional(),
            // Same as `projects.breakdown.branches[].repoPath` above — a
            // directory within this paper's own `repoLink`/`externalLink`
            // repo that this hub's own work actually lives in.
            repoPath: z.string().optional(),
            nodes: z.array(
              z.object({
                title: z.string(),
                description: z.string().optional(),
                // Internal-only slug this leaf can be addressed by from
                // another leaf's `<inode id="...">` — only set on a leaf
                // that's actually the TARGET of at least one such
                // reference elsewhere in this breakdown.
                id: z.string().optional(),
                // Same as the branch-level `repoPath` above, scoped to this
                // one leaf's own subdirectory.
                repoPath: z.string().optional(),
              }),
            ),
          }),
        ),
      })
      .optional(),
  }),
});

export const collections = { projects, research };
