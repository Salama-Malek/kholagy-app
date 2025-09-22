import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { appConfig, AppConfig, AppVariantKey } from '../config/appConfig';

interface AppConfigContextValue {
  ready: boolean;
  config: AppConfig;
  variant: AppVariantKey;
  setVariant: (variant: AppVariantKey) => Promise<void>;
  availableVariants: AppVariantKey[];
}

const VARIANT_STORAGE_KEY = 'digital-kholagy:variant';
const VARIANT_OPTIONS: AppVariantKey[] = ['default', 'kholagyFocus'];

const noopAsync = async () => undefined;

const AppConfigContext = createContext<AppConfigContextValue>({
  ready: false,
  config: appConfig,
  variant: 'default',
  setVariant: noopAsync,
  availableVariants: VARIANT_OPTIONS,
});

type AnyRecord = Record<string, unknown>;
type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>;
};

const mergeInto = (target: AnyRecord, source: AnyRecord) => {
  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      target[key] = value.map((item) => (typeof item === 'object' ? JSON.parse(JSON.stringify(item)) : item));
      return;
    }
    if (value && typeof value === 'object') {
      const baseValue = target[key];
      if (baseValue && typeof baseValue === 'object') {
        mergeInto(baseValue as AnyRecord, value as AnyRecord);
      } else {
        target[key] = JSON.parse(JSON.stringify(value));
      }
      return;
    }
    target[key] = value;
  });
};

const cloneConfig = (): Mutable<AppConfig> => JSON.parse(JSON.stringify(appConfig)) as Mutable<AppConfig>;

const resolveConfigForVariant = (variant: AppVariantKey): AppConfig => {
  if (variant !== 'kholagyFocus') {
    return cloneConfig();
  }
  const cloned = cloneConfig();
  const { navigation, home, features } = appConfig.kholagyFocusVariant;
  if (navigation?.tabs) {
    const tabs = cloned.navigation.tabs as unknown as AnyRecord[];
    tabs.length = 0;
    navigation.tabs.forEach((tab) => {
      tabs.push(JSON.parse(JSON.stringify(tab)));
    });
  }
  if (home?.sections) {
    const sections = cloned.home.sections as unknown as AnyRecord[];
    sections.length = 0;
    if (Array.isArray(home.sections)) {
      home.sections.forEach((section) => {
        sections.push(typeof section === 'object' ? JSON.parse(JSON.stringify(section)) : section);
      });
    }
  }
  if (features) {
    mergeInto(cloned.features as AnyRecord, features as AnyRecord);
  }
  return cloned as AppConfig;
};

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [variant, setVariantState] = useState<AppVariantKey>('default');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(VARIANT_STORAGE_KEY);
        if (stored && VARIANT_OPTIONS.includes(stored as AppVariantKey) && mounted) {
          setVariantState(stored as AppVariantKey);
        }
      } catch (error) {
        console.warn('Failed to load variant', error);
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setVariant = useCallback(async (next: AppVariantKey) => {
    if (!VARIANT_OPTIONS.includes(next)) {
      return;
    }
    setVariantState(next);
    try {
      await AsyncStorage.setItem(VARIANT_STORAGE_KEY, next);
    } catch (error) {
      console.warn('Failed to persist variant', error);
    }
  }, []);

  const config = useMemo(() => resolveConfigForVariant(variant), [variant]);

  const value = useMemo(
    () => ({
      ready,
      config,
      variant,
      setVariant,
      availableVariants: VARIANT_OPTIONS,
    }),
    [ready, config, variant, setVariant],
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
};

export const useAppConfig = () => useContext(AppConfigContext);
