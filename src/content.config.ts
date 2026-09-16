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
    pdf: z.string().url().optional(),
    externalLink: z.string().url().optional(),
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
