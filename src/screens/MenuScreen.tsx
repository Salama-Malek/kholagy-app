import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppConfig } from '../context/AppConfigContext';
import { useLanguage } from '../context/LanguageContext';
import type { TabParamList, RootStackParamList } from '../../navigation/types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

type MenuNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'settings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type MenuItem = {
  key: string;
  icon: string;
  label: string;
  action: { type: 'stack'; target: keyof RootStackParamList } | { type: 'tab'; target: keyof TabParamList; params?: TabParamList[keyof TabParamList] };
};

const MenuScreen: React.FC = () => {
  const navigation = useNavigation<MenuNavigation>();
  const { t } = useTranslation();
  const { resolvedTheme, isRTL } = useLanguage();
  const { config } = useAppConfig();

  const palette = config.theme[resolvedTheme];

  const items = useMemo<MenuItem[]>(
    () => [
      { key: 'bible', icon: 'book-open-page-variant', label: t('menu.bible'), action: { type: 'stack', target: 'Bible' } },
      { key: 'calendar', icon: 'calendar-month', label: t('menu.copticCalendar'), action: { type: 'stack', target: 'Calendar' } },
      { key: 'agpeya', icon: 'book-cross', label: t('menu.agpeya'), action: { type: 'tab', target: 'kholagy', params: { category: 'agpeya' } } },
      { key: 'synaxarium', icon: 'book-open-variant', label: t('menu.synaxarium'), action: { type: 'tab', target: 'kholagy', params: { category: 'synaxarium' } } },
      { key: 'psalmody', icon: 'music-clef-treble', label: t('menu.psalmody'), action: { type: 'tab', target: 'kholagy', params: { category: 'psalmody' } } },
      { key: 'quotes', icon: 'format-quote-close', label: t('menu.quotes'), action: { type: 'tab', target: 'kholagy', params: { category: 'quotes' } } },
      {
        key: 'encyclopedia',
        icon: 'book-information-variant',
        label: t('menu.encyclopedia'),
        action: { type: 'tab', target: 'kholagy', params: { category: 'encyclopedia' } },
      },
      { key: 'settings', icon: 'cog-outline', label: t('menu.settings'), action: { type: 'stack', target: 'Settings' } },
    ],
    [t],
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={{ ...styles.sectionTitle, color: palette.textSecondary, textAlign: isRTL ? 'right' : 'left' }}>
          {t('menu.librarySection')}
        </Text>
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => {
              if (item.action.type === 'stack') {
                navigation.navigate(item.action.target as any);
              } else {
                navigation.navigate(item.action.target as any, item.action.params as any);
              }
            }}
            style={({ pressed }) => ({
              ...styles.itemCard,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              borderColor: pressed ? palette.primary : palette.divider,
              backgroundColor: palette.surface,
            })}
          >
            <View
              style={{
                ...styles.labelRow,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}
            >
              <View
                style={{
                  ...styles.iconWrapper,
                  borderColor: palette.divider,
                  backgroundColor: palette.background,
                }}
              >
                <MaterialCommunityIcons name={item.icon as any} size={22} color={palette.primary} />
              </View>
              <Text style={{ ...styles.labelText, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {item.label}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isRTL ? 'chevron-left' : 'chevron-right'}
              size={24}
              color={palette.textSecondary}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default MenuScreen;
