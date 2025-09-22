import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../src/context/LanguageContext';
import { useAppConfig } from '../src/context/AppConfigContext';
import { usePreferences } from '../src/context/PreferencesContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 15,
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  footer: {
    fontSize: 12,
  },
});

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const {
    uiLang,
    textLang,
    fontScale,
    theme,
    resolvedTheme,
    isRTL,
    setUiLang,
    setTextLang,
    setFontScale,
    setTheme,
  } = useLanguage();
  const { config, availableVariants, variant, setVariant } = useAppConfig();
  const {
    ready: preferencesReady,
    blueBackground,
    setBlueBackground,
    notifications,
    setNotificationsEnabled,
    toggleNotificationPreset,
  } = usePreferences();

  const palette = config.theme[resolvedTheme];
  const typography = config.theme.typography;
  const settingsConfig = config.screens.SettingsScreen;
  const fontScaleSection = settingsConfig.sections.find((section) => section.key === 'fontScale') as
    | { min: number; max: number; step: number }
    | undefined;
  const themeOptions = (settingsConfig.sections.find((section) => section.key === 'theme')?.options ?? ['light', 'dark', 'system']) as Array<typeof theme>;

  const uiLabels: Record<string, string> = {
    en: 'English',
    ar: 'العربية',
    ru: 'Русский',
  };

  const textLabels: Record<string, string> = {
    ar: 'العربية',
    en: 'English',
    ru: 'Русский',
    cop: 'Coptic',
    arcop: 'Arabic (Coptic)',
  };

  if (!preferencesReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <Text style={{ color: palette.textSecondary }}>...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.background }]} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.heading, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.uiLanguage')}</Text>
        <View style={[styles.pillRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {config.i18n.uiLanguages.map((code) => {
            const active = uiLang === code;
            return (
              <Pressable key={code} onPress={() => { void setUiLang(code); }}>
                <View
                  style={{
                    ...styles.pill,
                    backgroundColor: active ? palette.primary : palette.surface,
                    borderColor: active ? palette.primary : palette.divider,
                  }}
                >
                  <Text style={{ color: active ? palette.background : palette.textPrimary }}>{uiLabels[code] ?? code.toUpperCase()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.textLanguage')}</Text>
        <View style={[styles.pillRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {config.i18n.textLanguages.map((code) => {
            const active = textLang === code;
            return (
              <Pressable key={code} onPress={() => { void setTextLang(code); }}>
                <View
                  style={{
                    ...styles.pill,
                    backgroundColor: active ? palette.accent : palette.surface,
                    borderColor: active ? palette.accent : palette.divider,
                  }}
                >
                  <Text style={{ color: active ? palette.background : palette.textPrimary }}>{textLabels[code] ?? code.toUpperCase()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.fontSize')}</Text>
        <Slider
          minimumValue={fontScaleSection?.min ?? typography.scaleMin}
          maximumValue={fontScaleSection?.max ?? typography.scaleMax}
          step={fontScaleSection?.step ?? 0.05}
          value={fontScale}
          onSlidingComplete={(value) => { void setFontScale(value); }}
          minimumTrackTintColor={palette.primary}
          maximumTrackTintColor={palette.divider}
          thumbTintColor={palette.primary}
        />
        <Text style={{ color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }}>{fontScale.toFixed(2)}x</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.theme')}</Text>
        <View style={[styles.pillRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {themeOptions.map((mode) => {
            const active = theme === mode;
            const labelKey = mode === 'light' ? 'settings.themeLight' : mode === 'dark' ? 'settings.themeDark' : 'settings.themeSystem';
            return (
              <Pressable key={mode} onPress={() => { void setTheme(mode); }}>
                <View
                  style={{
                    ...styles.pill,
                    backgroundColor: active ? palette.primary : palette.surface,
                    borderColor: active ? palette.primary : palette.divider,
                  }}
                >
                  <Text style={{ color: active ? palette.background : palette.textPrimary }}>{t(labelKey)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {config.features.notifications?.enabled ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.notifications')}</Text>
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.notificationsEnabled')}</Text>
            <Switch
              value={notifications.enabled}
              onValueChange={(value) => { void setNotificationsEnabled(value); }}
              trackColor={{ true: palette.primary, false: palette.divider }}
              thumbColor={palette.surface}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: palette.divider }]} />
          {config.features.notifications.presets.map((preset) => (
            <View key={preset} style={styles.optionRow}>
              <Text style={[styles.optionLabel, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t(`settings.preset.${preset}`)}</Text>
              <Switch
                value={notifications.presets[preset] ?? true}
                disabled={!notifications.enabled}
                onValueChange={() => { void toggleNotificationPreset(preset); }}
                trackColor={{ true: palette.accent, false: palette.divider }}
                thumbColor={palette.surface}
              />
            </View>
          ))}
        </View>
      ) : null}

      {config.features.customization.blueBackgroundToggle ? (
        <View style={styles.section}>
          <Text style={[styles.heading, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.customization')}</Text>
          <View style={styles.optionRow}>
            <Text style={[styles.optionLabel, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.blueBackground')}</Text>
            <Switch
              value={blueBackground}
              onValueChange={(value) => { void setBlueBackground(value); }}
              trackColor={{ true: palette.accent, false: palette.divider }}
              thumbColor={palette.surface}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.heading, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.variantLabel')}</Text>
        <View style={[styles.pillRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {availableVariants.map((option) => {
            const active = variant === option;
            const labelKey = option === 'default' ? 'settings.variantDefault' : 'settings.variantKholagy';
            return (
              <Pressable key={option} onPress={() => { void setVariant(option); }}>
                <View
                  style={{
                    ...styles.pill,
                    backgroundColor: active ? palette.primary : palette.surface,
                    borderColor: active ? palette.primary : palette.divider,
                  }}
                >
                  <Text style={{ color: active ? palette.background : palette.textPrimary }}>{t(labelKey)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={[styles.footer, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{config.legal.copyrightNotice}</Text>
    </ScrollView>
  );
};

export default SettingsScreen;
