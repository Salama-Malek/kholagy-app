import fs from 'fs';
import path from 'path';
import type { ExpoConfig } from '@expo/config-types';
import appJson from './app.json';

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const contents = fs.readFileSync(envPath, 'utf-8');
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const [key, ...rest] = trimmed.split('=');
    if (!key) {
      return;
    }
    const value = rest.join('=').trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

export default (): ExpoConfig => {
  const baseConfig = (appJson.expo ?? {}) as ExpoConfig;
  const baseExtra = (baseConfig.extra ?? {}) as Record<string, unknown>;
  return {
    ...baseConfig,
    extra: {
      ...baseExtra,
      apiBibleKey: process.env.API_BIBLE_KEY ?? process.env.EXPO_PUBLIC_API_BIBLE_KEY ?? '',
      apiBibleBaseUrl:
        process.env.API_BIBLE_BASE_URL ??
        process.env.EXPO_PUBLIC_API_BIBLE_BASE_URL ??
        'https://api.scripture.api.bible/v1',
      copticBaseUrl:
        process.env.COPTIC_BASE_URL ??
        process.env.EXPO_PUBLIC_COPTIC_BASE_URL ??
        'https://coptic.io',
    },
  } as ExpoConfig;
};
