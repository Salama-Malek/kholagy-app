import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '../src/context/AppConfigContext';
import { useLanguage } from '../src/context/LanguageContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
});

const BibleScreen: React.FC = () => {
  const { config } = useAppConfig();
  const { resolvedTheme, isRTL } = useLanguage();
  const { t } = useTranslation();

  const palette = config.theme[resolvedTheme];
  const bibleConfig = config.features.bible;

  if (!bibleConfig.enabled) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: palette.textSecondary, fontSize: 16, textAlign: 'center' }}>
          Coming soon.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View style={[styles.section, { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider }]}>
        <Text style={[styles.sectionHeader, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>Languages</Text>
        <View style={[styles.pillRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {bibleConfig.languages.map((lang) => (
            <View key={lang} style={[styles.pill, { backgroundColor: palette.accent + '22' }]}
            >
              <Text style={[styles.pillLabel, { color: palette.accent }]}>{lang.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider }]}>
        <Text style={[styles.sectionHeader, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>Included books</Text>
        <View style={[styles.pillRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {bibleConfig.includes.map((entry) => (
            <View key={entry} style={[styles.pill, { backgroundColor: palette.primary + '22' }]}
            >
              <Text style={[styles.pillLabel, { color: palette.primary }]}>{entry.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider }]}>
        <Text style={[styles.sectionHeader, { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>Highlights</Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="text-box-search-outline" size={22} color={palette.primary} />
          <Text style={[styles.infoText, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>Full text search with highlight</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="bookmark-outline" size={22} color={palette.primary} />
          <Text style={[styles.infoText, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>Bookmarks and daily plans</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="share-variant" size={22} color={palette.primary} />
          <Text style={[styles.infoText, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>Copy & share highlighted verses</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default BibleScreen;
