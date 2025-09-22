import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import Tabs from './navigation/Tabs';
import type { RootStackParamList } from './navigation/types';
import ReaderScreen from './screens/ReaderScreen';
import SettingsScreen from './screens/SettingsScreen';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { AppConfigProvider, useAppConfig } from './src/context/AppConfigContext';
import { PreferencesProvider, usePreferences } from './src/context/PreferencesContext';
import { SearchProvider } from './src/context/SearchContext';
import BibleScreen from './src/screens/BibleScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import './src/i18n';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { resolvedTheme, ready: languageReady } = useLanguage();
  const { config, ready: configReady } = useAppConfig();
  const { ready: preferencesReady } = usePreferences();
  const { t } = useTranslation();

  const palette = config.theme[resolvedTheme];
  const allReady = languageReady && configReady && preferencesReady;

  const navigationTheme: NavigationTheme = {
    dark: resolvedTheme === 'dark',
    colors: {
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.textPrimary,
      border: palette.divider,
      notification: palette.accent,
    },
  };

  if (!allReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerTintColor: palette.textPrimary,
          headerStyle: {
            backgroundColor: palette.surface,
          },
          headerShadowVisible: config.navigation.headers.style === 'elevated',
        }}
      >
        <Stack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={({ route }) => ({
            title: route.params.title || t('appTitle'),
          })}
        />
        <Stack.Screen
          name="Bible"
          component={BibleScreen}
          options={{
            title: t('menu.bible'),
          }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            title: t('menu.calendar'),
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: t('menu.settings'),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppConfigProvider>
        <PreferencesProvider>
          <LanguageProvider>
            <SearchProvider>
              <RootNavigator />
            </SearchProvider>
          </LanguageProvider>
        </PreferencesProvider>
      </AppConfigProvider>
    </GestureHandlerRootView>
  );
};

export default App;
