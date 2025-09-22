
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getCopticDate, getDailyReadings, getLocalizedCopticMonthName, type DailyReadings } from '../api/coptic';
import { getSynaxarium, type SynaxariumEntry } from '../api/synaxarium';
import { useAppConfig } from '../context/AppConfigContext';
import { useLanguage } from '../context/LanguageContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateColumn: {
    flex: 1,
    alignItems: 'center',
  },
  gregorianText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  copticText: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  readingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  readingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  readingMeta: {
    fontSize: 13,
    fontWeight: '500',
  },
  readingBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  synaxariumEntry: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  synaxariumTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});

const SERVICES: Array<{
  key: keyof DailyReadings;
  icon: string;
  translation: string;
}> = [
  { key: 'matins', icon: 'weather-sunset-up', translation: 'calendar.services.matins' },
  { key: 'vespers', icon: 'weather-sunset-down', translation: 'calendar.services.vespers' },
  { key: 'liturgy', icon: 'church', translation: 'calendar.services.liturgy' },
];

const toISO = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarScreen: React.FC = () => {
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const { resolvedTheme, uiLang, isRTL } = useLanguage();

  const palette = config.theme[resolvedTheme];

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [copticDate, setCopticDate] = useState<{
    year: number;
    month: number;
    day: number;
    name: string;
  } | null>(null);
  const [readings, setReadings] = useState<DailyReadings | null>(null);
  const [synaxarium, setSynaxarium] = useState<SynaxariumEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const gregorianLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(uiLang, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(currentDate);
    } catch (err) {
      return currentDate.toDateString();
    }
  }, [currentDate, uiLang]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const copticInfo = await getCopticDate(currentDate);
      setCopticDate({
        year: copticInfo.copticYear,
        month: copticInfo.copticMonth,
        day: copticInfo.copticDay,
        name: copticInfo.copticMonthName,
      });
      const [dailyReadings, synaxariumEntries] = await Promise.all([
        getDailyReadings(copticInfo.copticYear, copticInfo.copticMonth, copticInfo.copticDay),
        getSynaxarium(copticInfo.copticMonth, copticInfo.copticDay, uiLang),
      ]);
      setReadings(dailyReadings);
      setSynaxarium(synaxariumEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setReadings(null);
      setSynaxarium([]);
      setCopticDate(null);
    } finally {
      setLoading(false);
    }
  }, [currentDate, uiLang]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const copticLabel = useMemo(() => {
    if (!copticDate) {
      return '';
    }
    const monthName = getLocalizedCopticMonthName(copticDate.month, uiLang, copticDate.name);
    const suffix = t('calendar.copticYearSuffix');
    return `${copticDate.day} ${monthName} ${copticDate.year} ${suffix}`.trim();
  }, [copticDate, t, uiLang]);

  const handlePrevDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const serviceSections = SERVICES.map((service) => ({
    ...service,
    items: readings?.[service.key] ?? [],
  }));

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.header,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('calendar.previousDayHint')}
            onPress={handlePrevDay}
            style={[
              styles.navButton,
              { borderColor: palette.divider, backgroundColor: palette.surface },
            ]}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-right' : 'chevron-left'}
              size={22}
              color={palette.textPrimary}
            />
          </Pressable>
          <View style={styles.dateColumn}>
            <Text
              style={[
                styles.gregorianText,
                { color: palette.textPrimary, writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {gregorianLabel}
            </Text>
            <Text
              style={[
                styles.copticText,
                { color: palette.accent, writingDirection: isRTL ? 'rtl' : 'ltr' },
              ]}
            >
              {copticLabel || t('calendar.copticFallback')}
            </Text>
            <Text style={{ marginTop: 8, color: palette.textSecondary, fontSize: 12 }}>
              {toISO(currentDate)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('calendar.nextDayHint')}
            onPress={handleNextDay}
            style={[
              styles.navButton,
              { borderColor: palette.divider, backgroundColor: palette.surface },
            ]}
          >
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={22}
              color={palette.textPrimary}
            />
          </Pressable>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator color={palette.primary} size="large" />
          </View>
        ) : error ? (
          <View
            style={[
              styles.errorCard,
              { borderColor: palette.divider, backgroundColor: palette.surface },
            ]}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={palette.accent} />
            <Text style={{ color: palette.textSecondary, textAlign: 'center' }}>
              {t('calendar.errorTitle')}
            </Text>
            <Text style={{ color: palette.textSecondary, textAlign: 'center', fontSize: 13 }}>
              {t('calendar.errorSubtitle')}
            </Text>
            <Pressable
              onPress={() => {
                void fetchData();
              }}
              style={[
                styles.retryButton,
                { borderColor: palette.primary, backgroundColor: `${palette.primary}22` },
              ]}
            >
              <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.sectionCard,
                { borderColor: palette.divider, backgroundColor: palette.surface },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('calendar.dailyReadingsTitle')}
              </Text>
              {serviceSections.map((section) => (
                <View key={section.key} style={{ gap: 12 }}>
                  <View
                    style={[
                      styles.serviceHeader,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: palette.background,
                        borderWidth: 1,
                        borderColor: palette.divider,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={section.icon as any}
                        size={22}
                        color={palette.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.serviceTitle,
                        { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {t(section.translation)}
                    </Text>
                  </View>
                  {section.items.length === 0 ? (
                    <Text
                      style={[
                        styles.emptyLabel,
                        { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {t('calendar.readingsEmpty')}
                    </Text>
                  ) : (
                    section.items.map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.readingCard,
                          { borderColor: palette.divider, backgroundColor: palette.background },
                        ]}
                      >
                        <Text
                          style={[
                            styles.readingTitle,
                            { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {item.reference ? (
                          <Text
                            style={[
                              styles.readingMeta,
                              { color: palette.accent, textAlign: isRTL ? 'right' : 'left' },
                            ]}
                          >
                            {item.reference}
                          </Text>
                        ) : null}
                        {item.source ? (
                          <Text
                            style={[
                              styles.readingMeta,
                              { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                            ]}
                          >
                            {item.source}
                          </Text>
                        ) : null}
                        {item.text ? (
                          <Text
                            style={[
                              styles.readingBody,
                              { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                            ]}
                          >
                            {item.text}
                          </Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              ))}
            </View>

            <View
              style={[
                styles.sectionCard,
                { borderColor: palette.divider, backgroundColor: palette.surface },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('calendar.synaxariumTitle')}
              </Text>
              {synaxarium.length === 0 ? (
                <Text
                  style={[
                    styles.emptyLabel,
                    { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {t('calendar.synaxariumEmpty')}
                </Text>
              ) : (
                synaxarium.map((entry, index) => (
                  <View
                    key={`${entry.title}-${index}`}
                    style={[
                      styles.synaxariumEntry,
                      { borderColor: palette.divider, backgroundColor: palette.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.synaxariumTitle,
                        { color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {entry.title}
                    </Text>
                    <Text
                      style={[
                        styles.readingBody,
                        { color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' },
                      ]}
                    >
                      {entry.story}
                    </Text>
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
