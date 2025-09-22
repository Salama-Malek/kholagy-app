export const uiLanguages = ["ar", "en", "ru"] as const;
export type UILanguageCode = typeof uiLanguages[number];

export const textLanguages = ["ar", "en", "ru", "cop", "arcop"] as const;
export type TextLanguageCode = typeof textLanguages[number];

export type AppVariantKey = 'default' | 'kholagyFocus';

export const appConfig = {
  app: {
    id: "com.yourorg.kholagy",
    name: "Digital Kholagy",
    modeledAfter: "Katamars + Orsozoxi",
    sources: [
      { name: "Google Play listing", ref: "com.app.orsozoxi" }
    ]
  },
  platform: {
    targets: ["android", "ios"],
    orientation: "portrait",
    offlineFirst: true,
    bundleTextFiles: true
  },
  i18n: {
    uiLanguages,
    textLanguages,
    rtlFor: ['ar', 'arcop'] as TextLanguageCode[],
    defaultUILang: 'ar' as UILanguageCode,
    defaultTextLang: 'ar' as TextLanguageCode
  },
  theme: {
    light: {
      background: "#FFFFFF",
      surface: "#F7F7F7",
      textPrimary: "#111111",
      textSecondary: "#4A4A4A",
      primary: "#C2185B",
      accent: "#009688",
      divider: "#E0E0E0",
      tabActive: "#C2185B",
      tabInactive: "#9E9E9E"
    },
    dark: {
      background: "#121212",
      surface: "#1E1E1E",
      textPrimary: "#FFFFFF",
      textSecondary: "#C7C7C7",
      primary: "#FF5C93",
      accent: "#4DB6AC",
      divider: "#2A2A2A",
      tabActive: "#FF5C93",
      tabInactive: "#9E9E9E"
    },
    typography: {
      baseSize: 16,
      scaleMin: 0.9,
      scaleMax: 1.6,
      headingWeight: "700",
      bodyWeight: "400",
      lineHeight: 1.6
    }
  },
  navigation: {
    type: 'bottomTabs' as const,
    tabs: [
      { key: 'home', title: { ar: 'الرئيسية', en: 'Home', ru: 'Главная' }, icon: 'home' },
      { key: 'bible', title: { ar: 'الكتاب المقدس', en: 'Bible', ru: 'Библия' }, icon: 'book' },
      { key: 'kholagy', title: { ar: 'السِكِّيل/الخولاجي', en: 'Kholagy', ru: 'Литургии' }, icon: 'church' },
      { key: 'more', title: { ar: 'أخرى', en: 'More', ru: 'Еще' }, icon: 'more-horiz' }
    ],
    headers: {
      style: 'elevated' as const,
      searchOnSupportedScreens: true
    }
  },
  home: {
    sections: [
      { key: 'dailyReadingsShortcut', visible: true },
      {
        key: 'quickAccessGrid',
        items: ['bible', 'kholagy', 'agpeya', 'synaxarium', 'psalmody', 'feastsCalendar']
      },
      { key: 'messagesTicker', visible: true }
    ]
  },
  features: {
    bible: {
      enabled: true,
      languages: ['ar', 'en'] as TextLanguageCode[],
      includes: ['ot', 'nt', 'deuterocanon'],
      search: { fullText: true, highlight: true },
      bookmarks: true,
      dailyPlans: ['1y', '2y'],
      copyShareHighlight: true
    },
    kholagy: {
      enabled: true,
      liturgies: ['basil', 'gregory', 'cyril'],
      extras: ['fractions', 'prostrations', 'lakkan', 'kandil'],
      layout: { largeTypography: true, sectionTOC: true },
      search: { inPage: true },
      bookmarks: true
    },
    agpeya: { enabled: true },
    katameros: { enabled: true, calendars: ['gregorian', 'coptic'] },
    synaxarium: { enabled: true },
    psalmody: { enabled: true, seasons: ['annual', 'koiahk', 'pascha', 'feastsFasts'] },
    quotes: { enabled: true },
    encyclopedia: { enabled: true },
    media: {
      radio: { enabled: true },
      youtube: { enabled: true },
      greetingCards: { enabled: true },
      games: { enabled: true }
    },
    notifications: {
      enabled: true,
      presets: ['agpeyaHours', 'liturgyTimes', 'dailyReading']
    },
    customization: {
      fontScale: true,
      themeToggle: true,
      blueBackgroundToggle: true
    }
  },
  kholagyFocusVariant: {
    navigation: {
      tabs: [
        { key: 'kholagy', title: { ar: 'الخولاجي', en: 'Kholagy', ru: 'Литургии' }, icon: 'church' },
        { key: 'fractions', title: { ar: 'الأواشي/الكسور', en: 'Fractions', ru: 'Фракции' }, icon: 'bread-slice' },
        { key: 'prayers', title: { ar: 'صلوات', en: 'Prayers', ru: 'Молитвы' }, icon: 'hands-pray' },
        { key: 'settings', title: { ar: 'الإعدادات', en: 'Settings', ru: 'Настройки' }, icon: 'settings' }
      ]
    },
    home: {
      sections: [] as const
    },
    features: {
      bible: { enabled: false },
      agpeya: { enabled: false },
      katameros: { enabled: false },
      synaxarium: { enabled: false },
      psalmody: { enabled: false },
      media: {
        radio: { enabled: false },
        youtube: { enabled: false },
        greetingCards: { enabled: false },
        games: { enabled: false }
      }
    }
  },
  screens: {
    ListScreen: {
      cardStyle: 'list',
      showLangBadges: true,
      filterByLang: true,
      sort: ['season', 'title']
    },
    ReaderScreen: {
      markdown: true,
      inPageSearch: true,
      bookmarkLastScroll: true,
      copyShare: true,
      showTOC: true
    },
    SettingsScreen: {
      sections: [
        { key: 'uiLanguage', options: uiLanguages },
        { key: 'textLanguage', options: textLanguages },
        { key: 'fontScale', min: 0.9, max: 1.6, step: 0.05 },
        { key: 'theme', options: ['light', 'dark', 'system'] as const },
        { key: 'notifications', presets: ['agpeyaHours', 'liturgyTimes', 'dailyReading'] }
      ]
    }
  },
  content: {
    catalogExample: [
      {
        id: 'liturgies/basil',
        title: {
          ar: 'قداس القديس باسيليوس',
          en: 'Liturgy of St. Basil',
          ru: 'Литургия св. Василия'
        },
        category: 'kholagy',
        langs: ['ar', 'en', 'ru', 'cop', 'arcop'],
        slugs: { ar: 'basil', en: 'basil', ru: 'basil', cop: 'basil', arcop: 'basil' }
      }
    ],
    filePattern: '/content/{category}/{slug}.{lang}.md',
    bundle: true
  },
  behaviors: {
    search: { globalOnBible: true, localOnReaders: true },
    bookmarks: { perDocPerLang: true },
    share: { enableTextShare: true },
    clipboard: { allowCopy: true }
  },
  icons: {
    tab: 'material',
    size: 22
  },
  telemetry: {
    crashReporting: false,
    analytics: false
  },
  legal: {
    copyrightNotice: "Verify licensing before shipping texts.",
    privacyPolicyUrl: ""
  },
  meta: {
    notes: [
      'Match Katamars + Orsozoxi layout: bottom tabs, simple headers, clean typography, daily shortcuts.',
      'Use dark mode similar contrast levels.',
      'Respect RTL on Arabic and Arabized Coptic.'
    ],
    version: 1
  }
} as const;

export type AppConfig = typeof appConfig;
