import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const origin = 'https://emp-penguin.github.io';
  const base = '/portfolio/';
  const paths = ['', 'experience/', 'thoughts/', 'contacts/'];
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  posts.forEach(post => paths.push(`thoughts/${encodeURIComponent(post.id)}/`));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${origin}${base}${path}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
