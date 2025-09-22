import { synaxariumMap } from './synaxariumMap';

export interface SynaxariumEntry {
  title: string;
  story: string;
}

const normaliseText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return '';
};

const normaliseEntry = (value: any): SynaxariumEntry | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const title = normaliseText(value.title ?? value.name ?? value.heading ?? '');
  const story = normaliseText(value.story ?? value.text ?? value.description ?? '');
  if (!title && !story) {
    return null;
  }
  return {
    title: title || story.slice(0, 48),
    story,
  };
};

const normalizeLang = (lang: string): string => {
  if (!lang) {
    return 'en';
  }
  const normalised = lang.toLowerCase();
  if (normalised.startsWith('ar')) {
    return 'ar';
  }
  if (normalised.startsWith('ru')) {
    return 'ru';
  }
  if (normalised.startsWith('en')) {
    return 'en';
  }
  return normalised;
};

const buildCandidateKeys = (lang: string, month: number, day: number): string[] => {
  const safeMonth = Math.max(1, Math.min(13, Math.trunc(month)));
  const safeDay = Math.max(1, Math.min(31, Math.trunc(day)));
  const baseLang = normalizeLang(lang);
  const keys = [`${baseLang}-${safeMonth}-${safeDay}`];
  if (baseLang !== 'en') {
    keys.push(`en-${safeMonth}-${safeDay}`);
  }
  return Array.from(new Set(keys));
};

export const getSynaxarium = async (month: number, day: number, lang: string): Promise<SynaxariumEntry[]> => {
  const keys = buildCandidateKeys(lang, month, day);
  for (const key of keys) {
    const loader = synaxariumMap[key];
    if (!loader) {
      continue;
    }
    try {
      const moduleResult = loader();
      const data = (moduleResult as any)?.default ?? moduleResult;
      const entries = Array.isArray(data) ? data : [];
      const normalised = entries.map((entry) => normaliseEntry(entry)).filter((entry): entry is SynaxariumEntry => Boolean(entry));
      if (normalised.length > 0) {
        return normalised;
      }
    } catch (error) {
      console.warn(`Failed to load synaxarium entry ${key}`, error);
    }
  }
  return [];
};
