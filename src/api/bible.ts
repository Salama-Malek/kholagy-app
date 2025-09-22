import Constants from 'expo-constants';
import { fetchWithCache } from './cache';

export const DEFAULT_BIBLE_IDS: Record<string, string> = {
  en: 'de4e12af7f28f599-02', // King James Version
  ar: '65eec8e0b60e656b-01', // Smith & Van Dyke Arabic
  ru: 'c9e485b1eb295f0c-01', // Synodal Russian Bible
};

const DEFAULT_API_ROOT = 'https://api.scripture.api.bible/v1';

type ExpoExtra = {
  apiBibleKey?: string;
  apiBibleBaseUrl?: string;
};

const resolveApiRoot = () => {
  const fromExtra =
    (Constants.expoConfig?.extra as ExpoExtra | undefined)?.apiBibleBaseUrl ??
    ((Constants as any).manifest2?.extra as ExpoExtra | undefined)?.apiBibleBaseUrl ??
    ((Constants.manifest as any)?.extra as ExpoExtra | undefined)?.apiBibleBaseUrl ??
    (typeof process !== 'undefined'
      ? process.env.API_BIBLE_BASE_URL ?? process.env.EXPO_PUBLIC_API_BIBLE_BASE_URL
      : undefined);
  if (typeof fromExtra === 'string' && fromExtra.trim().length > 0) {
    return fromExtra.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_ROOT;
};

const API_ROOT = resolveApiRoot();
const CACHE_TTL_BOOKS = 1000 * 60 * 60 * 24; // 24 hours
const CACHE_TTL_CHAPTERS = 1000 * 60 * 60 * 12; // 12 hours
const CACHE_TTL_VERSES = 1000 * 60 * 60 * 6; // 6 hours
const CACHE_TTL_SEARCH = 1000 * 60 * 30; // 30 minutes

const getApiKey = (): string => {
  const fromExtra =
    (Constants.expoConfig?.extra as ExpoExtra | undefined)?.apiBibleKey ??
    ((Constants as any).manifest2?.extra as ExpoExtra | undefined)?.apiBibleKey ??
    ((Constants.manifest as any)?.extra as ExpoExtra | undefined)?.apiBibleKey ??
    '';
  const fromEnv =
    typeof process !== 'undefined'
      ? (process.env.API_BIBLE_KEY ?? process.env.EXPO_PUBLIC_API_BIBLE_KEY ?? '').trim()
      : '';
  const apiKey = (typeof fromExtra === 'string' ? fromExtra.trim() : '') || fromEnv;
  if (!apiKey) {
    throw new Error('Missing API.Bible key. Add API_BIBLE_KEY to your .env file.');
  }
  return apiKey;
};

const buildUrl = (endpoint: string, params: Record<string, string | number | undefined> = {}) => {
  const url = new URL(`${API_ROOT}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

const request = async <T>(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<T> => {
  const apiKey = getApiKey();
  const response = await fetch(buildUrl(endpoint, params), {
    headers: {
      Accept: 'application/json',
      'api-key': apiKey,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API.Bible request failed (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
};

const normalizeVerseText = (value?: string | null): string => {
  if (typeof value === 'string') {
    return value.replace(/\s+/g, ' ').trim();
  }
  return '';
};

export interface BibleSummary {
  id: string;
  abbreviation?: string;
  name: string;
  language?: string;
  description?: string;
}

export interface BibleBook {
  id: string;
  abbreviation?: string;
  name: string;
  nameLong?: string;
  chapters?: string[];
  testament?: string;
}

export interface BibleChapter {
  id: string;
  bookId: string;
  number: string;
  reference: string;
}

export interface BibleVerse {
  id: string;
  bookId: string;
  chapterId: string;
  number: string;
  reference: string;
  text: string;
}

export interface BibleChapterContent {
  id: string;
  bookId: string;
  number: string;
  reference: string;
  verses: BibleVerse[];
}

export interface BibleSearchResult {
  id: string;
  verseId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
  snippet?: string;
}

const resolveBibleId = (bibleId?: string, fallbackLang?: string) => {
  if (bibleId) {
    return bibleId;
  }
  if (fallbackLang && DEFAULT_BIBLE_IDS[fallbackLang]) {
    return DEFAULT_BIBLE_IDS[fallbackLang];
  }
  return DEFAULT_BIBLE_IDS.en;
};

export const listBibles = async (): Promise<BibleSummary[]> => {
  const cacheKey = 'bible:list';
  const data = await fetchWithCache<{ data: BibleSummary[] }>(cacheKey, () => request<{ data: BibleSummary[] }>('/bibles'), CACHE_TTL_BOOKS);
  return data.data;
};

export const getBooks = async (bibleId?: string, lang?: string): Promise<BibleBook[]> => {
  const id = resolveBibleId(bibleId, lang);
  const cacheKey = `bible:${id}:books`;
  const data = await fetchWithCache<{ data: BibleBook[] }>(cacheKey, () => request<{ data: BibleBook[] }>(`/bibles/${id}/books`), CACHE_TTL_BOOKS);
  return data.data;
};

export const getChapters = async (bookId: string, bibleId?: string, lang?: string): Promise<BibleChapter[]> => {
  const id = resolveBibleId(bibleId, lang);
  const cacheKey = `bible:${id}:chapters:${bookId}`;
  const data = await fetchWithCache<{ data: BibleChapter[] }>(
    cacheKey,
    () => request<{ data: BibleChapter[] }>(`/bibles/${id}/books/${bookId}/chapters`),
    CACHE_TTL_CHAPTERS,
  );
  return data.data;
};

type ChapterContentNode = {
  id?: string;
  type?: string;
  text?: string;
  value?: string;
  number?: string;
  reference?: string;
  content?: ChapterContentNode[];
  items?: ChapterContentNode[];
  children?: ChapterContentNode[];
  verseId?: string;
};

interface ChapterContentResponse {
  data: {
    id: string;
    bookId: string;
    number: string;
    reference: string;
    content?: ChapterContentNode[];
  };
}

const gatherNodeText = (node?: ChapterContentNode, parts: string[] = []): string[] => {
  if (!node) {
    return parts;
  }
  if (typeof node.text === 'string') {
    parts.push(node.text);
  }
  if (typeof node.value === 'string') {
    parts.push(node.value);
  }
  if (Array.isArray(node.content)) {
    node.content.forEach((child) => gatherNodeText(child, parts));
  }
  if (Array.isArray(node.items)) {
    node.items.forEach((child) => gatherNodeText(child, parts));
  }
  if (Array.isArray(node.children)) {
    node.children.forEach((child) => gatherNodeText(child, parts));
  }
  return parts;
};

const extractVerseFromNode = (node: ChapterContentNode, chapter: { id: string; bookId: string }): BibleVerse | null => {
  if (!node) {
    return null;
  }
  const id = node.id ?? node.verseId ?? '';
  const reference = node.reference ?? '';
  const number = node.number ?? (reference.includes(':') ? reference.split(':').pop() ?? '' : id.split('.').pop() ?? '');
  const text = normalizeVerseText(gatherNodeText(node).join(' '));
  if (!id || !text) {
    return null;
  }
  return {
    id,
    bookId: chapter.bookId,
    chapterId: chapter.id,
    number,
    reference: reference || `${chapter.bookId} ${number}`,
    text,
  };
};

const extractVerses = (nodes: ChapterContentNode[] | undefined, chapter: { id: string; bookId: string }): BibleVerse[] => {
  if (!nodes || nodes.length === 0) {
    return [];
  }
  const verses: BibleVerse[] = [];
  const walk = (node?: ChapterContentNode) => {
    if (!node) {
      return;
    }
    if (node.type === 'verse') {
      const verse = extractVerseFromNode(node, chapter);
      if (verse) {
        verses.push(verse);
      }
      return;
    }
    if (Array.isArray(node.content)) {
      node.content.forEach((child) => walk(child));
    }
    if (Array.isArray(node.items)) {
      node.items.forEach((child) => walk(child));
    }
    if (Array.isArray(node.children)) {
      node.children.forEach((child) => walk(child));
    }
  };
  nodes.forEach((node) => walk(node));
  return verses;
};

export const getChapterContent = async (
  chapterId: string,
  bibleId?: string,
  lang?: string,
): Promise<BibleChapterContent> => {
  const id = resolveBibleId(bibleId, lang);
  const cacheKey = `bible:${id}:chapterContent:${chapterId}`;
  const data = await fetchWithCache<ChapterContentResponse>(
    cacheKey,
    () =>
      request<ChapterContentResponse>(`/bibles/${id}/chapters/${chapterId}`, {
        'content-type': 'json',
        'include-notes': 'false',
      }),
    CACHE_TTL_VERSES,
  );
  const chapter = data.data;
  const verses = extractVerses(chapter.content, { id: chapter.id, bookId: chapter.bookId });
  return {
    id: chapter.id,
    bookId: chapter.bookId,
    number: chapter.number,
    reference: chapter.reference,
    verses,
  };
};

interface SearchResponse {
  data: {
    query: string;
    verses: Array<{
      id: string;
      bibleId: string;
      bookId: string;
      chapterId: string;
      text?: string | null;
      reference: string;
    }>;
  };
}

export const search = async (query: string, bibleId?: string, lang?: string): Promise<BibleSearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const id = resolveBibleId(bibleId, lang);
  const cacheKey = `bible:${id}:search:${trimmed.toLowerCase()}`;
  const data = await fetchWithCache<SearchResponse>(
    cacheKey,
    () =>
      request<SearchResponse>(`/bibles/${id}/search`, {
        query: trimmed,
        limit: 25,
      }),
    CACHE_TTL_SEARCH,
  );
  return data.data.verses.map((verse) => ({
    id: `${verse.id}:${trimmed}`,
    verseId: verse.id,
    bookId: verse.bookId,
    chapterId: verse.chapterId,
    reference: verse.reference,
    text: normalizeVerseText(verse.text),
  }));
};
