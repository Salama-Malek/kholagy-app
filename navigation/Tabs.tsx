import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { useAppConfig } from '../src/context/AppConfigContext';
import ListScreen from '../screens/ListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import BibleScreen from '../screens/BibleScreen';
import MoreScreen from '../screens/MoreScreen';
import { TabKey, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const iconAlias: Record<string, string> = {
  book: 'book-open-variant',
  'more-horiz': 'dots-horizontal',
  settings: 'cog-outline',
};

const screenRegistry: Record<TabKey, { component: React.ComponentType<any>; initialParams?: Record<string, unknown> }> = {
  home: { component: HomeScreen },
  bible: { component: BibleScreen },
  kholagy: { component: ListScreen, initialParams: { category: 'kholagy' } },
  more: { component: MoreScreen },
  fractions: { component: ListScreen, initialParams: { category: 'fractions' } },
  prayers: { component: ListScreen, initialParams: { category: 'prayers' } },
  settings: { component: SettingsScreen },
};

const Tabs = () => {
  const { theme, resolvedTheme, isRTL, uiLang } = useLanguage();
  const { config } = useAppConfig();

  const palette = config.theme[resolvedTheme];

  const tabs = config.navigation.tabs;

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: palette.tabActive,
        tabBarInactiveTintColor: palette.tabInactive,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.divider,
          direction: isRTL ? 'rtl' : 'ltr',
        },
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
      {tabs.map((tab) => {
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
