export const categories = [
  { id: '외상_trauma', en: 'Trauma', ko: '외상' },
  { id: '군사_military', en: 'Military', ko: '군사' },
  { id: '생각_thoughts', en: 'Thoughts', ko: '생각' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];
