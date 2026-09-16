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
    metrics: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .default([]),
    pdf: z.string().url().optional(),
    externalLink: z.string().url().optional(),
    simpleSummary: z.string().optional(),
  }),
});

export const collections = { projects, research };
