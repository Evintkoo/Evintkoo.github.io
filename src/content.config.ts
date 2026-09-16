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
    featured: z.boolean().default(false),
    hasPlayground: z.boolean().default(false),
    order: z.number(),
  }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    tags: z.array(z.string()),
    topic,
    date: z.coerce.date().optional(),
    order: z.number(),
    authors: z.string().optional(),
    affiliation: z.string().optional(),
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
    simpleSummary: z.string().optional(),
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
  }),
});

export const collections = { projects, research };
