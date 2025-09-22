import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import i18n, { UI_LANG_STORAGE_KEY, UILanguage } from '../i18n';
import { appConfig, TextLanguageCode } from '../config/appConfig';

export type TextLanguage = TextLanguageCode;
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface LanguageContextValue {
  ready: boolean;
  uiLang: UILanguage;
  textLang: TextLanguage;
  fontScale: number;
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isRTL: boolean;
  setUiLang: (lang: UILanguage) => Promise<void>;
  setTextLang: (lang: TextLanguage) => Promise<void>;
  setFontScale: (scale: number) => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

const noopAsync = async () => undefined;

const DEFAULT_VALUE: LanguageContextValue = {
  ready: false,
  uiLang: appConfig.i18n.defaultUILang,
  textLang: appConfig.i18n.defaultTextLang,
  fontScale: 1,
  theme: 'system',
  resolvedTheme: 'light',
  isRTL: appConfig.i18n.rtlFor.includes(appConfig.i18n.defaultTextLang),
  setUiLang: noopAsync,
  setTextLang: noopAsync,
  setFontScale: noopAsync,
  setTheme: noopAsync,
};

const TEXT_LANG_STORAGE_KEY = 'digital-kholagy:textLang';
const FONT_SCALE_STORAGE_KEY = 'digital-kholagy:fontScale';
const THEME_STORAGE_KEY = 'digital-kholagy:theme';

const supportedUiLangs = new Set(appConfig.i18n.uiLanguages);
const supportedTextLangs = new Set(appConfig.i18n.textLanguages);
const rtlLangs = new Set(appConfig.i18n.rtlFor);
const { scaleMin, scaleMax } = appConfig.theme.typography;

const LanguageContext = createContext<LanguageContextValue>(DEFAULT_VALUE);

const waitForI18n = async () => {
  if (i18n.isInitialized) {
    return;
  }
  await new Promise<void>((resolve) => {
    const handleInitialized = () => {
      i18n.off('initialized', handleInitialized);
      resolve();
    };
    i18n.on('initialized', handleInitialized);
  });
};

const getSystemTheme = (): ResolvedTheme => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiLang, setUiLangState] = useState<UILanguage>(appConfig.i18n.defaultUILang);
  const [textLang, setTextLangState] = useState<TextLanguage>(appConfig.i18n.defaultTextLang);
  const [fontScale, setFontScaleState] = useState<number>(1);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme());
  const [ready, setReady] = useState<boolean>(false);
  const initialisedRef = useRef(false);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      await waitForI18n();
      const currentUILang = (i18n.language as UILanguage) ?? appConfig.i18n.defaultUILang;
      try {
        const [storedTextLang, storedFontScale, storedTheme] = await Promise.all([
          AsyncStorage.getItem(TEXT_LANG_STORAGE_KEY),
          AsyncStorage.getItem(FONT_SCALE_STORAGE_KEY),
          AsyncStorage.getItem(THEME_STORAGE_KEY),
        ]);

        if (!isMounted) {
          return;
        }

        if (supportedUiLangs.has(currentUILang)) {
          setUiLangState(currentUILang);
        }
        if (storedTextLang && supportedTextLangs.has(storedTextLang as TextLanguage)) {
          setTextLangState(storedTextLang as TextLanguage);
        } else {
          setTextLangState(appConfig.i18n.defaultTextLang);
        }
        if (storedFontScale) {
          const parsed = Number(storedFontScale);
          if (!Number.isNaN(parsed)) {
            const clamped = Math.min(scaleMax, Math.max(scaleMin, parsed));
            setFontScaleState(clamped);
          }
        }
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeMode(storedTheme);
        } else {
          setThemeMode('system');
        }
      } catch (error) {
        console.warn('Failed to load preferences', error);
      } finally {
        if (isMounted) {
          initialisedRef.current = true;
          setReady(true);
        }
      }
    };

    load();

    const handleLanguageChanged = (lng: string) => {
      if (supportedUiLangs.has(lng as UILanguage) && isMounted) {
        setUiLangState(lng as UILanguage);
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      isMounted = false;
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemTheme;
    }
    return themeMode;
  }, [systemTheme, themeMode]);

  const isRTL = useMemo(() => uiLang === 'ar' || rtlLangs.has(textLang), [textLang, uiLang]);

  const persist = useCallback(async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Failed to persist ${key}`, error);
    }
  }, []);

  const handleSetUiLang = useCallback(async (lang: UILanguage) => {
    if (!supportedUiLangs.has(lang)) {
      return;
    }
    await i18n.changeLanguage(lang);
    if (!initialisedRef.current) {
      await AsyncStorage.setItem(UI_LANG_STORAGE_KEY, lang);
    }
  }, []);

  const handleSetTextLang = useCallback(
    async (lang: TextLanguage) => {
      if (!supportedTextLangs.has(lang)) {
        return;
      }
      setTextLangState(lang);
      await persist(TEXT_LANG_STORAGE_KEY, lang);
    },
    [persist],
  );

  const handleSetFontScale = useCallback(
    async (scale: number) => {
      if (Number.isNaN(scale)) {
        return;
      }
      const clamped = Math.min(scaleMax, Math.max(scaleMin, Number(scale)));
      setFontScaleState(clamped);
      await persist(FONT_SCALE_STORAGE_KEY, clamped.toString());
    },
    [persist],
  );

  const handleSetTheme = useCallback(
    async (mode: ThemeMode) => {
      const next = mode === 'light' || mode === 'dark' ? mode : 'system';
      setThemeMode(next);
      await persist(THEME_STORAGE_KEY, next);
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      ready,
      uiLang,
      textLang,
      fontScale,
      theme: themeMode,
      resolvedTheme,
      isRTL,
      setUiLang: handleSetUiLang,
      setTextLang: handleSetTextLang,
      setFontScale: handleSetFontScale,
      setTheme: handleSetTheme,
    }),
    [ready, uiLang, textLang, fontScale, themeMode, resolvedTheme, isRTL, handleSetUiLang, handleSetTextLang, handleSetFontScale, handleSetTheme],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
