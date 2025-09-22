import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { contentMap } from '../contentMap';
import type { TextLanguage } from '../context/LanguageContext';

export interface LiturgyDocument {
  markdown: string;
  language: string;
}

const resolveContentKey = (itemId: string, preferredLanguage: TextLanguage): { key: keyof typeof contentMap; language: string } | null => {
  const desiredKey = `${itemId}:${preferredLanguage}` as keyof typeof contentMap;
  if (contentMap[desiredKey]) {
    return { key: desiredKey, language: preferredLanguage };
  }
  const fallbackKey = `${itemId}:en` as keyof typeof contentMap;
  if (contentMap[fallbackKey]) {
    return { key: fallbackKey, language: 'en' };
  }
  const match = (Object.keys(contentMap) as Array<keyof typeof contentMap>).find((key) => key.startsWith(`${itemId}:`));
  if (match) {
    const [, lang] = (match as string).split(':');
    return { key: match, language: lang ?? preferredLanguage };
  }
  return null;
};

export const loadLiturgyDocument = async (itemId: string, preferredLanguage: TextLanguage): Promise<LiturgyDocument | null> => {
  const resolved = resolveContentKey(itemId, preferredLanguage);
  if (!resolved) {
    return null;
  }
  const assetModule = contentMap[resolved.key]();
  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();
  const assetUri = asset.localUri ?? asset.uri;
  if (!assetUri) {
    return null;
  }
  const markdown = await FileSystem.readAsStringAsync(assetUri, { encoding: FileSystem.EncodingType.UTF8 });
  return { markdown, language: resolved.language };
};

export interface LiturgySearchHit {
  id: string;
  line: number;
  snippet: string;
}

export const searchLiturgyDocument = (
  markdown: string,
  query: string,
  options: { limit?: number } = {},
): LiturgySearchHit[] => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const limit = options.limit ?? 12;
  const lowerQuery = trimmed.toLowerCase();
  const lines = markdown.split(/\r?\n/);
  const hits: LiturgySearchHit[] = [];
  lines.forEach((line, index) => {
    const normalized = line.trim();
    if (!normalized) {
      return;
    }
    if (normalized.toLowerCase().includes(lowerQuery)) {
      const snippet = normalized.length > 220 ? `${normalized.slice(0, 217)}…` : normalized;
      hits.push({ id: `line-${index}`, line: index, snippet });
    }
  });
  return hits.slice(0, limit);
};
