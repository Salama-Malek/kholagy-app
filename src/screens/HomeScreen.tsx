import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import CrossIcon from '../../assets/icons/cross.svg';
import catalog from '../../content/catalog.json';
import {
  getCopticDate,
  getDailyReadings,
  getLocalizedCopticMonthName,
  type CopticDateInfo,
  type DailyReadings,
  type ReadingService,
} from '../api/coptic';
import { useAppConfig } from '../context/AppConfigContext';
import { useLanguage } from '../context/LanguageContext';
import type { Category, RootStackParamList, TabParamList } from '../../navigation/types';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
  },
  heroCard: {
    borderRadius: 28,
    padding: 26,
    overflow: 'hidden',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIconWrapper: {
    width: 132,
    height: 132,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
  },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  heroActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 22,
  },
  heroAction: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dateCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    gap: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  quickCard: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  quickIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  highlightCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  highlightRow: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  highlightInfo: {
    flex: 1,
    gap: 4,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  highlightMeta: {
    fontSize: 12,
  },
  featureList: {
    gap: 14,
  },
  featureCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  featureTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  featureMeta: {
    fontSize: 12,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type QuickAction = {
  key: 'kholagy' | 'fractions' | 'prayers' | 'calendar' | 'bible' | 'settings';
  icon: string;
  descriptionKey: string;
  action:
    | { type: 'tab'; screen: keyof TabParamList; params?: TabParamList[keyof TabParamList] }
    | { type: 'stack'; screen: 'Calendar' | 'Bible' | 'Settings' };
};

type CatalogItem = {
  id: string;
  titles: Record<string, string>;
  category: string;
  languages: string[];
  season?: string;
  tags?: string[];
};

type Highlight = {
  service: ReadingService;
  title: string;
  reference?: string;
  source?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'kholagy',
    icon: 'church',
    descriptionKey: 'home.actionDescriptions.kholagy',
    action: { type: 'tab', screen: 'kholagy', params: { category: 'kholagy' } },
  },
  {
    key: 'fractions',
    icon: 'bread-slice',
    descriptionKey: 'home.actionDescriptions.fractions',
    action: { type: 'tab', screen: 'fractions', params: { category: 'fractions' } },
  },
  {
    key: 'prayers',
    icon: 'hands-pray',
    descriptionKey: 'home.actionDescriptions.prayers',
    action: { type: 'tab', screen: 'prayers', params: { category: 'prayers' } },
  },
  {
    key: 'calendar',
    icon: 'calendar-month',
    descriptionKey: 'home.actionDescriptions.calendar',
    action: { type: 'stack', screen: 'Calendar' },
  },
  {
    key: 'bible',
    icon: 'book-cross',
    descriptionKey: 'home.actionDescriptions.bible',
    action: { type: 'stack', screen: 'Bible' },
  },
  {
    key: 'settings',
    icon: 'cog-outline',
    descriptionKey: 'home.actionDescriptions.settings',
    action: { type: 'stack', screen: 'Settings' },
  },
];

const HIGHLIGHT_SERVICES: ReadingService[] = ['matins', 'vespers', 'liturgy'];

const HIGHLIGHT_ICONS: Record<ReadingService, string> = {
  matins: 'weather-sunset-up',
  vespers: 'weather-sunset-down',
  liturgy: 'church',
};

const withAlpha = (color: string, alpha: string) => {
  if (typeof color !== 'string') {
    return color;
  }
  if (color.startsWith('#') && (color.length === 7 || color.length === 9)) {
    const base = color.slice(0, 7);
    return `${base}${alpha}`;
  }
  return color;
};

const normalizeCategory = (input: string): Category => {
  if (input === 'liturgies') {
    return 'kholagy';
  }
  return input as Category;
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const { resolvedTheme, uiLang, isRTL } = useLanguage();

  const palette = useMemo(() => config.theme[resolvedTheme] ?? config.theme.light, [config.theme, resolvedTheme]);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [copticDate, setCopticDate] = useState<CopticDateInfo | null>(null);
  const [loadingDate, setLoadingDate] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [dailyReadings, setDailyReadings] = useState<DailyReadings | null>(null);
  const [highlightsLoading, setHighlightsLoading] = useState<boolean>(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);

  const gregorianLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(uiLang, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(currentDate);
    } catch (error) {
      return currentDate.toDateString();
    }
  }, [currentDate, uiLang]);

  const loadCopticDate = useCallback(async (targetDate: Date) => {
    setLoadingDate(true);
    setDateError(null);
    try {
      const info = await getCopticDate(targetDate);
      setCopticDate(info);
      setRetryCount(0);
    } catch (error) {
      console.error('Failed to load Coptic date:', error);
      setCopticDate(null);
      setDateError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingDate(false);
    }
  }, []);

  const loadDailyHighlights = useCallback(async (info: CopticDateInfo) => {
    setHighlightsLoading(true);
    setHighlightsError(null);
    try {
      const readings = await getDailyReadings(info.copticYear, info.copticMonth, info.copticDay);
      setDailyReadings(readings);
    } catch (error) {
      console.warn('Failed to load daily readings preview:', error);
      setDailyReadings(null);
      setHighlightsError(error instanceof Error ? error.message : String(error));
    } finally {
      setHighlightsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCopticDate(currentDate);
  }, [currentDate, loadCopticDate]);

  useEffect(() => {
    if (!copticDate) {
      setDailyReadings(null);
      return;
    }
    void loadDailyHighlights(copticDate);
  }, [copticDate, loadDailyHighlights]);

  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
    }, []),
  );

  const handleRetryDate = useCallback(() => {
    if (retryCount >= 3) {
      return;
    }
    setRetryCount((prev) => prev + 1);
    void loadCopticDate(currentDate);
  }, [currentDate, loadCopticDate, retryCount]);

  const handleRetryHighlights = useCallback(() => {
    if (copticDate) {
      void loadDailyHighlights(copticDate);
    }
  }, [copticDate, loadDailyHighlights]);

  const localizedMonthName = useMemo(() => {
    if (!copticDate) {
      return '';
    }
    return getLocalizedCopticMonthName(copticDate.copticMonth, uiLang, copticDate.copticMonthName);
  }, [copticDate, uiLang]);

  const copticLabel = useMemo(() => {
    if (!copticDate) {
      return '';
    }
    const suffix = t('calendar.copticYearSuffix');
    return `${copticDate.copticDay} ${localizedMonthName} ${copticDate.copticYear} ${suffix}`.trim();
  }, [copticDate, localizedMonthName, t]);

  const quickActions = useMemo(
    () =>
      QUICK_ACTIONS.map((definition) => ({
        ...definition,
        label: t(`home.cards.${definition.key}` as const) || definition.key,
        description: t(definition.descriptionKey as any),
      })),
    [t],
  );

  const accentColors = useMemo(
    () => ({
      kholagy: palette.primary,
      fractions: palette.accent,
      prayers: '#A08CFF',
      calendar: palette.accent,
      bible: '#6FD1A4',
      settings: palette.textSecondary,
    }),
    [palette.accent, palette.primary, palette.textSecondary],
  );

  const curatedPicks = useMemo(() => {
    if (!Array.isArray(catalog)) {
      return [] as Array<{ id: string; title: string; category: Category; languages: string[] }>;
    }

    const typedCatalog = catalog as CatalogItem[];
    const seen = new Set<string>();
    const preferredCategories: Category[] = ['kholagy', 'fractions', 'prayers', 'agpeya', 'synaxarium', 'psalmody'];

    const picks: Array<{ id: string; title: string; category: Category; languages: string[] }> = [];

    preferredCategories.forEach((category) => {
      const match = typedCatalog.find((item) => normalizeCategory(item.category) === category);
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        picks.push({
          id: match.id,
          title: match.titles[uiLang] ?? match.titles.en ?? match.id,
          category,
          languages: Array.isArray(match.languages) ? match.languages : [],
        });
      }
    });

    if (picks.length < 4) {
      typedCatalog.some((item) => {
        if (seen.has(item.id)) {
          return false;
        }
        const normalisedCategory = normalizeCategory(item.category);
        picks.push({
          id: item.id,
          title: item.titles[uiLang] ?? item.titles.en ?? item.id,
          category: normalisedCategory,
          languages: Array.isArray(item.languages) ? item.languages : [],
        });
        seen.add(item.id);
        return picks.length >= 6;
      });
    }

    return picks;
  }, [uiLang]);

  const highlights: Highlight[] = useMemo(() => {
    if (!dailyReadings) {
      return [];
    }
    const summary: Highlight[] = [];
    HIGHLIGHT_SERVICES.forEach((service) => {
      const first = dailyReadings[service]?.find((entry) => entry && (entry.title || entry.reference || entry.text));
      if (first) {
        summary.push({
          service,
          title: first.title || first.text || first.reference || '',
          reference: first.reference,
          source: first.source,
        });
      }
    });
    return summary;
  }, [dailyReadings]);

  const handleQuickActionPress = useCallback(
    (action: QuickAction['action']) => {
      try {
        if (action.type === 'tab') {
          navigation.navigate('MainTabs', {
            screen: action.screen,
            params: action.params as any,
          });
          return;
        }
        navigation.navigate(action.screen);
      } catch (error) {
        console.error('Navigation error from home action:', error);
      }
    },
    [navigation],
  );

  const handleOpenReader = useCallback(
    (item: { id: string; title: string }) => {
      navigation.navigate('Reader', {
        itemId: item.id,
        title: item.title,
      });
    },
    [navigation],
  );

  const languagesLabel = useCallback((languages: string[]) => {
    if (!Array.isArray(languages) || languages.length === 0) {
      return '';
    }
    const preview = languages.slice(0, 3).map((lang) => lang.toUpperCase());
    return preview.join(' · ');
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: withAlpha(palette.surface, 'EE'),
              borderWidth: 1,
              borderColor: withAlpha(palette.divider, '88'),
            },
          ]}
        >
          <View style={[styles.heroRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View
              style={[
                styles.heroIconWrapper,
                {
                  backgroundColor: withAlpha(palette.primary, '1A'),
                  borderWidth: 1,
                  borderColor: withAlpha(palette.primary, '44'),
                },
              ]}
            >
              <CrossIcon width={96} height={96} color={palette.primary} />
            </View>
            <MaterialCommunityIcons
              name="hands-pray"
              size={46}
              color={palette.accent}
              style={{ opacity: 0.18 }}
            />
          </View>
          <Text
            style={[
              styles.heroTitle,
              { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('home.welcomeTitle')}
          </Text>
          <Text
            style={[
              styles.heroSubtitle,
              { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('home.quickActionsSubtitle')}
          </Text>
          <View
            style={[
              styles.heroActionsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.heroAction,
                {
                  borderColor: pressed ? palette.primary : withAlpha(palette.primary, '55'),
                  backgroundColor: withAlpha(palette.primary, '1A'),
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
              onPress={() => navigation.navigate('Calendar')}
            >
              <MaterialCommunityIcons name="calendar-month" size={20} color={palette.primary} />
              <Text style={{ color: palette.primary, fontWeight: '600' }}>{t('home.heroActions.calendar')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.heroAction,
                {
                  borderColor: pressed ? palette.accent : withAlpha(palette.accent, '66'),
                  backgroundColor: withAlpha(palette.accent, '1A'),
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
              onPress={() =>
                navigation.navigate('MainTabs', {
                  screen: 'kholagy',
                  params: { category: 'kholagy' },
                })
              }
            >
              <MaterialCommunityIcons name="book-open-variant" size={20} color={palette.accent} />
              <Text style={{ color: palette.accent, fontWeight: '600' }}>{t('home.heroActions.library')}</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.dateCard,
            { backgroundColor: palette.surface, borderColor: palette.divider },
          ]}
        >
          <View
            style={[
              styles.dateHeader,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  textAlign: isRTL ? 'right' : 'left',
                  textTransform: 'uppercase',
                }}
              >
                {t('home.todaysDateLabel')}
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 20,
                  fontWeight: '700',
                  color: palette.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {gregorianLabel}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Calendar')}
              style={({ pressed }) => ({
                borderRadius: 14,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: pressed ? palette.primary : withAlpha(palette.primary, '66'),
                backgroundColor: withAlpha(palette.primary, '14'),
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
              })}
            >
              <MaterialCommunityIcons name="calendar-search" size={18} color={palette.primary} />
              <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600' }}>{t('home.highlightsCta')}</Text>
            </Pressable>
          </View>

          <Text
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: 1.2,
              color: palette.accent,
              textAlign: isRTL ? 'right' : 'left',
              textTransform: 'uppercase',
            }}
          >
            {t('home.copticDateLabel')}
          </Text>
          {loadingDate ? (
            <View style={{ marginTop: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
              <ActivityIndicator size="small" color={palette.primary} />
            </View>
          ) : dateError ? (
            <View style={{ marginTop: 8, gap: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: palette.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('home.dateError')}
              </Text>
              {retryCount < 3 ? (
                <Pressable
                  onPress={handleRetryDate}
                  style={({ pressed }) => ({
                    alignSelf: isRTL ? 'flex-end' : 'flex-start',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: pressed ? palette.primary : withAlpha(palette.primary, '66'),
                    backgroundColor: withAlpha(palette.primary, '1A'),
                  })}
                >
                  <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600' }}>{t('common.retry')}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Text
              style={{
                marginTop: 8,
                fontSize: 18,
                fontWeight: '600',
                color: palette.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {copticLabel}
            </Text>
          )}
        </View>

        <View style={{ gap: 12 }}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...styles.sectionTitle,
                  color: palette.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('home.quickActionsTitle')}
              </Text>
              <Text
                style={{
                  ...styles.sectionSubtitle,
                  color: palette.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('home.quickActionsSubtitle')}
              </Text>
            </View>
          </View>
          <View style={styles.quickGrid}>
            {quickActions.map((item) => {
              const accent = accentColors[item.key] ?? palette.primary;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => handleQuickActionPress(item.action)}
                  style={({ pressed }) => [
                    styles.quickCard,
                    {
                      borderColor: pressed ? accent : withAlpha(accent, '55'),
                      backgroundColor: withAlpha(accent, resolvedTheme === 'dark' ? '22' : '18'),
                      flexDirection: isRTL ? 'row-reverse' : 'column',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.quickIconWrapper,
                      {
                        backgroundColor: withAlpha(accent, resolvedTheme === 'dark' ? '33' : '28'),
                        borderColor: withAlpha(accent, '55'),
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={accent} />
                  </View>
                  <Text
                    style={{
                      ...styles.quickTitle,
                      color: palette.textPrimary,
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      ...styles.quickSubtitle,
                      color: palette.textSecondary,
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...styles.sectionTitle,
                  color: palette.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('home.highlightsTitle')}
              </Text>
              <Text
                style={{
                  ...styles.sectionSubtitle,
                  color: palette.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {copticLabel}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.highlightCard,
              { backgroundColor: palette.surface, borderColor: palette.divider },
            ]}
          >
            {highlightsLoading ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="small" color={palette.primary} />
              </View>
            ) : highlightsError ? (
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: palette.textSecondary,
                    textAlign: isRTL ? 'right' : 'left',
                    fontSize: 14,
                  }}
                >
                  {t('home.highlightsError')}
                </Text>
                <Pressable
                  onPress={handleRetryHighlights}
                  style={({ pressed }) => ({
                    alignSelf: isRTL ? 'flex-end' : 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: pressed ? palette.primary : withAlpha(palette.primary, '66'),
                    backgroundColor: withAlpha(palette.primary, '1A'),
                  })}
                >
                  <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600' }}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : highlights.length === 0 ? (
              <Text
                style={{
                  color: palette.textSecondary,
                  fontSize: 14,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('home.highlightsEmpty')}
              </Text>
            ) : (
              highlights.map((highlight) => (
                <Pressable
                  key={highlight.service}
                  onPress={() => navigation.navigate('Calendar')}
                  style={({ pressed }) => [
                    styles.highlightRow,
                    {
                      borderColor: pressed ? palette.primary : palette.divider,
                      backgroundColor: withAlpha(palette.background, 'EE'),
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: withAlpha(palette.primary, '18'),
                    }}
                  >
                    <MaterialCommunityIcons
                      name={HIGHLIGHT_ICONS[highlight.service] as any}
                      size={22}
                      color={palette.primary}
                    />
                  </View>
                  <View style={styles.highlightInfo}>
                    <Text
                      style={{
                        ...styles.highlightTitle,
                        color: palette.textPrimary,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                      numberOfLines={2}
                    >
                      {highlight.title}
                    </Text>
                    {highlight.reference ? (
                      <Text
                        style={{
                          ...styles.highlightMeta,
                          color: palette.accent,
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      >
                        {highlight.reference}
                      </Text>
                    ) : null}
                    {highlight.source ? (
                      <Text
                        style={{
                          ...styles.highlightMeta,
                          color: palette.textSecondary,
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                        numberOfLines={1}
                      >
                        {highlight.source}
                      </Text>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons
                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                    size={22}
                    color={palette.textSecondary}
                  />
                </Pressable>
              ))
            )}
          </View>
        </View>

        <View style={{ gap: 12, paddingBottom: 12 }}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...styles.sectionTitle,
                  color: palette.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('home.curatedTitle')}
              </Text>
              <Text
                style={{
                  ...styles.sectionSubtitle,
                  color: palette.textSecondary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('home.curatedSubtitle')}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                navigation.navigate('MainTabs', {
                  screen: 'kholagy',
                  params: { category: 'kholagy' },
                })
              }
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: pressed ? palette.primary : palette.divider,
                backgroundColor: palette.surface,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
              })}
            >
              <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600' }}>{t('home.viewAll')}</Text>
              <MaterialCommunityIcons
                name={isRTL ? 'chevron-left' : 'chevron-right'}
                size={18}
                color={palette.primary}
              />
            </Pressable>
          </View>

          {curatedPicks.length === 0 ? (
            <Text
              style={{
                color: palette.textSecondary,
                fontSize: 14,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {t('home.curatedEmpty')}
            </Text>
          ) : (
            <View style={styles.featureList}>
              {curatedPicks.map((item) => {
                const categoryLabel = t(`quickAccess.${item.category}` as const, {
                  defaultValue: item.category,
                });
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleOpenReader({ id: item.id, title: item.title })}
                    style={({ pressed }) => [
                      styles.featureCard,
                      {
                        backgroundColor: palette.surface,
                        borderColor: pressed ? palette.primary : palette.divider,
                        flexDirection: isRTL ? 'row-reverse' : 'column',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.featureTag,
                        {
                          borderColor: withAlpha(palette.primary, '55'),
                          backgroundColor: withAlpha(palette.primary, '12'),
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: palette.primary,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {categoryLabel}
                      </Text>
                    </View>
                    <Text
                      style={{
                        ...styles.featureTitle,
                        color: palette.textPrimary,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        ...styles.featureMeta,
                        color: palette.textSecondary,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {languagesLabel(item.languages)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
