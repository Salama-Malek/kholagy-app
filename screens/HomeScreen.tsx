import React, { useCallback, useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TabParamList } from '../navigation/types';
import { useAppConfig } from '../src/context/AppConfigContext';
import { useLanguage } from '../src/context/LanguageContext';

const quickAccessIcons: Record<string, string> = {
  bible: 'book-open-variant',
  kholagy: 'church',
  agpeya: 'book-open-page-variant',
  synaxarium: 'calendar-star',
  psalmody: 'music-note-outline',
  feastsCalendar: 'calendar-month-outline',
};

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
  sectionSubText: {
    fontSize: 14,
    marginTop: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickTile: {
    flexBasis: '48%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickTileLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  tickerItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tickerText: {
    fontSize: 14,
  },
  badge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { config } = useAppConfig();
  const { resolvedTheme, isRTL, uiLang } = useLanguage();
  const { t } = useTranslation();

  const palette = config.theme[resolvedTheme];

  const sections = config.home.sections;

  const dailyReadingsEnabled = sections.some((section) => section.key === 'dailyReadingsShortcut' && section.visible);
  const quickAccessSection = sections.find((section) => section.key === 'quickAccessGrid');
  const messagesEnabled = sections.some((section) => section.key === 'messagesTicker' && section.visible);

  const quickAccessItems = useMemo(() => {
    if (!quickAccessSection || !('items' in quickAccessSection)) {
      return [] as string[];
    }
    return (quickAccessSection.items ?? []).filter((itemKey: string) => {
      const feature = (config.features as Record<string, any>)[itemKey];
      if (!feature) {
        return true;
      }
      if (typeof feature === 'object' && 'enabled' in feature) {
        return feature.enabled !== false;
      }
      return true;
    });
  }, [config.features, quickAccessSection]);

  const messages = useMemo(() => {
    const localizedSamples: Record<typeof uiLang, string[]> = {
      ar: [
        'تذكير: قداس القديس باسيليوس غدًا الساعة ٨ صباحًا.',
        'صلاة خاصة من أجل المرضى بعد القداس الأول.',
      ],
      en: [
        'Reminder: St. Basil liturgy tomorrow at 8:00 AM.',
        'Special prayer for the sick after the first liturgy.',
      ],
      ru: [
        'Напоминание: литургия св. Василия завтра в 8:00.',
        'Особая молитва о больных после первой литургии.',
      ],
    };
    return localizedSamples[uiLang] ?? localizedSamples.en;
  }, [uiLang]);

  const handleQuickAccessPress = useCallback(
    (key: string) => {
      switch (key) {
        case 'bible':
          navigation.navigate('bible');
          break;
        case 'kholagy':
          navigation.navigate('kholagy', { category: 'kholagy' });
          break;
        case 'agpeya':
        case 'prayers':
          navigation.navigate('prayers', { category: 'prayers' });
          break;
        case 'fractions':
          navigation.navigate('fractions', { category: 'fractions' });
          break;
        default:
          navigation.navigate('more');
          break;
      }
    },
    [navigation],
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {dailyReadingsEnabled ? (
        <Pressable
          onPress={() => handleQuickAccessPress('bible')}
          style={[styles.section, { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider }]}
        >
          <Text
            style={{
              ...styles.sectionHeader,
              color: palette.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('home.dailyReadingsTitle')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: palette.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('home.dailyReadingsCta')}
          </Text>
          <View style={[styles.badge, { backgroundColor: palette.accent + '22' }]}
          >
            <Text style={[styles.badgeLabel, { color: palette.accent }]}>{new Date().toLocaleDateString(uiLang)}</Text>
          </View>
        </Pressable>
      ) : null}

      {quickAccessItems.length > 0 ? (
        <View style={[styles.section, { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider }]}
        >
          <Text
            style={{
              ...styles.sectionHeader,
              color: palette.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('home.quickAccessTitle')}
          </Text>
          <View style={[styles.quickGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            {quickAccessItems.map((itemKey) => {
              const iconName = quickAccessIcons[itemKey] ?? 'star-outline';
              return (
                <Pressable
                  key={itemKey}
                  onPress={() => handleQuickAccessPress(itemKey)}
                  style={[styles.quickTile, { backgroundColor: palette.background, borderWidth: 1, borderColor: palette.divider }]}
                >
                  <MaterialCommunityIcons name={iconName as any} size={24} color={palette.primary} />
                  <Text style={[styles.quickTileLabel, { color: palette.textPrimary }]}>{t(`quickAccess.${itemKey}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {messagesEnabled ? (
        <View style={[styles.section, { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider }]}
        >
          <Text
            style={{
              ...styles.sectionHeader,
              color: palette.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('home.messagesTitle')}
          </Text>
          {messages.length === 0 ? (
            <Text style={[styles.tickerText, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('home.messagesEmpty')}
            </Text>
          ) : (
            messages.map((message, index) => (
              <View
                key={message}
                style={{
                  ...styles.tickerItem,
                  borderBottomColor: index === messages.length - 1 ? 'transparent' : palette.divider,
                }}
              >
                <Text style={[styles.tickerText, { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {message}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
};

export default HomeScreen;
