import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { LoaderContext } from 'astro/loaders';
import { load as parseYaml } from 'js-yaml';
import { categories } from './data/categories';

const watchedLoaders = new WeakSet<object>();
const postsLoader = {
  name: 'portfolio-markdown-posts',
  async load(context: LoaderContext) {
    const postsDirectory = fileURLToPath(new URL('src/content/posts/', context.config.root));
    const markdownFiles = (await readdir(postsDirectory, { withFileTypes: true }))
      .filter(file => file.isFile() && file.name.endsWith('.md'))
      .map(file => file.name);
    const remaining = new Set(context.store.keys());

    for (const fileName of markdownFiles) {
      const filePath = join(postsDirectory, fileName);
      const raw = await readFile(filePath, 'utf8');
      const frontmatter = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
      if (!frontmatter) throw new Error(`Missing frontmatter in ${fileName}`);
      const data = parseYaml(frontmatter[1]);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error(`Invalid frontmatter in ${fileName}`);
      }

      const id = basename(fileName, '.md');
      const body = raw.slice(frontmatter[0].length);
      const parsedData = await context.parseData({ id, data: data as Record<string, unknown>, filePath });
      const rendered = await context.renderMarkdown(body, { fileURL: pathToFileURL(filePath) });
      context.store.set({
        id,
        data: parsedData,
        body,
        filePath: relative(fileURLToPath(context.config.root), filePath).replaceAll('\\', '/'),
        digest: context.generateDigest(raw),
        rendered,
        assetImports: rendered.metadata?.imagePaths,
      });
      remaining.delete(id);
    }

    for (const id of remaining) context.store.delete(id);

    if (context.watcher && !watchedLoaders.has(context.watcher)) {
      watchedLoaders.add(context.watcher);
      context.watcher.add(postsDirectory);
      const refresh = () => void postsLoader.load(context);
      context.watcher.on('add', path => path.startsWith(postsDirectory) && refresh());
      context.watcher.on('change', path => path.startsWith(postsDirectory) && refresh());
      context.watcher.on('unlink', path => path.startsWith(postsDirectory) && refresh());
    }
  },
};

const posts = defineCollection({
  loader: postsLoader,
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    category: z.string().refine(value => categories.some(category => category.id === value), 'Unknown category'),
    language: z.enum(['en', 'ko']),
    sourceUrl: z.url().optional(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { posts };
