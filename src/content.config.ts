import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    status: z.enum(['live', 'in-progress']),
    summary: z.string().min(40),
    projectType: z.string().min(1),
    focus: z.array(z.string().min(1)).min(3),
    featured: z.boolean(),
    primaryImage: z.string().startsWith('/assets/'),
    secondaryImage: z.string().startsWith('/assets/'),
    liveUrl: z.string().url().optional()
  })
});

export const collections = { projects };
