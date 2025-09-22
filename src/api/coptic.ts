import Constants from 'expo-constants';
import { fetchWithCache } from './cache';

const DEFAULT_API_ROOT = 'https://coptic.io';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const COPTIC_MONTH_TRANSLATIONS: Record<string, string[]> = {
  en: [
    'Thout',
    'Paopi',
    'Hathor',
    'Koiak',
    'Tobe',
    'Meshir',
    'Paremhat',
    'Paremoude',
    'Pashons',
    'Paoni',
    'Epip',
    'Mesori',
    'Nasi',
  ],
  ar: [
    'توت',
    'بابه',
    'هاتور',
    'كيهك',
    'طوبة',
    'أمشير',
    'برمهات',
    'برمودة',
    'بشنس',
    'بؤونة',
    'أبيب',
    'مسرى',
    'نسيء',
  ],
  ru: [
    'Тоут',
    'Баба',
    'Хатор',
    'Кияхк',
    'Тоба',
    'Амшир',
    'Бармахат',
    'Бармуде',
    'Башанс',
    'Пауни',
    'Эпеп',
    'Месра',
    'Наси',
  ],
};

const getExtra = (): Record<string, unknown> => {
  const expoConfigExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const legacyExtra = (Constants.manifest as any)?.extra ?? {};
  return { ...legacyExtra, ...expoConfigExtra };
};

const resolveBaseUrl = () => {
  const extra = getExtra();
  const explicit =
    (extra.copticBaseUrl as string | undefined) ??
    (typeof process !== 'undefined'
      ? process.env.COPTIC_BASE_URL ?? process.env.EXPO_PUBLIC_COPTIC_BASE_URL
      : undefined);
  const base = explicit ?? DEFAULT_API_ROOT;
  return base.replace(/\/$/, '');
};

const API_ROOT = resolveBaseUrl();

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildUrl = (path: string) => {
  const trimmed = path.replace(/^\/+/, '');
  return `${API_ROOT}/${trimmed}`;
};

const requestJson = async (path: string): Promise<any> => {
  const url = buildUrl(path);
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Coptic.io request failed (${response.status}): ${body || response.statusText}`);
  }
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Invalid JSON response from ${url}: ${(error as Error).message}`);
  }
};

const requestWithFallback = async (paths: string[]): Promise<any> => {
  const attempts = paths.map((candidate) => candidate.trim()).filter(Boolean);
  let lastError: Error | null = null;
  for (const candidate of attempts) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await requestJson(candidate);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error('Unable to contact coptic.io');
};

export interface CopticDateInfo {
  copticYear: number;
  copticMonth: number;
  copticDay: number;
  copticMonthName: string;
}

export type ReadingService = 'matins' | 'vespers' | 'liturgy';

export interface DailyReadingItem {
  id: string;
  title: string;
  reference?: string;
  text?: string;
  source?: string;
}

export interface DailyReadings {
  matins: DailyReadingItem[];
  vespers: DailyReadingItem[];
  liturgy: DailyReadingItem[];
}

const normaliseString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return undefined;
};

const ensureArray = (value: unknown): unknown[] => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'object') {
    const entries = (value as any).entries ?? (value as any).items ?? (value as any).readings;
    if (Array.isArray(entries)) {
      return entries;
    }
    return Object.values(value as Record<string, unknown>);
  }
  return [];
};

const normaliseReadingItem = (
  raw: any,
  index: number,
  service: ReadingService,
): DailyReadingItem => {
  const title =
    normaliseString(raw?.title) ??
    normaliseString(raw?.name) ??
    normaliseString(raw?.section) ??
    normaliseString(raw?.reading) ??
    normaliseString(raw?.description) ??
    `Reading ${index + 1}`;

  const reference =
    normaliseString(raw?.citation) ??
    normaliseString(raw?.reference) ??
    normaliseString(raw?.ref) ??
    normaliseString(raw?.passage);

  let text = normaliseString(raw?.text) ?? normaliseString(raw?.content) ?? normaliseString(raw?.body);
  if (!text && Array.isArray(raw?.verses)) {
    text = raw.verses.map((verse: unknown) => normaliseString(verse) ?? '').filter(Boolean).join('\n');
  }

  const source =
    normaliseString(raw?.service) ??
    normaliseString(raw?.type) ??
    normaliseString(raw?.liturgicalUse) ??
    (service === 'matins'
      ? 'Matins'
      : service === 'vespers'
      ? 'Vespers'
      : 'Liturgy');

  const id = normaliseString(raw?.id) ?? normaliseString(raw?.slug) ?? `${service}-${index}`;

  return {
    id,
    title,
    reference: reference || undefined,
    text: text || undefined,
    source,
  };
};

