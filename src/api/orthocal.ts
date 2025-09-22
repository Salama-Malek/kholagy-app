import { fetchWithCache } from './cache';

const API_ROOT = 'https://orthocal.info/api/oca';
const CACHE_TTL_DAY = 1000 * 60 * 60 * 12; // 12 hours

type QueryParams = Record<string, string | number | undefined>;

const toDateParam = (input: Date | string): string => {
  if (typeof input === 'string') {
    return input.slice(0, 10);
  }
  const year = input.getFullYear();
  const month = `${input.getMonth() + 1}`.padStart(2, '0');
  const day = `${input.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildUrl = (path: string, params: QueryParams = {}) => {
  const url = new URL(`${API_ROOT}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const request = async <T>(path: string, params: QueryParams = {}): Promise<T> => {
  const response = await fetch(buildUrl(path, params), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Orthocal request failed (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
};

export interface DailyReading {
  id: string;
  title: string;
  citation?: string;
  text?: string;
  service?: string;
}

interface DailyResponse {
  date: string;
  readings?: Array<{
    title?: string;
    display?: string;
    book?: string;
    cite?: string;
    text?: string;
    service?: string;
  }>;
}

export const getDailyReadings = async (date: Date | string): Promise<DailyReading[]> => {
  const day = toDateParam(date);
  const cacheKey = `orthocal:readings:${day}`;
  const data = await fetchWithCache<DailyResponse>(
    cacheKey,
    () => request<DailyResponse>('/daily/', { date: day }),
    CACHE_TTL_DAY,
  );
  return (data.readings ?? []).map((entry, index) => ({
    id: `${day}:reading:${index}`,
    title: entry.title ?? entry.display ?? 'Reading',
    citation: entry.cite ?? entry.book,
    text: entry.text,
    service: entry.service,
  }));
};

export interface FeastDay {
  id: string;
  title: string;
  rank?: string;
  color?: string;
  description?: string;
}

interface FeastsResponse {
  date: string;
  feasts?: Array<{
    title?: string;
    rank?: string;
    color?: string;
    description?: string;
  }>;
}

export const getFeasts = async (date: Date | string): Promise<FeastDay[]> => {
  const day = toDateParam(date);
  const cacheKey = `orthocal:feasts:${day}`;
  const data = await fetchWithCache<FeastsResponse>(
    cacheKey,
    () => request<FeastsResponse>('/feastdays/', { date: day }),
    CACHE_TTL_DAY,
  );
  return (data.feasts ?? []).map((entry, index) => ({
    id: `${day}:feast:${index}`,
    title: entry.title ?? 'Feast',
    rank: entry.rank,
    color: entry.color,
    description: entry.description,
  }));
};

export interface FastInfo {
  id: string;
  name: string;
  fastingLevel?: string;
  color?: string;
  description?: string;
}

interface FastsResponse {
  date: string;
  fasts?: Array<{
    name?: string;
    fasting_level?: string;
    color?: string;
    description?: string;
  }>;
}

export const getFastInfo = async (date: Date | string): Promise<FastInfo[]> => {
  const day = toDateParam(date);
  const cacheKey = `orthocal:fasts:${day}`;
  const data = await fetchWithCache<FastsResponse>(
    cacheKey,
    () => request<FastsResponse>('/fasts/', { date: day }),
    CACHE_TTL_DAY,
  );
  return (data.fasts ?? []).map((entry, index) => ({
    id: `${day}:fast:${index}`,
    name: entry.name ?? 'Fast',
    fastingLevel: entry.fasting_level,
    color: entry.color,
    description: entry.description,
  }));
};
