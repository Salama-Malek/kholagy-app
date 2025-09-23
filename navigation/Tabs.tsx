import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { useAppConfig } from '../src/context/AppConfigContext';
import ListScreen from '../screens/ListScreen';
import MenuScreen from '../src/screens/MenuScreen';
import { TabKey, TabParamList } from './types';
import { appConfig } from '../src/config/appConfig';

const Tab = createBottomTabNavigator<TabParamList>();

const iconAlias: Record<string, string> = {
  book: 'book-open-variant',
  'more-horiz': 'dots-horizontal',
  settings: 'cog-outline',
};

const screenRegistry: Record<TabKey, { component: React.ComponentType<any>; initialParams?: Record<string, unknown> }> = {
  kholagy: { component: ListScreen, initialParams: { category: 'kholagy' } },
  fractions: { component: ListScreen, initialParams: { category: 'fractions' } },
  prayers: { component: ListScreen, initialParams: { category: 'prayers' } },
  settings: { component: MenuScreen },
};

const Tabs = () => {
  const { resolvedTheme, isRTL, uiLang } = useLanguage();
  const { config } = useAppConfig();

  const palette = useMemo(() => config.theme[resolvedTheme] ?? config.theme.light, [config.theme, resolvedTheme]);

  const resolvedTabs = useMemo(() => {
    const configured = Array.isArray(config.navigation?.tabs) ? config.navigation.tabs : [];
    const pickSource = configured.length > 0 ? configured : appConfig.navigation.tabs;
    const filtered = pickSource.filter(
      (tab): tab is typeof pickSource[number] & { key: TabKey; title: Record<string, string>; icon: string } =>
        Boolean(tab && typeof tab.key === 'string' && (tab.key as TabKey) in screenRegistry),
    );
    if (filtered.length > 0) {
      return filtered;
    }
    return appConfig.navigation.tabs.filter(
      (tab): tab is typeof appConfig.navigation.tabs[number] & { key: TabKey; title: Record<string, string>; icon: string } =>
        Boolean(tab && typeof tab.key === 'string' && (tab.key as TabKey) in screenRegistry),
    );
  }, [config.navigation?.tabs]);

  return (
    <Tab.Navigator
      initialRouteName="kholagy"
      sceneContainerStyle={{ backgroundColor: palette.background }}
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: palette.tabActive,
        tabBarInactiveTintColor: palette.tabInactive,
        tabBarStyle: {
          backgroundColor: `${palette.surface}CC`,
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
          height: 64,
          paddingBottom: 8,
          direction: isRTL ? 'rtl' : 'ltr',
        },
        tabBarHideOnKeyboard: true,
        headerStyle: {
          backgroundColor: palette.surface,
          elevation: config.navigation.headers.style === 'elevated' ? 2 : 0,
          shadowOpacity: config.navigation.headers.style === 'elevated' ? 0.2 : 0,
        },
        headerTitleStyle: {
          color: palette.textPrimary,
          fontWeight: config.theme.typography.headingWeight,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: config.theme.typography.bodyWeight,
          textAlign: isRTL ? 'right' : 'left',
        },
      }}
    >
      {resolvedTabs.map((tab) => {
        const definition = screenRegistry[tab.key as TabKey];
        if (!definition) {
          return null;
        }
        const iconName = iconAlias[tab.icon] ?? tab.icon;
        const label = tab.title[uiLang] ?? tab.title.en ?? tab.key;
        return (
          <Tab.Screen
            key={tab.key}
            name={tab.key as keyof TabParamList}
            component={definition.component}
            initialParams={definition.initialParams}
            options={{
              title: label,
              headerShown: tab.key === 'kholagy' ? false : undefined,
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons
                  name={iconName as any}
                  size={config.icons.size}
                  color={color}
                />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
};

export default Tabs;