const normaliseServiceReadings = (payload: unknown, service: ReadingService): DailyReadingItem[] => {
  const list = ensureArray(payload);
  return list
    .map((item, index) => normaliseReadingItem(item, index, service))
    .filter((item) => item.title || item.reference || item.text);
};

const extractCopticSegment = (payload: any): any => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (payload.coptic) {
    return payload.coptic;
  }
  if (payload.copticDate) {
    return payload.copticDate;
  }
  if (payload.data?.coptic) {
    return payload.data.coptic;
  }
  if (payload.data?.calendar?.coptic) {
    return payload.data.calendar.coptic;
  }
  return payload;
};

const extractReadingsSegment = (payload: any): any => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (payload.readings) {
    return payload.readings;
  }
  if (payload.data?.readings) {
    return payload.data.readings;
  }
  if (payload.data?.calendar?.readings) {
    return payload.data.calendar.readings;
  }
  return payload;
};

const resolveMonthName = (month: number, fallback?: string) => {
  const index = Number.isFinite(month) ? Math.max(0, Math.min(12, Math.round(month) - 1)) : -1;
  if (index >= 0 && COPTIC_MONTH_TRANSLATIONS.en[index]) {
    return fallback ?? COPTIC_MONTH_TRANSLATIONS.en[index];
  }
  return fallback ?? '';
};

export const getLocalizedCopticMonthName = (month: number, language: string, fallback?: string): string => {
  const normalizedLang = language?.toLowerCase?.() ?? 'en';
  const index = Number.isFinite(month) ? Math.max(0, Math.min(12, Math.round(month) - 1)) : -1;
  const fallbackName = resolveMonthName(month, fallback);
  const translations = COPTIC_MONTH_TRANSLATIONS[normalizedLang];
  if (translations && index >= 0 && translations[index]) {
    return translations[index];
  }
  return fallbackName;
};

const parseCopticDate = (payload: any, iso: string): CopticDateInfo => {
  const segment = extractCopticSegment(payload);
  const year = Number(segment?.year ?? segment?.copticYear);
  const month = Number(segment?.month ?? segment?.copticMonth);
  const day = Number(segment?.day ?? segment?.copticDay ?? segment?.dayOfMonth);
  let monthName = normaliseString(segment?.monthName ?? segment?.copticMonthName);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error(`Unable to parse Coptic date payload for ${iso}`);
  }

  if (!monthName) {
    monthName = resolveMonthName(month);
  }

  return {
    copticYear: year,
    copticMonth: month,
    copticDay: day,
    copticMonthName: monthName ?? resolveMonthName(month),
  };
};

const parseDailyReadings = (payload: any): DailyReadings => {
  const segment = extractReadingsSegment(payload) ?? {};
  const matins =
    segment.matins ?? segment.Matins ?? segment.morning ?? segment.morningReadings ?? segment.matinsReadings ?? null;
  const vespers =
    segment.vespers ??
    segment.Vespers ??
    segment.evening ??
    segment.eveningReadings ??
    segment.vespersReadings ??
    segment.eveningPrayer ??
    null;
  const liturgy =
    segment.liturgy ??
    segment.Liturgy ??
    segment.divineLiturgy ??
    segment.mass ??
    segment.liturgyReadings ??
    segment.massReadings ??
    null;

  return {
    matins: normaliseServiceReadings(matins, 'matins'),
    vespers: normaliseServiceReadings(vespers, 'vespers'),
    liturgy: normaliseServiceReadings(liturgy, 'liturgy'),
  };
};

export const getCopticDate = async (gregorianDate: Date): Promise<CopticDateInfo> => {
  const iso = toIsoDate(gregorianDate);
  return fetchWithCache(`coptic:date:${iso}`, async () => {
    const payload = await requestWithFallback([
      `api/v1/calendar/gregorian/${iso}`,
      `api/calendar/gregorian/${iso}`,
      `calendar/gregorian/${iso}`,
      `api/v1/calendar/day?date=${iso}`,
      `calendar/day?date=${iso}`,
    ]);
    return parseCopticDate(payload, iso);
  }, CACHE_TTL_MS);
};

export const getDailyReadings = async (
  copticYear: number,
  month: number,
  day: number,
): Promise<DailyReadings> => {
  const key = `coptic:readings:${copticYear}-${month}-${day}`;
  return fetchWithCache(key, async () => {
    const payload = await requestWithFallback([
      `api/v1/readings/${copticYear}/${month}/${day}`,
      `api/readings/${copticYear}/${month}/${day}`,
      `readings/${copticYear}/${month}/${day}`,
      `api/v1/calendar/coptic/${copticYear}/${month}/${day}`,
      `calendar/coptic/${copticYear}/${month}/${day}`,
    ]);
    return parseDailyReadings(payload ?? {});
  }, CACHE_TTL_MS);
};
