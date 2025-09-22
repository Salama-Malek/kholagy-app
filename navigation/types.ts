import type { NavigatorScreenParams } from '@react-navigation/native';

export type Category =
  | 'kholagy'
  | 'liturgies'
  | 'fractions'
  | 'prayers'
  | 'bible'
  | 'agpeya'
  | 'synaxarium'
  | 'psalmody'
  | 'quotes'
  | 'encyclopedia'
  | 'feastsCalendar';

export type TabKey = 'kholagy' | 'fractions' | 'prayers' | 'settings';

export type TabParamList = {
  kholagy: { category?: Category } | undefined;
  fractions: { category?: Category } | undefined;
  prayers: { category?: Category } | undefined;
  settings: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  Reader: {
    itemId: string;
    title: string;
  };
  Bible: undefined;
  Calendar: undefined;
  Settings: undefined;
};
