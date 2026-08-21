import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const stories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stories' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      coverImage: image(),
      video: z.string(),
      audio: z.string(),
      videoDuration: z.string(),
      audioDuration: z.string(),
    }),
});

export const collections = { stories };
