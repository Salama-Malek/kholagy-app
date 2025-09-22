import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../src/context/LanguageContext';
import { useAppConfig } from '../src/context/AppConfigContext';
import ListScreen from '../screens/ListScreen';
import MenuScreen from '../src/screens/MenuScreen';
import { TabKey, TabParamList } from './types';

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
          backgroundColor: `${palette.surface}CC`,
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 0,
          height: 64,
          paddingBottom: 8,
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
              headerShown: tab.key === 'home' ? false : undefined,
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
