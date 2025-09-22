import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { appConfig, UILanguageCode } from '../config/appConfig';

export type UILanguage = UILanguageCode;

export const UI_LANG_STORAGE_KEY = 'digital-kholagy:uiLang';

const fallbackLang = appConfig.i18n.defaultUILang;
const supportedUiLangs = new Set(appConfig.i18n.uiLanguages);

const resources = {
  en: {
    common: {
      appTitle: 'Digital Kholagy',
      tabs: {
        home: 'Home',
        bible: 'Bible',
        kholagy: 'Kholagy',
        more: 'More',
        liturgies: 'Liturgies',
        fractions: 'Fractions',
        prayers: 'Prayers',
        settings: 'Settings'
      },
      home: {
        dailyReadingsTitle: 'Daily readings',
        dailyReadingsCta: "View today's readings",
        quickAccessTitle: 'Quick access',
        messagesTitle: 'Community messages',
        messagesEmpty: 'No announcements for today.',
        heroTitle: 'Our church treasures',
        heroSubtitle: 'Navigate the liturgies and readings in one place.',
        dateLabel: 'Today: {{date}}',
        copticLabel: 'Coptic calendar: {{date}}',
        copticExample: '10 Tout 1742',
        drawerTitle: 'Library sections',
        radial: {
          bible: 'Holy Bible',
          kholagy: 'Divine Liturgy',
          fractions: 'Fractions',
          psalmody: 'Psalmody',
          prayers: 'Prayers',
          synaxarium: 'Synaxarium'
        },
        drawer: {
          items: {
            bible: 'Holy Bible',
            kholagy: 'Divine Liturgy',
            fractions: 'Fractions',
            psalmody: 'Psalmody',
            prayers: 'Prayers',
            synaxarium: 'Synaxarium',
            settings: 'Settings'
          }
        },
        actions: {
          follow: 'Follow us',
          about: 'About the app',
          share: 'Share the app',
          comingSoon: 'More features are coming soon.'
        }
      },
      quickAccess: {
        bible: 'Bible',
        kholagy: 'Kholagy',
        agpeya: 'Agpeya',
        synaxarium: 'Synaxarium',
        psalmody: 'Psalmody',
        feastsCalendar: 'Feasts calendar'
      },
      list: {
        noItems: 'No texts available yet.',
        unavailable: 'Not available in selected language'
      },
      reader: {
        searchPlaceholder: 'Search text',
        lastPositionRestored: 'Last position restored',
        noContent: 'Content not available in this language yet.',
        fallbackNotice: 'Showing available text while translation is prepared.',
        toc: 'Table of contents',
        share: 'Share selection'
      },
      settings: {
        uiLanguage: 'Interface language',
        textLanguage: 'Text language',
        fontSize: 'Font size',
        theme: 'Theme',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeSystem: 'Follow system',
        notifications: 'Notifications',
        notificationsEnabled: 'Enable notifications',
        presetsLabel: 'Notify me about',
        preset: {
          agpeyaHours: 'Agpeya hours',
          liturgyTimes: 'Liturgy times',
          dailyReading: 'Daily reading'
        },
        customization: 'Customization',
        blueBackground: 'Blue reader background',
        variantLabel: 'Focus mode',
        variantDefault: 'Full library',
        variantKholagy: 'Kholagy focus'
      }
    }
  },
  ar: {
    common: {
      appTitle: 'الخولاجي الرقمي',
      tabs: {
        home: 'الرئيسية',
        bible: 'الكتاب المقدس',
        kholagy: 'الخولاجي',
        more: 'أخرى',
        liturgies: 'القداسات',
        fractions: 'الأواشي/الكسور',
        prayers: 'صلوات',
        settings: 'الإعدادات'
      },
      home: {
        dailyReadingsTitle: 'قراءات اليوم',
        dailyReadingsCta: 'عرض قراءات اليوم',
        quickAccessTitle: 'وصول سريع',
        messagesTitle: 'رسائل الخدمة',
        messagesEmpty: 'لا توجد رسائل اليوم.',
        heroTitle: 'كنوز كنيستنا',
        heroSubtitle: 'اختر القسم الذي ترغب في قراءته أو الصلاة به.',
        dateLabel: 'اليوم: {{date}}',
        copticLabel: 'التقويم القبطي: {{date}}',
        copticExample: '١٠ توت ١٧٤٢',
        drawerTitle: 'أقسام التطبيق',
        radial: {
          bible: 'الكتاب المقدس',
          kholagy: 'الخولاجي المقدس',
          fractions: 'الأواشي والكسور',
          psalmody: 'الإبصلمودية',
          prayers: 'الصلوات',
          synaxarium: 'السنكسار'
        },
        drawer: {
          items: {
            bible: 'الكتاب المقدس',
            kholagy: 'الخولاجي المقدس',
            fractions: 'الأواشي والكسور',
            psalmody: 'الإبصلمودية',
            prayers: 'الصلوات',
            synaxarium: 'السنكسار',
            settings: 'الإعدادات'
          }
        },
        actions: {
          follow: 'تابعنا',
          about: 'عن التطبيق',
          share: 'مشاركة التطبيق',
          comingSoon: 'الميزة ستتوفر قريبًا.'
        }
      },
      quickAccess: {
        bible: 'الكتاب المقدس',
        kholagy: 'الخولاجي',
        agpeya: 'الأجبية',
        synaxarium: 'السنكسار',
        psalmody: 'الإبصلمودية',
        feastsCalendar: 'تقويم الأعياد'
      },
      list: {
        noItems: 'لا توجد نصوص متاحة بعد.',
        unavailable: 'غير متاح باللغة المختارة'
      },
      reader: {
        searchPlaceholder: 'ابحث في النص',
        lastPositionRestored: 'تم استعادة آخر موضع',
        noContent: 'المحتوى غير متوفر بهذه اللغة بعد.',
        fallbackNotice: 'يتم عرض النص المتاح حتى تكتمل الترجمة.',
        toc: 'فهرس المحتوى',
        share: 'مشاركة النص المحدد'
      },
      settings: {
        uiLanguage: 'لغة الواجهة',
        textLanguage: 'لغة النص',
        fontSize: 'حجم الخط',
        theme: 'السمة',
        themeLight: 'فاتح',
        themeDark: 'داكن',
        themeSystem: 'اتباع النظام',
        notifications: 'التنبيهات',
        notificationsEnabled: 'تفعيل التنبيهات',
        presetsLabel: 'التنبيه عن',
        preset: {
          agpeyaHours: 'ساعات الأجبية',
          liturgyTimes: 'مواعيد القداسات',
          dailyReading: 'القراءة اليومية'
        },
        customization: 'التخصيص',
        blueBackground: 'خلفية زرقاء للقراءة',
        variantLabel: 'وضع التركيز',
        variantDefault: 'المكتبة الكاملة',
        variantKholagy: 'تركيز الخولاجي'
      }
    }
  },
  ru: {
    common: {
      appTitle: 'Цифровой Холагий',
      tabs: {
        home: 'Главная',
        bible: 'Библия',
        kholagy: 'Литургии',
        more: 'Еще',
        liturgies: 'Литургии',
        fractions: 'Фракции',
        prayers: 'Молитвы',
        settings: 'Настройки'
      },
      home: {
        dailyReadingsTitle: 'Ежедневные чтения',
        dailyReadingsCta: 'Открыть чтения на сегодня',
        quickAccessTitle: 'Быстрый доступ',
        messagesTitle: 'Сообщения общины',
        messagesEmpty: 'Сегодня объявлений нет.',
        heroTitle: 'Сокровища нашей Церкви',
        heroSubtitle: 'Выберите раздел, чтобы начать чтение и молитву.',
        dateLabel: 'Сегодня: {{date}}',
        copticLabel: 'Коптский календарь: {{date}}',
        copticExample: '10 Тоут 1742',
        drawerTitle: 'Разделы библиотеки',
        radial: {
          bible: 'Священное Писание',
          kholagy: 'Божественная литургия',
          fractions: 'Фракции',
          psalmody: 'Псалмодия',
          prayers: 'Молитвы',
          synaxarium: 'Синаксарь'
        },
        drawer: {
          items: {
            bible: 'Священное Писание',
            kholagy: 'Божественная литургия',
            fractions: 'Фракции',
            psalmody: 'Псалмодия',
            prayers: 'Молитвы',
            synaxarium: 'Синаксарь',
            settings: 'Настройки'
          }
        },
        actions: {
          follow: 'Подписаться',
          about: 'О приложении',
          share: 'Поделиться приложением',
          comingSoon: 'Скоро появятся новые возможности.'
        }
      },
      quickAccess: {
        bible: 'Библия',
        kholagy: 'Литургии',
        agpeya: 'Агпея',
        synaxarium: 'Синаксарь',
        psalmody: 'Псалмодия',
        feastsCalendar: 'Календарь праздников'
      },
      list: {
        noItems: 'Тексты пока недоступны.',
        unavailable: 'Недоступно на выбранном языке'
      },
      reader: {
        searchPlaceholder: 'Поиск по тексту',
        lastPositionRestored: 'Последнее место восстановлено',
        noContent: 'Контент пока недоступен на этом языке.',
        fallbackNotice: 'Показываем доступный текст, пока готовится перевод.',
        toc: 'Оглавление',
        share: 'Поделиться выделенным'
      },
      settings: {
        uiLanguage: 'Язык интерфейса',
        textLanguage: 'Язык текста',
        fontSize: 'Размер шрифта',
        theme: 'Тема',
        themeLight: 'Светлая',
        themeDark: 'Темная',
        themeSystem: 'Системная',
        notifications: 'Уведомления',
        notificationsEnabled: 'Включить уведомления',
        presetsLabel: 'Напоминать о',
        preset: {
          agpeyaHours: 'Часы Агпеи',
          liturgyTimes: 'Время литургий',
          dailyReading: 'Ежедневное чтение'
        },
        customization: 'Персонализация',
        blueBackground: 'Синий фон для чтения',
        variantLabel: 'Режим фокуса',
        variantDefault: 'Вся библиотека',
        variantKholagy: 'Фокус на литургии'
      }
    }
  }
} as const;

type Callback = (lng: UILanguage) => void;

i18n
  .use({
    type: 'languageDetector',
    async: true,
    detect: async (callback: Callback) => {
      try {
        const stored = await AsyncStorage.getItem(UI_LANG_STORAGE_KEY);
        if (stored) {
          callback(stored as UILanguage);
          return;
        }
        const locales = Localization.getLocales();
        if (locales.length > 0) {
          const supported = locales.find((locale) => locale.languageCode && supportedUiLangs.has(locale.languageCode as UILanguage));
          callback((supported?.languageCode as UILanguage) ?? fallbackLang);
          return;
        }
      } catch (error) {
        console.warn('Failed to detect language', error);
      }
      callback(fallbackLang);
    },
    init: () => undefined,
    cacheUserLanguage: async (lng: string) => {
      try {
        await AsyncStorage.setItem(UI_LANG_STORAGE_KEY, lng);
      } catch (error) {
        console.warn('Failed to persist language', error);
      }
    }
  })
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: fallbackLang,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
