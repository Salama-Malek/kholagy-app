import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAppConfig } from './AppConfigContext';

interface NotificationPreferences {
  enabled: boolean;
  presets: Record<string, boolean>;
}

interface PreferencesContextValue {
  ready: boolean;
  blueBackground: boolean;
  setBlueBackground: (value: boolean) => Promise<void>;
  notifications: NotificationPreferences;
  setNotificationsEnabled: (value: boolean) => Promise<void>;
  toggleNotificationPreset: (key: string) => Promise<void>;
}

const BLUE_BACKGROUND_KEY = 'digital-kholagy:readerBlueBackground';
const NOTIFICATIONS_ENABLED_KEY = 'digital-kholagy:notifications.enabled';
const presetKey = (preset: string) => `digital-kholagy:notifications.${preset}`;

const noopAsync = async () => undefined;

const PreferencesContext = createContext<PreferencesContextValue>({
  ready: false,
  blueBackground: false,
  setBlueBackground: noopAsync,
  notifications: { enabled: false, presets: {} },
  setNotificationsEnabled: noopAsync,
  toggleNotificationPreset: noopAsync,
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, ready: configReady } = useAppConfig();
  const [blueBackground, setBlueBackgroundState] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreferences>({ enabled: false, presets: {} });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configReady) {
      return;
    }
    let mounted = true;

    const load = async () => {
      try {
        const featureConfig = config.features.notifications ?? { enabled: false, presets: [] as string[] };
        const defaultEnabled = Boolean(featureConfig.enabled);
        const defaultPresets: Record<string, boolean> = {};
        (featureConfig.presets ?? []).forEach((preset) => {
          defaultPresets[preset] = true;
        });

        const presetKeys = Object.keys(defaultPresets);
        const storedValues = await Promise.all([
          AsyncStorage.getItem(BLUE_BACKGROUND_KEY),
          AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
          ...presetKeys.map((key) => AsyncStorage.getItem(presetKey(key))),
        ]);

        if (!mounted) {
          return;
        }

        const [storedBlue, storedNotificationsEnabled, ...presetEntries] = storedValues;

        setBlueBackgroundState(storedBlue === 'true');

        const enabled = defaultEnabled
          ? storedNotificationsEnabled === null
            ? defaultEnabled
            : storedNotificationsEnabled === 'true'
          : false;
        const presets: Record<string, boolean> = { ...defaultPresets };
        presetEntries.forEach((value, index) => {
          const key = presetKeys[index];
          if (value === 'true' || value === 'false') {
            presets[key] = value === 'true';
          }
        });

        setNotifications({ enabled, presets });
      } catch (error) {
        console.warn('Failed to load preferences', error);
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
  }, [config, configReady]);

  const setBlueBackground = useCallback(async (value: boolean) => {
    setBlueBackgroundState(value);
    try {
      await AsyncStorage.setItem(BLUE_BACKGROUND_KEY, value ? 'true' : 'false');
    } catch (error) {
      console.warn('Failed to persist blue background preference', error);
    }
  }, []);

  const setNotificationsEnabled = useCallback(async (value: boolean) => {
    setNotifications((current) => ({ ...current, enabled: value }));
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, value ? 'true' : 'false');
    } catch (error) {
      console.warn('Failed to persist notifications flag', error);
    }
  }, []);

  const toggleNotificationPreset = useCallback(async (key: string) => {
    setNotifications((current) => {
      const currentValue = current.presets[key] ?? true;
      const nextValue = !currentValue;
      const updated = { ...current.presets, [key]: nextValue };
      AsyncStorage.setItem(presetKey(key), nextValue ? 'true' : 'false').catch((error) =>
        console.warn('Failed to persist notification preset', error),
      );
      return { ...current, presets: updated };
    });
  }, []);

  const value = useMemo(
    () => ({
      ready: ready && configReady,
      blueBackground,
      setBlueBackground,
      notifications,
      setNotificationsEnabled,
      toggleNotificationPreset,
    }),
    [ready, configReady, blueBackground, setBlueBackground, notifications, setNotificationsEnabled, toggleNotificationPreset],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => useContext(PreferencesContext);
