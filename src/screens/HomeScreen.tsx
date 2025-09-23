import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CrossIcon from '../../assets/icons/cross.svg';
import { getCopticDate, getLocalizedCopticMonthName, type CopticDateInfo } from '../api/coptic';
import { useAppConfig } from '../context/AppConfigContext';
import { useLanguage } from '../context/LanguageContext';
import type { RootStackParamList, TabParamList } from '../../navigation/types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  crossWrapper: {
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
  },
  dateCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 28,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  gregorianText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
  },
  copticLabel: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  copticText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardChevron: {
    position: 'absolute',
    bottom: 16,
    right: 18,
  },
});

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type NavigationCard = {
  key: 'kholagy' | 'fractions' | 'prayers' | 'calendar' | 'bible' | 'settings';
  icon: string;
  action:
  | { type: 'tab'; screen: keyof TabParamList; params?: TabParamList[keyof TabParamList] }
  | { type: 'stack'; screen: Exclude<keyof RootStackParamList, 'Home'> };
};

const CARD_DEFINITIONS: NavigationCard[] = [
  { key: 'kholagy', icon: 'church', action: { type: 'tab', screen: 'kholagy', params: { category: 'kholagy' } } },
  { key: 'fractions', icon: 'bread-slice', action: { type: 'tab', screen: 'fractions', params: { category: 'fractions' } } },
  { key: 'prayers', icon: 'hands-pray', action: { type: 'tab', screen: 'prayers', params: { category: 'prayers' } } },
  { key: 'calendar', icon: 'calendar-month', action: { type: 'stack', screen: 'Calendar' } },
  { key: 'bible', icon: 'book-cross', action: { type: 'stack', screen: 'Bible' } },
  { key: 'settings', icon: 'cog-outline', action: { type: 'tab', screen: 'settings' } },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const { t } = useTranslation();
  const { config } = useAppConfig() || {};
  const { resolvedTheme, uiLang, isRTL } = useLanguage() || {};

  const palette = config?.theme?.[resolvedTheme] || config?.theme?.light || {};
  const today = useMemo(() => new Date(), []);
  const [copticDate, setCopticDate] = useState<CopticDateInfo | null>(null);
  const [loadingDate, setLoadingDate] = useState<boolean>(true);
  const [dateError, setDateError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const gregorianLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(uiLang, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(today);
    } catch (error) {
      return today.toDateString();
    }
  }, [today, uiLang]);

  const loadCopticDate = useCallback(async () => {
    setLoadingDate(true);
    setDateError(null);
    try {
      const info = await getCopticDate(today);
      setCopticDate(info);
      setDateError(null); // Clear any previous errors
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to load Coptic date:', error);
      setCopticDate(null);
      setDateError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingDate(false);
    }
  }, [today]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadCopticDate();
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [loadCopticDate]);

  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      void loadCopticDate();
    }
  }, [retryCount, loadCopticDate]);

  const cards = useMemo(
    () => {
      try {
        if (!CARD_DEFINITIONS || !Array.isArray(CARD_DEFINITIONS)) {
          console.warn('CARD_DEFINITIONS is not available');
          return [];
        }

        if (!t || typeof t !== 'function') {
          console.warn('Translation function is not available');
          return CARD_DEFINITIONS.map((definition) => ({
            ...definition,
            label: definition.key,
          }));
        }

        const mappedCards = CARD_DEFINITIONS.map((definition) => ({
          ...definition,
          label: t(`home.cards.${definition.key}` as const) || definition.key,
        }));

        // Ensure we return a valid array
        return Array.isArray(mappedCards) ? mappedCards : [];
      } catch (error) {
        console.error('Error creating cards:', error);
        return [];
      }
    },
    [t],
  );

  const handleNavigate = useCallback((card: NavigationCard) => {
    try {
      if (!card || !card.action) {
        console.warn('Invalid card or action:', card);
        return;
      }

      if (card.action.type === 'tab') {
        if (!card.action.screen) {
          console.warn('Tab action missing screen:', card);
          return;
        }

        navigation.navigate('MainTabs', {
          screen: card.action.screen,
          params: card.action.params as any,
        });
        return;
      }

      if (card.action.type === 'stack' && card.action.screen) {
        navigation.navigate(card.action.screen as any);
        return;
      }

      console.warn('Unknown action type:', card.action);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [navigation]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View
            style={[
              styles.crossWrapper,
              { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.divider },
            ]}
          >
            <CrossIcon width={96} height={96} color={palette.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>{t('home.welcomeTitle')}</Text>
          <Text
            style={[
              styles.heroSubtitle,
              { color: palette.textSecondary, writingDirection: isRTL ? 'rtl' : 'ltr' },
            ]}
          >
            {t('home.welcomeSubtitle')}
          </Text>
        </View>

        <View
          style={[
            styles.dateCard,
            { borderColor: palette.divider, backgroundColor: palette.surface },
          ]}
        >
          <Text
            style={[
              styles.dateLabel,
              { color: palette.primary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('home.todaysDateLabel')}
          </Text>
          <Text
            style={[
              styles.gregorianText,
              { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {gregorianLabel}
          </Text>
          <Text
            style={[
              styles.copticLabel,
              { color: palette.accent, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {t('home.copticDateLabel')}
          </Text>
          {loadingDate ? (
            <View style={{ marginTop: 12, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <ActivityIndicator color={palette.primary} size="small" />
            </View>
          ) : dateError ? (
            <View style={{ marginTop: 8 }}>
              <Text
                style={[
                  styles.errorText,
                  { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('home.dateError')}
              </Text>
              {retryCount < 3 && (
                <Pressable
                  onPress={handleRetry}
                  style={({ pressed }) => [
                    {
                      marginTop: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: pressed ? palette.primary + '20' : palette.primary + '10',
                      borderWidth: 1,
                      borderColor: palette.primary,
                      alignSelf: isRTL ? 'flex-end' : 'flex-start',
                    },
                  ]}
                >
                  <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600' }}>
                    {t('common.retry')}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Text
              style={[
                styles.copticText,
                { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {copticLabel}
            </Text>
          )}
        </View>

        <View style={styles.cardGrid}>
          {(() => {
            try {
              if (!cards || !Array.isArray(cards) || cards.length === 0) {
                return (
                  <Text style={{ color: palette.textSecondary, textAlign: 'center', padding: 20 }}>
                    Loading navigation cards...
                  </Text>
                );
              }

              return cards.map((card) => {
                if (!card || !card.key) {
                  console.warn('Invalid card found:', card);
                  return null;
                }

                return (
                  <Pressable
                    key={card.key}
                    onPress={() => {
                      try {
                        handleNavigate(card);
                      } catch (error) {
                        console.error('Navigation error for card:', card.key, error);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        borderColor: pressed ? palette.primary : palette.divider,
                        backgroundColor: palette.surface,
                        transform: pressed ? [{ scale: 0.98 }] : undefined,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardIcon,
                        {
                          backgroundColor: palette.background,
                          borderWidth: 1,
                          borderColor: palette.divider,
                          alignSelf: isRTL ? 'flex-end' : 'flex-start',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name={card.icon as any} size={26} color={palette.primary} />
                    </View>
                    <Text
                      style={[
                        styles.cardLabel,
                        { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {card.label || card.key}
                    </Text>
                    <MaterialCommunityIcons
                      name={isRTL ? 'chevron-left' : 'chevron-right'}
                      size={22}
                      color={palette.textSecondary}
                      style={[
                        styles.cardChevron,
                        isRTL ? { left: 18, right: undefined } : null,
                      ]}
                    />
                  </Pressable>
                );
              }).filter(Boolean);
            } catch (error) {
              console.error('Error rendering cards:', error);
              return (
                <Text style={{ color: palette.textSecondary, textAlign: 'center', padding: 20 }}>
                  Error loading navigation cards
                </Text>
              );
            }
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
