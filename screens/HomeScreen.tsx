import React, { useCallback, useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { useAppConfig } from '../src/context/AppConfigContext';
import { useLanguage } from '../src/context/LanguageContext';

type NavigationTarget =
  | {
      type: 'tab';
      tab: keyof TabParamList;
      params?: TabParamList[keyof TabParamList];
    }
  | {
      type: 'stack';
      screen: keyof RootStackParamList;
      params?: RootStackParamList[keyof RootStackParamList];
    };

type RadialItem = {
  key: string;
  icon: string;
  angle: number;
  target: NavigationTarget;
};

type DrawerItem = {
  key: string;
  icon: string;
  target: NavigationTarget;
};

const RADIAL_ITEMS: RadialItem[] = [
  { key: 'bible', icon: 'book-cross', angle: -90, target: { type: 'stack', screen: 'Bible' } },
  { key: 'kholagy', icon: 'church', angle: -30, target: { type: 'tab', tab: 'kholagy', params: { category: 'kholagy' } } },
  { key: 'fractions', icon: 'bread-slice', angle: 30, target: { type: 'tab', tab: 'kholagy', params: { category: 'fractions' } } },
  { key: 'psalmody', icon: 'music-note-outline', angle: 90, target: { type: 'tab', tab: 'kholagy', params: { category: 'psalmody' } } },
  { key: 'prayers', icon: 'hands-pray', angle: 150, target: { type: 'tab', tab: 'kholagy', params: { category: 'prayers' } } },
  { key: 'synaxarium', icon: 'book-open-page-variant', angle: 210, target: { type: 'tab', tab: 'kholagy', params: { category: 'synaxarium' } } },
];

const DRAWER_ITEMS: DrawerItem[] = [
  { key: 'bible', icon: 'book-cross', target: { type: 'stack', screen: 'Bible' } },
  { key: 'kholagy', icon: 'church', target: { type: 'tab', tab: 'kholagy', params: { category: 'kholagy' } } },
  { key: 'fractions', icon: 'bread-slice', target: { type: 'tab', tab: 'kholagy', params: { category: 'fractions' } } },
  { key: 'prayers', icon: 'hands-pray', target: { type: 'tab', tab: 'kholagy', params: { category: 'prayers' } } },
  { key: 'psalmody', icon: 'music-note-outline', target: { type: 'tab', tab: 'kholagy', params: { category: 'psalmody' } } },
  { key: 'synaxarium', icon: 'book-open-page-variant', target: { type: 'tab', tab: 'kholagy', params: { category: 'synaxarium' } } },
  { key: 'settings', icon: 'cog-outline', target: { type: 'tab', tab: 'settings' } },
];

const ACTIONS = [
  { key: 'follow', icon: 'account-heart-outline' },
  { key: 'about', icon: 'information-outline' },
  { key: 'share', icon: 'share-variant' },
] as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 55, 108, 0.35)',
  },
  scrollContent: {
    paddingBottom: 200,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  heroCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  heroGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(97,195,255,0.08)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  radialAnchor: {
    position: 'absolute',
    alignItems: 'center',
  },
  radialButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  radialLabel: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  dateSection: {
    marginTop: 36,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  copticText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  actionColumn: {
    position: 'absolute',
    bottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 26,
    backgroundColor: '#F57C2C',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '72%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  drawerList: {
    flex: 1,
    marginTop: 28,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  drawerItemLabel: {
    fontSize: 15,
  },
  drawerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { config } = useAppConfig();
  const { resolvedTheme, isRTL, uiLang } = useLanguage();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);

  const palette = config.theme[resolvedTheme];

  const circleSize = useMemo(() => Math.min(width * 0.55, 220), [width]);
  const iconSize = useMemo(() => Math.max(58, Math.min(72, circleSize * 0.42)), [circleSize]);
  const orbitRadius = useMemo(() => circleSize / 2 + iconSize * 0.5, [circleSize, iconSize]);
  const centerOffset = useMemo(() => circleSize / 2 - iconSize / 2, [circleSize, iconSize]);

  const radialLayout = useMemo(
    () =>
      RADIAL_ITEMS.map((item) => {
        const radians = (item.angle * Math.PI) / 180;
        const translateX = Math.cos(radians) * orbitRadius * (isRTL ? -1 : 1);
        const translateY = Math.sin(radians) * orbitRadius;
        return {
          ...item,
          translateX,
          translateY,
        };
      }),
    [isRTL, orbitRadius],
  );

  const formattedDate = useMemo(() => {
    const now = new Date();
    try {
      return new Intl.DateTimeFormat(uiLang, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now);
    } catch (error) {
      return now.toLocaleDateString(uiLang, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }, [uiLang]);

  const handleNavigate = useCallback(
    (target: NavigationTarget) => {
      setMenuOpen(false);
      if (target.type === 'stack') {
        navigation
          .getParent<NativeStackNavigationProp<RootStackParamList>>()
          ?.navigate(target.screen as any, target.params as any);
        return;
      }
      navigation.navigate(target.tab as any, target.params as any);
    },
    [navigation],
  );

  const handleActionPress = useCallback(
    (key: (typeof ACTIONS)[number]['key']) => {
      Alert.alert(t(`home.actions.${key}`), t('home.actions.comingSoon'));
    },
    [t],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.gradient, { backgroundColor: palette.background }]}>
        <View pointerEvents="none" style={styles.gradientOverlay} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ zIndex: 1 }}
        >
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
            <Pressable
              onPress={() => setMenuOpen(true)}
              style={styles.headerButton}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="menu" size={24} color={palette.textPrimary} />
            </Pressable>
            <Text
              style={{
                ...styles.headerTitle,
                color: palette.textPrimary,
                textAlign: 'center',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {t('appTitle')}
            </Text>
            <View
              style={[
                styles.headerIcons,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Pressable
                onPress={() => handleActionPress('follow')}
                style={[styles.headerButton, { marginHorizontal: 4 }]}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="bell-outline" size={22} color={palette.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() => handleActionPress('about')}
                style={[styles.headerButton, { marginHorizontal: 4 }]}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="information-outline" size={22} color={palette.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.heroSection}>
            <View
              style={{
                ...styles.heroCircle,
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                backgroundColor: `${palette.surface}F2`,
                borderWidth: 1,
                borderColor: `${palette.primary}40`,
              }}
            >
              <View
                style={{
                  ...styles.heroGlow,
                  borderRadius: circleSize / 2,
                  backgroundColor: `${palette.primary}26`,
                }}
              />
              <MaterialCommunityIcons name="cross-bolnisi" size={48} color={palette.accent} />
              <Text
                style={{
                  ...styles.heroTitle,
                  color: palette.textPrimary,
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                }}
              >
                {t('home.heroTitle')}
              </Text>
              <Text
                style={{
                  ...styles.heroSubtitle,
                  color: palette.textSecondary,
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                }}
              >
                {t('home.heroSubtitle')}
              </Text>

              {radialLayout.map((item) => (
                <View
                  key={item.key}
                  style={{
                    ...styles.radialAnchor,
                    left: centerOffset,
                    top: centerOffset,
                    transform: [
                      { translateX: item.translateX },
                      { translateY: item.translateY },
                    ],
                  }}
                >
                  <Pressable
                    onPress={() => handleNavigate(item.target)}
                    accessibilityRole="button"
                    style={{
                      ...styles.radialButton,
                      width: iconSize,
                      height: iconSize,
                      borderRadius: iconSize / 2,
                      backgroundColor: `${palette.surface}F0`,
                      borderColor: `${palette.primary}45`,
                    }}
                  >
                    <MaterialCommunityIcons name={item.icon as any} size={28} color={palette.primary} />
                  </Pressable>
                  <Text
                    numberOfLines={2}
                    style={{
                      ...styles.radialLabel,
                      color: palette.textPrimary,
                      maxWidth: iconSize + 24,
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    }}
                  >
                    {t(`home.radial.${item.key}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.dateSection}>
            <Text
              style={{
                ...styles.dateText,
                color: palette.textPrimary,
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {t('home.dateLabel', { date: formattedDate })}
            </Text>
            <Text
              style={{
                ...styles.copticText,
                color: palette.accent,
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {t('home.copticLabel', { date: t('home.copticExample') })}
            </Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.actionColumn,
            isRTL ? { right: 24 } : { left: 24 },
            { zIndex: 2 },
          ]}
        >
          {ACTIONS.map((action, index) => (
            <Pressable
              key={action.key}
              onPress={() => handleActionPress(action.key)}
              style={{
                ...styles.actionButton,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                marginTop: index === 0 ? 0 : 12,
              }}
              accessibilityRole="button"
            >
              <View style={styles.actionIcon}>
                <MaterialCommunityIcons name={action.icon as any} size={22} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  ...styles.actionLabel,
                  marginHorizontal: 12,
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                }}
              >
                {t(`home.actions.${action.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {menuOpen ? (
          <View style={styles.drawerOverlay}>
            <Pressable style={styles.drawerBackdrop} onPress={() => setMenuOpen(false)} />
            <View
              style={[
                styles.drawer,
                isRTL
                  ? { right: 0, borderTopLeftRadius: 28, borderBottomLeftRadius: 28 }
                  : { left: 0, borderTopRightRadius: 28, borderBottomRightRadius: 28 },
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: palette.surface, opacity: 0.96 },
                ]}
              />
              <View style={styles.drawerInner}>
                <View
                  style={[
                    styles.drawerHeader,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  <Text
                    style={{
                      ...styles.drawerTitle,
                      color: palette.textPrimary,
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    }}
                  >
                    {t('home.drawerTitle')}
                  </Text>
                  <Pressable
                    onPress={() => setMenuOpen(false)}
                    style={styles.headerButton}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="close" size={22} color={palette.textPrimary} />
                  </Pressable>
                </View>
                <View style={styles.drawerList}>
                  {DRAWER_ITEMS.map((item, index) => (
                    <Pressable
                      key={item.key}
                      onPress={() => handleNavigate(item.target)}
                      style={{
                        ...styles.drawerItem,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        borderBottomColor:
                          index === DRAWER_ITEMS.length - 1
                            ? 'transparent'
                            : `${palette.divider}66`,
                      }}
                      accessibilityRole="button"
                    >
                      <View style={styles.drawerIcon}>
                        <MaterialCommunityIcons name={item.icon as any} size={24} color={palette.primary} />
                      </View>
                      <Text
                        style={{
                          ...styles.drawerItemLabel,
                          color: palette.textPrimary,
                          marginHorizontal: 16,
                          writingDirection: isRTL ? 'rtl' : 'ltr',
                        }}
                      >
                        {t(`home.drawer.items.${item.key}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default HomeScreen;
