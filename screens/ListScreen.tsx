import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import catalog from '../content/catalog.json';
import { useLanguage } from '../src/context/LanguageContext';
import { useAppConfig } from '../src/context/AppConfigContext';
import type { Category, RootStackParamList } from '../navigation/types';

interface CatalogItem {
  id: string;
  titles: Record<string, string>;
  category: string;
  languages: string[];
  season?: string;
  tags?: string[];
}

type AnyTabRoute = RouteProp<Record<string, { category?: Category }>, string>;

type ReaderNavigation = NativeStackNavigationProp<RootStackParamList>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  subtitle: {
    fontSize: 13,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeActive: {
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
  },
});

const normalizeCategory = (input: string): Category => {
  if (input === 'liturgies') {
    return 'kholagy';
  }
  return input as Category;
};

const ListScreen: React.FC = () => {
  const route = useRoute<AnyTabRoute>();
  const navigation = useNavigation<ReaderNavigation>();
  const { uiLang, textLang, resolvedTheme, isRTL } = useLanguage();
  const { config } = useAppConfig();
  const { t } = useTranslation();

  const palette = config.theme[resolvedTheme];
  const listConfig = config.screens.ListScreen;
  const activeCategory = normalizeCategory((route.params?.category ?? 'kholagy') as string);

  const groupedCatalog = useMemo(() => {
    const items = (catalog as CatalogItem[]).filter((item) => normalizeCategory(item.category) === activeCategory);

    const sorted = items.slice().sort((a, b) => {
      for (const key of listConfig.sort) {
        if (key === 'title') {
          const titleA = a.titles[uiLang] ?? a.titles.en ?? a.id;
          const titleB = b.titles[uiLang] ?? b.titles.en ?? b.id;
          const comparison = titleA.localeCompare(titleB);
          if (comparison !== 0) {
            return comparison;
          }
        }
        if (key === 'season' && a.season && b.season) {
          const comparison = a.season.localeCompare(b.season);
          if (comparison !== 0) {
            return comparison;
          }
        }
      }
      return 0;
    });

    const available: CatalogItem[] = [];
    const fallback: CatalogItem[] = [];

    sorted.forEach((item) => {
      if (item.languages.includes(textLang)) {
        available.push(item);
      } else {
        fallback.push(item);
      }
    });

    return listConfig.filterByLang ? available : [...available, ...fallback];
  }, [activeCategory, listConfig.filterByLang, listConfig.sort, textLang, uiLang]);

  const renderItem = ({ item }: { item: CatalogItem }) => {
    const localizedTitle = item.titles[uiLang] || item.titles.en || item.id;
    const availableInSelected = item.languages.includes(textLang);
    const seasonLabel = item.season;

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('Reader', {
            itemId: item.id,
            title: localizedTitle,
          })
        }
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: palette.surface,
            borderColor: pressed ? palette.primary : palette.divider,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...styles.title,
              color: palette.textPrimary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {localizedTitle}
          </Text>
          <View style={[styles.subRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {seasonLabel ? (
              <Text style={{ ...styles.subtitle, color: palette.textSecondary }}>
                {seasonLabel}
              </Text>
            ) : null}
            {!availableInSelected ? (
              <Text style={{ ...styles.subtitle, color: palette.accent }}>
                {t('list.unavailable')}
              </Text>
            ) : null}
          </View>
          {listConfig.showLangBadges ? (
            <View style={[styles.badgesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {item.languages.map((lang) => {
                const isActive = lang === textLang;
                return (
                  <View
                    key={lang}
                    style={{
                      ...styles.badge,
                      borderColor: isActive ? palette.primary : palette.divider,
                      backgroundColor: isActive ? palette.primary + '22' : palette.background,
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? palette.primary : palette.textSecondary,
                        ...styles.badgeActive,
                        textAlign: 'center',
                      }}
                    >
                      {lang.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}
    >
      <FlatList
        data={groupedCatalog}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text
            style={{
              ...styles.emptyState,
              color: palette.textSecondary,
            }}
          >
            {t('list.noItems')}
          </Text>
        }
      />
    </View>
  );
};

export default ListScreen;
