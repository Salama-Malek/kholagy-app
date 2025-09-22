export type Category =
  | 'kholagy'
  | 'liturgies'
  | 'fractions'
  | 'prayers'
  | 'bible'
  | 'agpeya'
  | 'synaxarium'
  | 'psalmody'
  | 'feastsCalendar';

export type TabKey =
  | 'home'
  | 'bible'
  | 'kholagy'
  | 'more'
  | 'fractions'
  | 'prayers'
  | 'settings';

export type TabParamList = {
  home: undefined;
  bible: undefined;
  kholagy: { category?: Category } | undefined;
  more: undefined;
  fractions: { category?: Category } | undefined;
  prayers: { category?: Category } | undefined;
  settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Reader: {
    itemId: string;
    title: string;
  };
};
