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
      retry: 'Retry',
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
        welcomeTitle: 'Peace and grace',
        welcomeSubtitle: 'Explore the riches of the Coptic Orthodox Church.',
        todaysDateLabel: 'Today',
        copticDateLabel: 'Coptic calendar',
        dateError: 'Unable to load the Coptic date.',
        cards: {
          kholagy: 'Kholagy',
          fractions: 'Fractions',
          prayers: 'Prayers',
          calendar: 'Coptic Calendar',
          bible: 'Bible',
          settings: 'Settings'
        },
        heroActions: {
          calendar: 'Open calendar',
          library: 'Browse library'
        },
        quickActionsTitle: 'Quick access',
        quickActionsSubtitle: 'Jump straight into the texts you need most.',
        highlightsTitle: 'Daily highlights',
        highlightsCta: 'Open full calendar',
        highlightsEmpty: 'Liturgical readings will appear once loaded.',
        highlightsError: 'Unable to load readings preview.',
        curatedTitle: 'Curated for you',
        curatedSubtitle: 'Hand-picked texts ready to explore.',
        curatedEmpty: 'Library content will appear once available.',
        viewAll: 'Browse full library',
        actionDescriptions: {
          kholagy: 'Divine liturgies and rites',
          fractions: 'Fraction prayers and litanies',
          prayers: 'Personal prayers and devotions',
          calendar: 'Daily Coptic readings',
          bible: 'Read Scripture by chapter',
          settings: 'Personalise your experience'
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
        share: 'Share selection',
        toastCopied: 'Text copied to clipboard',
        toastShared: 'Sharing options opened'
      },
      bible: {
        searchPlaceholder: 'Search the Bible',
        translationTitle: 'Translations',
        translationLabel: {
          en: 'English (KJV)',
          ar: 'Arabic (SVD)',
          ru: 'Russian (Synodal)',
        },
        testaments: {
          old: 'Old Testament',
          new: 'New Testament',
        },
        groups: {
          law: 'Law',
          historical: 'Historical Books',
          wisdom: 'Wisdom',
          prophets: 'Prophets',
          deuterocanon: 'Deuterocanon',
          gospels: 'Gospels',
          acts: 'Acts',
          epistles: 'Epistles',
          revelation: 'Revelation',
          other: 'Other books',
        },
        booksTitle: 'Books',
        chaptersTitle: 'Chapters',
        searchResultsTitle: '{{count}} results',
        searchNoResults: 'No verses found.',
        noTranslations: 'No translations available yet.',
        emptyBooks: 'Books will appear once this translation is ready.',
        emptyVerses: 'Select a book and chapter to start reading.',
        toastBookmarkAdded: 'Verse saved to bookmarks',
        toastBookmarkRemoved: 'Bookmark removed',
        toastCopied: 'Verse copied to clipboard',
        toastBookUnavailable: 'Book unavailable in this translation.',
        offlineNotice: 'Offline mode — showing the last saved chapter.',
        chapterNumber: 'Chapter {{number}}',
      },
      calendar: {
        dailyReadingsTitle: 'Daily readings',
        readingsEmpty: 'No readings available for this day.',
        synaxariumTitle: 'Synaxarium',
        synaxariumEmpty: 'No Synaxarium entries for this day.',
        errorTitle: 'Unable to load the Coptic calendar.',
        errorSubtitle: 'Please check your connection and try again.',
        copticFallback: 'Coptic date unavailable.',
        copticYearSuffix: 'AM',
        previousDayHint: 'Show the previous day',
        nextDayHint: 'Show the next day',
        services: {
          matins: 'Matins',
          vespers: 'Vespers',
          liturgy: 'Divine Liturgy',
        },
      },
      menu: {
        librarySection: 'More resources',
        bible: 'Bible',
        copticCalendar: 'Coptic Calendar',
        agpeya: 'Agpeya',
        synaxarium: 'Synaxarium',
        psalmody: 'Psalmody',
        quotes: 'Quotes',
        encyclopedia: 'Encyclopedia',
        settings: 'Settings'
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
      retry: 'أعد المحاولة',
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
        welcomeTitle: 'سلام ونعمة',
        welcomeSubtitle: 'اكتشف كنوز الكنيسة القبطية الأرثوذكسية.',
        todaysDateLabel: 'اليوم',
        copticDateLabel: 'التقويم القبطي',
        dateError: 'تعذّر تحميل التاريخ القبطي.',
        cards: {
          kholagy: 'الخولاجي',
          fractions: 'الأواشي/الكسور',
          prayers: 'الصلوات',
          calendar: 'التقويم القبطي',
          bible: 'الكتاب المقدس',
          settings: 'الإعدادات'
        },
        heroActions: {
          calendar: 'افتح التقويم',
          library: 'تصفح المكتبة'
        },
        quickActionsTitle: 'وصول سريع',
        quickActionsSubtitle: 'انتقل مباشرة إلى النصوص التي تحتاجها.',
        highlightsTitle: 'إضاءات اليوم',
        highlightsCta: 'عرض التقويم بالكامل',
        highlightsEmpty: 'ستظهر القراءات الطقسية بعد تحميلها.',
        highlightsError: 'تعذّر تحميل معاينة القراءات.',
        curatedTitle: 'مختارات من أجلك',
        curatedSubtitle: 'نصوص مختارة جاهزة للاستكشاف.',
        curatedEmpty: 'ستظهر مواد المكتبة عند توفرها.',
        viewAll: 'تصفح المكتبة بالكامل',
        actionDescriptions: {
          kholagy: 'القداسات والأسرار الكنسية',
          fractions: 'صلوات الكسور والأواشي',
          prayers: 'صلوات شخصية وتأملات',
          calendar: 'قراءات اليوم القبطية',
          bible: 'قراءة الكتاب المقدس بحسب الإصحاح',
          settings: 'خصّص تجربتك'
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
        share: 'مشاركة النص المحدد',
        toastCopied: 'تم نسخ النص إلى الحافظة',
        toastShared: 'تم فتح خيارات المشاركة'
      },
      bible: {
        searchPlaceholder: 'ابحث في الكتاب المقدس',
        translationTitle: 'الترجمات',
        translationLabel: {
          en: 'الإنجليزية (KJV)',
          ar: 'العربية (SVD)',
          ru: 'الروسية (السينودالية)',
        },
        testaments: {
          old: 'العهد القديم',
          new: 'العهد الجديد',
        },
        groups: {
          law: 'الناموس',
          historical: 'الكتب التاريخية',
          wisdom: 'أسفار الحكمة',
          prophets: 'الأنبياء',
          deuterocanon: 'الأسفار القانونية الثانية',
          gospels: 'الأناجيل',
          acts: 'أعمال الرسل',
          epistles: 'الرسائل',
          revelation: 'سفر الرؤيا',
          other: 'أسفار أخرى',
        },
        booksTitle: 'الأسفار',
        chaptersTitle: 'الإصحاحات',
        searchResultsTitle: '{{count}} نتيجة',
        searchNoResults: 'لا توجد آيات مطابقة.',
        noTranslations: 'لا تتوفر ترجمات بعد.',
        emptyBooks: 'ستظهر الأسفار هنا عند توفر الترجمة.',
        emptyVerses: 'اختر سفرًا وإصحاحًا لبدء القراءة.',
        toastBookmarkAdded: 'تم حفظ الآية في العلامات',
        toastBookmarkRemoved: 'تمت إزالة العلامة',
        toastCopied: 'تم نسخ الآية',
        toastBookUnavailable: 'السفر غير متوفر في هذه الترجمة',
        offlineNotice: 'وضع عدم الاتصال — يتم عرض آخر إصحاح محفوظ.',
        chapterNumber: 'الإصحاح {{number}}',
      },
      calendar: {
        dailyReadingsTitle: 'قراءات اليوم',
        readingsEmpty: 'لا توجد قراءات لهذا اليوم.',
        synaxariumTitle: 'السنكسار',
        synaxariumEmpty: 'لا توجد سير قديسين لهذا اليوم.',
        errorTitle: 'تعذّر تحميل التقويم القبطي.',
        errorSubtitle: 'تحقق من الاتصال وحاول مرة أخرى.',
        copticFallback: 'التاريخ القبطي غير متاح.',
        copticYearSuffix: 'ش.',
        previousDayHint: 'عرض اليوم السابق',
        nextDayHint: 'عرض اليوم التالي',
        services: {
          matins: 'باكر',
          vespers: 'عشية',
          liturgy: 'القداس الإلهي',
        },
      },
      menu: {
        librarySection: 'موارد إضافية',
        bible: 'الكتاب المقدس',
        copticCalendar: 'التقويم القبطي',
        agpeya: 'الأجبية',
        synaxarium: 'السنكسار',
        psalmody: 'الإبصلمودية',
        quotes: 'أقوال روحية',
        encyclopedia: 'موسوعة',
        settings: 'الإعدادات'
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
      retry: 'Повторить',
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
        welcomeTitle: 'Мир и благодать',
        welcomeSubtitle: 'Исследуйте сокровища Коптской Православной Церкви.',
        todaysDateLabel: 'Сегодня',
        copticDateLabel: 'Коптский календарь',
        dateError: 'Не удалось загрузить коптскую дату.',
        cards: {
          kholagy: 'Литургии',
          fractions: 'Фракции',
          prayers: 'Молитвы',
          calendar: 'Коптский календарь',
          bible: 'Библия',
          settings: 'Настройки'
        },
        heroActions: {
          calendar: 'Открыть календарь',
          library: 'Перейти в библиотеку'
        },
        quickActionsTitle: 'Быстрый доступ',
        quickActionsSubtitle: 'Мгновенно переходите к нужным текстам.',
        highlightsTitle: 'Главное за сегодня',
        highlightsCta: 'Открыть календарь полностью',
        highlightsEmpty: 'Литургические чтения появятся после загрузки.',
        highlightsError: 'Не удалось загрузить предварительный просмотр чтений.',
        curatedTitle: 'Подборка для вас',
        curatedSubtitle: 'Отобранные тексты для изучения.',
        curatedEmpty: 'Материалы библиотеки появятся, как только станут доступны.',
        viewAll: 'Перейти ко всей библиотеке',
        actionDescriptions: {
          kholagy: 'Божественные литургии и обряды',
          fractions: 'Молитвы фракций и прошения',
          prayers: 'Личные молитвы и благочестие',
          calendar: 'Ежедневные коптские чтения',
          bible: 'Чтение Священного Писания по главам',
          settings: 'Настройте приложение под себя'
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
        share: 'Поделиться выделенным',
        toastCopied: 'Текст скопирован в буфер обмена',
        toastShared: 'Открыто меню поделиться'
      },
      bible: {
        searchPlaceholder: 'Поиск по Библии',
        translationTitle: 'Переводы',
        translationLabel: {
          en: 'Английский (KJV)',
          ar: 'Арабский (SVD)',
          ru: 'Русский (Синодальный)',
        },
        testaments: {
          old: 'Ветхий Завет',
          new: 'Новый Завет',
        },
        groups: {
          law: 'Закон',
          historical: 'Исторические книги',
          wisdom: 'Премудростные книги',
          prophets: 'Пророки',
          deuterocanon: 'Второканонические книги',
          gospels: 'Евангелия',
          acts: 'Деяния',
          epistles: 'Послания',
          revelation: 'Откровение',
          other: 'Другие книги',
        },
        booksTitle: 'Книги',
        chaptersTitle: 'Главы',
        searchResultsTitle: '{{count}} результатов',
        searchNoResults: 'Совпадений не найдено.',
        noTranslations: 'Переводы пока недоступны.',
        emptyBooks: 'Книги появятся, когда перевод будет готов.',
        emptyVerses: 'Выберите книгу и главу, чтобы начать чтение.',
        toastBookmarkAdded: 'Стих добавлен в закладки',
        toastBookmarkRemoved: 'Закладка удалена',
        toastCopied: 'Стих скопирован',
        toastBookUnavailable: 'Книга недоступна в этом переводе.',
        offlineNotice: 'Автономный режим — показана последняя сохранённая глава.',
        chapterNumber: 'Глава {{number}}',
      },
      calendar: {
        dailyReadingsTitle: 'Ежедневные чтения',
        readingsEmpty: 'Чтения для этого дня отсутствуют.',
        synaxariumTitle: 'Синаксарь',
        synaxariumEmpty: 'На этот день нет записей Синаксаря.',
        errorTitle: 'Не удалось загрузить коптский календарь.',
        errorSubtitle: 'Проверьте подключение и повторите попытку.',
        copticFallback: 'Коптская дата недоступна.',
        copticYearSuffix: 'АМ',
        previousDayHint: 'Показать предыдущий день',
        nextDayHint: 'Показать следующий день',
        services: {
          matins: 'Утреня',
          vespers: 'Вечерня',
          liturgy: 'Божественная литургия',
        },
      },
      menu: {
        librarySection: 'Дополнительные разделы',
        bible: 'Библия',
        copticCalendar: 'Коптский календарь',
        agpeya: 'Агпея',
        synaxarium: 'Синаксарь',
        psalmody: 'Псалмодия',
        quotes: 'Цитаты',
        encyclopedia: 'Энциклопедия',
        settings: 'Настройки'
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
