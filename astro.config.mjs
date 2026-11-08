import { defineConfig } from 'astro/config';
import remarkGfm from 'remark-gfm';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://emp-penguin.github.io',
  base: '/portfolio',
  output: 'static',
  trailingSlash: 'always',
  markdown: { processor: unified({ remarkPlugins: [remarkGfm] }) },
});
