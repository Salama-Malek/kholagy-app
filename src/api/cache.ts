import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'digital-kholagy:cache:';

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export const fetchWithCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
): Promise<T> => {
  const storageKey = `${CACHE_PREFIX}${key}`;
  const raw = await AsyncStorage.getItem(storageKey);
  let cached: CacheEntry<T> | null = null;

  if (raw) {
    try {
      cached = JSON.parse(raw) as CacheEntry<T>;
      if (Date.now() - cached.timestamp < ttlMs && cached.data !== undefined) {
        return cached.data;
      }
    } catch (error) {
      console.warn('Failed to parse cache entry', error);
    }
  }

  try {
    const fresh = await fetcher();
    const entry: CacheEntry<T> = { timestamp: Date.now(), data: fresh };
    await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
    return fresh;
  } catch (error) {
    if (cached?.data !== undefined) {
      console.warn(`Using cached data for key ${key} due to fetch error`, error);
      return cached.data;
    }
    throw error;
  }
};

export const clearCacheKey = async (key: string) => {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn('Failed to clear cache key', key, error);
  }
};
