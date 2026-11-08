import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as parse5 from 'parse5';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const postsRoot = path.join(projectRoot, 'src', 'content', 'posts');
const publicRoot = path.join(projectRoot, 'public', 'assets', 'blog');
const blogId = 'heock_yi';
const feedUrl = `https://rss.blog.naver.com/${blogId}.xml`;
const requestHeaders = {
  'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBlogSync/1.0)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const knownSlugs = {
  '224413050721': 'wisdom-of-acceptance',
  '224400519138': 'from-envy-to-learning',
  '224400437875': 'the-basics-of-life',
  '224399035432': 'shareholder-friendly',
  '224397060826': 'eight-books-in-a-month',
  '224396571760': 'intensive-reading',
  '224392375872': 'after-first-hackathon',
  '224391036868': 'live-jazzy',
  '224390004726': 'success-and-wealth',
  '224388920997': 'ai-with-intention',
  '224333776594': 'be-honest-with-yourself',
  '224308102556': 'drinks-without-drunkenness',
  '224295827437': 'learning-to-run',
  '224293373390': 'good-day',
};

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim();
}

function tagValue(xml, tag) {
  const found = xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return found ? decodeXml(found[1]) : '';
}

function getText(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(getText).join(' ');
}

function findArticle(node) {
  if (node.tagName === 'div' && node.attrs?.some(attr => attr.name === 'class' && attr.value.split(/\s+/).includes('se-main-container'))) return node;
  for (const child of node.childNodes || []) {
    const found = findArticle(child);
    if (found) return found;
  }
  return undefined;
}

function attr(node, name) {
  return node.attrs?.find(item => item.name === name)?.value;
}

function safeUrl(value, baseUrl) {
  if (!value) return '';
  if (value.startsWith('/portfolio/')) return value;
  try {
    const url = new URL(value, baseUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

async function fetchText(url) {
  const response = await fetch(url, { headers: requestHeaders, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} while reading ${url}`);
  return response.text();
}

async function localizeImages(root, logNo) {
  let imageNumber = 0;
  const localizedImages = new Map();
  async function visit(node) {
    if (node.tagName === 'img') {
      const original = safeUrl(attr(node, 'data-lazy-src') || attr(node, 'data-src') || attr(node, 'src'), `https://blog.naver.com/${blogId}/${logNo}`);
      let localized = localizedImages.get(original);
      if (original && !localized && /(^|\.)pstatic\.net$/i.test(new URL(original).hostname)) {
        imageNumber += 1;
        try {
          const response = await fetch(original, { headers: requestHeaders, signal: AbortSignal.timeout(30000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const type = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
          const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' })[type] || path.extname(new URL(original).pathname).slice(1) || 'jpg';
          const folder = path.join(publicRoot, logNo);
          await mkdir(folder, { recursive: true });
          const filename = `image-${String(imageNumber).padStart(2, '0')}.${extension}`;
          await writeFile(path.join(folder, filename), Buffer.from(await response.arrayBuffer()));
          localized = `/portfolio/assets/blog/${logNo}/${filename}`;
          localizedImages.set(original, localized);
        } catch (error) {
          console.warn(`Could not download image for ${logNo}: ${error.message}`);
        }
      }
      const source = localized || original;
      if (source) {
        node.attrs = node.attrs.filter(item => !['src', 'data-src', 'data-lazy-src', 'data-lazyload'].includes(item.name));
        node.attrs.push({ name: 'src', value: source });
      }
    }
    for (const child of node.childNodes || []) await visit(child);
  }
  await visit(root);
}

function renderSafeHtml(node, baseUrl) {
  if (node.nodeName === '#text') {
    if (/^[\t\r\n ]*$/.test(node.value) && /[\r\n]/.test(node.value)) return '';
    return node.value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }
  if (!node.tagName) return (node.childNodes || []).map(child => renderSafeHtml(child, baseUrl)).join('');
  if (['script', 'style', 'noscript', 'svg', 'button', 'input', 'iframe', 'object', 'embed'].includes(node.tagName)) return '';
  if (node.tagName === 'img') {
    const src = safeUrl(attr(node, 'src'), baseUrl);
    const alt = attr(node, 'alt') || '';
    if (!src) return '';
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" loading="lazy" />`;
  }
  const children = (node.childNodes || []).map(child => renderSafeHtml(child, baseUrl)).join('');
  if (node.tagName === 'a') {
    const href = safeUrl(attr(node, 'href'), baseUrl);
    return href ? `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${children}</a>` : children;
  }
  const allowed = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'hr', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code']);
  if (!allowed.has(node.tagName)) return children;
  if (node.tagName === 'br' || node.tagName === 'hr') return `<${node.tagName} />`;
  return `<${node.tagName}>${children}</${node.tagName}>`;
}

function localDate(dateValue) {
  const date = new Date(dateValue);
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = name => parts.find(value => value.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function categoryFor(title, bodyText) {
  const text = `${title} ${bodyText}`;
  if (/외상|trauma|응급수술|전투손상/i.test(text)) return '외상_trauma';
  if (/해커톤|국방|방산|군사|군 의료/i.test(text)) return '군사_military';
  return '생각_thoughts';
}

function descriptionFor(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 118) return normalized;
  const candidate = normalized.slice(0, 118);
  const lastStop = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('다. '), candidate.lastIndexOf('? '), candidate.lastIndexOf('! '));
  return `${candidate.slice(0, lastStop > 50 ? lastStop + 1 : 115).trim()}…`;
}

const rss = await fetchText(feedUrl);
const items = [...rss.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => ({
  title: tagValue(match[1], 'title'),
  link: tagValue(match[1], 'link'),
  date: tagValue(match[1], 'pubDate'),
})).filter(item => item.title && item.link && item.date);

if (items.length === 0) throw new Error('The Naver RSS feed returned no readable posts.');
await mkdir(postsRoot, { recursive: true });

for (const item of items) {
  const link = new URL(item.link);
  const logNo = link.pathname.match(/\/(\d{10,})\/?$/)?.[1] || link.searchParams.get('logNo');
  if (!logNo) throw new Error(`Could not identify a post ID from ${item.link}`);
  const sourceUrl = `https://blog.naver.com/${blogId}/${logNo}`;
  const html = await fetchText(`https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`);
  const document = parse5.parse(html);
  const article = findArticle(document);
  if (!article) throw new Error(`Could not find the article body for ${logNo}`);
  const bodyText = getText(article).replace(/\s+/g, ' ').trim();
  await localizeImages(article, logNo);
  const articleHtml = (article.childNodes || []).map(node => renderSafeHtml(node, sourceUrl)).join('\n');
  const slug = knownSlugs[logNo] || `naver-${logNo}`;
  const filename = `${slug}.md`;
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(item.title)}`,
    `description: ${JSON.stringify(descriptionFor(bodyText))}`,
    `date: ${localDate(item.date)}`,
    `category: ${JSON.stringify(categoryFor(item.title, bodyText))}`,
    'language: ko',
    'draft: false',
    `sourceUrl: ${JSON.stringify(sourceUrl)}`,
    '---',
    '',
    articleHtml,
    '',
  ].join('\n');
  await writeFile(path.join(postsRoot, filename), frontmatter, 'utf8');
  console.log(`Synced ${item.title}`);
}

console.log(`Synchronized ${items.length} public Naver posts.`);
