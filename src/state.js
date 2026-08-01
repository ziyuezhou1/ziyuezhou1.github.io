export const QUALITY_LEVELS = ['low', 'medium', 'high'];

export function chooseQuality({
  width = 1280,
  dpr = 1,
  cores = 8,
  reducedMotion = false,
} = {}) {
  if (reducedMotion || width < 720 || cores <= 4) return 'low';
  if (width < 1180 || dpr > 1.75 || cores <= 8) return 'medium';
  return 'high';
}

export function nextQuality(current) {
  const index = QUALITY_LEVELS.indexOf(current);
  return QUALITY_LEVELS[(index + 1 + QUALITY_LEVELS.length) % QUALITY_LEVELS.length];
}

export function detectLanguage(storage, browserLanguage = 'zh-CN') {
  const saved = storage?.getItem?.('genome-city-language');
  if (saved === 'zh' || saved === 'en') return saved;
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function localize(value, language) {
  if (typeof value === 'string') return value;
  return value?.[language] ?? value?.zh ?? value?.en ?? '';
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
