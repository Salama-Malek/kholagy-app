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
  const base = appJson.expo ?? {};
  return {
    ...base,
    extra: {
      ...(base.extra ?? {}),
      apiBibleKey: process.env.API_BIBLE_KEY ?? '',
    },
  } as ExpoConfig;
};
