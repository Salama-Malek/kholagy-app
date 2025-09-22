import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  DailyReading,
  FeastDay,
  FastInfo,
  getDailyReadings,
  getFeasts,
  getFastInfo,
} from '../api/orthocal';
import { useAppConfig } from '../context/AppConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { useSearch, CalendarSearchHit } from '../context/SearchContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  entryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryMeta: {
    fontSize: 13,
  },
  emptyLabel: {
    textAlign: 'center',
    fontSize: 14,
  },
  errorCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});

const toISODate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const CalendarScreen: React.FC = () => {
  const { t } = useTranslation();
  const { resolvedTheme, uiLang, isRTL } = useLanguage();
  const { config } = useAppConfig();
  const { setDomainResults, clearDomain } = useSearch();

  const palette = config.theme[resolvedTheme];

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<DailyReading[]>([]);
  const [feasts, setFeasts] = useState<FeastDay[]>([]);
  const [fasts, setFasts] = useState<FastInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const isoDate = useMemo(() => toISODate(currentDate), [currentDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dailyReadings, feastDays, fastInfo] = await Promise.all([
        getDailyReadings(isoDate),
        getFeasts(isoDate),
        getFastInfo(isoDate),
      ]);
      setReadings(dailyReadings);
      setFeasts(feastDays);
      setFasts(fastInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setReadings([]);
      setFeasts([]);
      setFasts([]);
    } finally {
      setLoading(false);
    }
  }, [isoDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredReadings = useMemo(() => {
    if (!searchTerm.trim()) {
      return readings;
    }
    const needle = searchTerm.trim().toLowerCase();
    return readings.filter((reading) => {
      const haystack = `${reading.title ?? ''} ${reading.citation ?? ''} ${reading.text ?? ''} ${reading.service ?? ''}`;
      return haystack.toLowerCase().includes(needle);
    });
  }, [readings, searchTerm]);

  const filteredFeasts = useMemo(() => {
    if (!searchTerm.trim()) {
      return feasts;
    }
    const needle = searchTerm.trim().toLowerCase();
    return feasts.filter((feast) => {
      const haystack = `${feast.title ?? ''} ${feast.rank ?? ''} ${feast.description ?? ''}`;
      return haystack.toLowerCase().includes(needle);
    });
  }, [feasts, searchTerm]);

  const filteredFasts = useMemo(() => {
    if (!searchTerm.trim()) {
      return fasts;
    }
    const needle = searchTerm.trim().toLowerCase();
    return fasts.filter((fast) => {
      const haystack = `${fast.name ?? ''} ${fast.fastingLevel ?? ''} ${fast.description ?? ''}`;
      return haystack.toLowerCase().includes(needle);
    });
  }, [fasts, searchTerm]);

  const aggregatedHits = useMemo<CalendarSearchHit[]>(() => {
    return [
      ...readings.map<CalendarSearchHit>((reading, index) => ({
        id: `${isoDate}:reading:${index}`,
        title: reading.title ?? t('calendar.readingDefaultTitle'),
        type: 'reading',
        description: reading.citation ?? reading.text,
        metadata: reading.service,
      })),
      ...feasts.map<CalendarSearchHit>((feast, index) => ({
        id: `${isoDate}:feast:${index}`,
        title: feast.title ?? t('calendar.feastDefaultTitle'),
        type: 'feast',
        description: feast.description,
        metadata: feast.rank,
      })),
      ...fasts.map<CalendarSearchHit>((fast, index) => ({
        id: `${isoDate}:fast:${index}`,
        title: fast.name ?? t('calendar.fastDefaultTitle'),
        type: 'fast',
        description: fast.description,
        metadata: fast.fastingLevel,
      })),
    ];
  }, [feasts, fasts, isoDate, readings, t]);

  const filteredHits = useMemo(() => {
    if (!searchTerm.trim()) {
      return aggregatedHits;
    }
    const needle = searchTerm.trim().toLowerCase();
    return aggregatedHits.filter((hit) => {
      const haystack = `${hit.title ?? ''} ${hit.description ?? ''} ${hit.metadata ?? ''}`;
      return haystack.toLowerCase().includes(needle);
    });
  }, [aggregatedHits, searchTerm]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      clearDomain('calendar');
      return;
    }
    setDomainResults('calendar', { query: searchTerm.trim(), results: filteredHits });
  }, [clearDomain, filteredHits, searchTerm, setDomainResults]);
  useEffect(() => {
    return () => {
      clearDomain('calendar');
    };
  }, [clearDomain]);

  const handlePrevDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  }, []);

  const handleNextDay = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={{
            ...styles.headerRow,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          }}
        >
          <Pressable
            onPress={handlePrevDay}
            style={{
              ...styles.navButton,
              borderColor: palette.divider,
              backgroundColor: palette.surface,
            }}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-right' : 'chevron-left'}
              size={22}
              color={palette.textPrimary}
            />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ ...styles.dateText, color: palette.textPrimary }}>
              {formatDisplayDate(currentDate, uiLang)}
            </Text>
            <Text style={{ color: palette.textSecondary, marginTop: 4 }}>{isoDate}</Text>
          </View>
          <Pressable
            onPress={handleNextDay}
            style={{
              ...styles.navButton,
              borderColor: palette.divider,
              backgroundColor: palette.surface,
            }}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={22}
              color={palette.textPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={t('calendar.searchPlaceholder')}
            placeholderTextColor={palette.textSecondary}
            style={{
              ...styles.searchInput,
              borderColor: palette.divider,
              backgroundColor: palette.surface,
              color: palette.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          />
          <MaterialCommunityIcons name="calendar-search" size={22} color={palette.primary} />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : error ? (
          <View style={{ ...styles.errorCard, borderColor: palette.divider, backgroundColor: palette.surface }}>
            <Text style={{ color: palette.accent, textAlign: 'center' }}>{error}</Text>
            <Pressable
              onPress={() => {
                void fetchData();
              }}
              style={{
                ...styles.retryButton,
                borderColor: palette.primary,
                backgroundColor: palette.primary + '22',
              }}
            >
              <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ ...styles.sectionCard, borderColor: palette.divider, backgroundColor: palette.surface }}>
              <Text style={{ ...styles.sectionTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {t('calendar.readingsTitle')}
              </Text>
              {filteredReadings.length === 0 ? (
                <Text style={{ ...styles.emptyLabel, color: palette.textSecondary }}>{t('calendar.noneLabel')}</Text>
              ) : (
                filteredReadings.map((reading) => (
                  <View
                    key={reading.id}
                    style={{
                      ...styles.entryCard,
                      backgroundColor: palette.background,
                      borderColor: palette.divider,
                    }}
                  >
                    <Text style={{ ...styles.entryTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                      {reading.title ?? t('calendar.readingDefaultTitle')}
                    </Text>
                    {reading.citation ? (
                      <Text style={{ ...styles.entryMeta, color: palette.accent, textAlign: isRTL ? 'right' : 'left' }}>
                        {reading.citation}
                      </Text>
                    ) : null}
                    {reading.service ? (
                      <Text style={{ ...styles.entryMeta, color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }}>
                        {reading.service}
                      </Text>
                    ) : null}
                    {reading.text ? (
                      <Text style={{ color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left', marginTop: 6 }}>
                        {reading.text}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            <View style={{ ...styles.sectionCard, borderColor: palette.divider, backgroundColor: palette.surface }}>
              <Text style={{ ...styles.sectionTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {t('calendar.feastsTitle')}
              </Text>
              {filteredFeasts.length === 0 ? (
                <Text style={{ ...styles.emptyLabel, color: palette.textSecondary }}>{t('calendar.noneLabel')}</Text>
              ) : (
                filteredFeasts.map((feast) => (
                  <View
                    key={feast.id}
                    style={{
                      ...styles.entryCard,
                      backgroundColor: palette.background,
                      borderColor: palette.divider,
                    }}
                  >
                    <Text style={{ ...styles.entryTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                      {feast.title ?? t('calendar.feastDefaultTitle')}
                    </Text>
                    {feast.rank ? (
                      <Text style={{ ...styles.entryMeta, color: palette.accent, textAlign: isRTL ? 'right' : 'left' }}>
                        {feast.rank}
                      </Text>
                    ) : null}
                    {feast.description ? (
                      <Text style={{ color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left', marginTop: 6 }}>
                        {feast.description}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            <View style={{ ...styles.sectionCard, borderColor: palette.divider, backgroundColor: palette.surface }}>
              <Text style={{ ...styles.sectionTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {t('calendar.fastsTitle')}
              </Text>
              {filteredFasts.length === 0 ? (
                <Text style={{ ...styles.emptyLabel, color: palette.textSecondary }}>{t('calendar.noneLabel')}</Text>
              ) : (
                filteredFasts.map((fast) => (
                  <View
                    key={fast.id}
                    style={{
                      ...styles.entryCard,
                      backgroundColor: palette.background,
                      borderColor: palette.divider,
                    }}
                  >
                    <Text style={{ ...styles.entryTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                      {fast.name ?? t('calendar.fastDefaultTitle')}
                    </Text>
                    {fast.fastingLevel ? (
                      <Text style={{ ...styles.entryMeta, color: palette.accent, textAlign: isRTL ? 'right' : 'left' }}>
                        {fast.fastingLevel}
                      </Text>
                    ) : null}
                    {fast.description ? (
                      <Text style={{ color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left', marginTop: 6 }}>
                        {fast.description}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default CalendarScreen;
