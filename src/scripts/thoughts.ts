type SearchEntry = { id: string; title: string; description: string; body: string; category: string };

function initThoughts() {
  const root = document.querySelector<HTMLElement>('.thoughts-page');
  if (!root) return;
  const input = root.querySelector<HTMLInputElement>('#thought-search')!;
  const indexElement = root.querySelector<HTMLScriptElement>('#post-search-index')!;
  const entries = JSON.parse(indexElement.textContent || '[]') as SearchEntry[];
  const cards = [...root.querySelectorAll<HTMLElement>('[data-post-id]')];
  const cardById = new Map(cards.map(card => [card.dataset.postId, card]));
  const list = root.querySelector<HTMLElement>('[data-post-list]')!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-category]')];
  const emptyAll = root.querySelector<HTMLElement>('[data-empty-all]')!;
  const emptySearch = root.querySelector<HTMLElement>('[data-empty-search]')!;
  const count = root.querySelector<HTMLElement>('[data-results-count]')!;
  const url = new URL(location.href);
  let category = buttons.some(button => button.dataset.category === url.searchParams.get('category')) ? url.searchParams.get('category')! : 'all';
  input.value = url.searchParams.get('q') || '';

  function sync() {
    const language = document.documentElement.lang === 'ko' ? 'ko' : 'en';
    input.placeholder = input.dataset[language === 'ko' ? 'placeholderKo' : 'placeholderEn'] || '';
    const query = input.value.trim().normalize('NFC').toLocaleLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    let visible = 0;
    const ranked = entries.map((entry, order) => {
      const title = entry.title.normalize('NFC').toLocaleLowerCase();
      const description = entry.description.normalize('NFC').toLocaleLowerCase();
      const body = entry.body.normalize('NFC').toLocaleLowerCase();
      const match = (category === 'all' || entry.category === category) && words.every(word => title.includes(word) || description.includes(word) || body.includes(word));
      const score = words.reduce((sum, word) => sum + (title.includes(word) ? 3 : description.includes(word) ? 2 : body.includes(word) ? 1 : 0), 0);
      const card = cardById.get(entry.id)!;
      card.hidden = !match;
      if (match) visible++;
      return { card, score, order };
    });
    ranked.sort((a, b) => words.length ? b.score - a.score || a.order - b.order : a.order - b.order);
    ranked.forEach(item => list.append(item.card));
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    emptyAll.hidden = entries.length !== 0;
    emptySearch.hidden = entries.length === 0 || visible !== 0;
    count.textContent = language === 'ko' ? `${visible}개의 글` : `${visible} ${visible === 1 ? 'note' : 'notes'}`;
    const nextUrl = new URL(location.href);
    if (query) nextUrl.searchParams.set('q', input.value.trim()); else nextUrl.searchParams.delete('q');
    if (category !== 'all') nextUrl.searchParams.set('category', category); else nextUrl.searchParams.delete('category');
    history.replaceState(history.state, '', nextUrl);
    try { sessionStorage.setItem('thoughts-last-url', nextUrl.pathname + nextUrl.search); } catch (_) {}
  }
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.category || 'all'; sync(); }));
  input.addEventListener('input', sync);
  root.querySelectorAll<HTMLAnchorElement>('.post-preview a').forEach(link => link.addEventListener('click', () => {
    try { sessionStorage.setItem('thoughts-scroll-y', String(scrollY)); } catch (_) {}
  }));
  sync();
  try {
    const storedUrl = sessionStorage.getItem('thoughts-last-url');
    const storedY = sessionStorage.getItem('thoughts-scroll-y');
    if (storedUrl === location.pathname + location.search && storedY) {
      requestAnimationFrame(() => scrollTo(0, Number(storedY)));
      sessionStorage.removeItem('thoughts-scroll-y');
    }
  } catch (_) {}
  const onLanguage = () => { if (root.isConnected) sync(); };
  document.addEventListener('portfolio:language', onLanguage);
  document.addEventListener('astro:before-swap', () => document.removeEventListener('portfolio:language', onLanguage), { once: true });
  const keyboardController = new AbortController();
  document.addEventListener('astro:before-swap', () => keyboardController.abort(), { once: true });
  document.addEventListener('keydown', event => {
    if (root.isConnected && event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
      event.preventDefault(); input.focus();
    }
  }, { signal: keyboardController.signal });
}

document.addEventListener('astro:page-load', initThoughts);
