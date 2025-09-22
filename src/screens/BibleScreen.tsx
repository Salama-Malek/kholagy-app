import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  BibleBook,
  BibleChapter,
  BibleChapterContent,
  BibleSearchResult,
  BibleSummary,
  BibleVerse,
  DEFAULT_BIBLE_IDS,
  getBooks,
  getChapters,
  getChapterContent,
  listBibles,
  search as searchBible,
} from '../api/bible';
import { useAppConfig } from '../context/AppConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/toast';

type TestamentKey = 'old' | 'new';

type BibleStackParamList = {
  Home: undefined;
  ChapterList: {
    bibleId: string;
    bibleName: string;
    translationLanguage?: string;
    bookId: string;
    bookName: string;
  };
  Chapter: {
    bibleId: string;
    bibleName: string;
    translationLanguage?: string;
    bookId: string;
    bookName: string;
    chapterId: string;
    chapterNumber: string;
    chapterReference: string;
    initialVerseId?: string;
  };
};

const Stack = createNativeStackNavigator<BibleStackParamList>();

const BOOKMARKS_KEY = 'digital-kholagy:bible:bookmarks';
const LAST_CHAPTER_KEY = 'digital-kholagy:bible:lastChapter';

const recognizedBibleIds = new Set(Object.values(DEFAULT_BIBLE_IDS));

type BookDescriptor = {
  id?: string;
  altIds?: string[];
  names?: string[];
};

type BookGroupDefinition = {
  key: string;
  books: BookDescriptor[];
};

const ORTHODOX_STRUCTURE: Record<TestamentKey, BookGroupDefinition[]> = {
  old: [
    { key: 'law', books: [{ id: 'GEN' }, { id: 'EXO' }, { id: 'LEV' }, { id: 'NUM' }, { id: 'DEU' }] },
    {
      key: 'historical',
      books: [
        { id: 'JOS' },
        { id: 'JDG' },
        { id: 'RUT' },
        { id: '1SA', altIds: ['1SAM'] },
        { id: '2SA', altIds: ['2SAM'] },
        { id: '1KI', altIds: ['1KGS'] },
        { id: '2KI', altIds: ['2KGS'] },
        { id: '1CH', altIds: ['1CHR'] },
        { id: '2CH', altIds: ['2CHR'] },
        { id: 'EZR' },
        { id: 'NEH' },
        { id: 'EST', names: ['Esther'] },
      ],
    },
    {
      key: 'wisdom',
      books: [
        { id: 'JOB' },
        { id: 'PSA', names: ['Psalms'] },
        { id: 'PRO', names: ['Proverbs'] },
        { id: 'ECC', names: ['Ecclesiastes'] },
        { id: 'SNG', altIds: ['SON'], names: ['Song of Songs', 'Song of Solomon'] },
      ],
    },
    {
      key: 'prophets',
      books: [
        { id: 'ISA' },
        { id: 'JER' },
        { id: 'LAM' },
        { id: 'BAR' },
        { id: 'EZK', altIds: ['EZE'] },
        { id: 'DAN' },
        { id: 'HOS' },
        { id: 'JOL', altIds: ['JOE'] },
        { id: 'AMO' },
        { id: 'OBA' },
        { id: 'JON' },
        { id: 'MIC' },
        { id: 'NAM', altIds: ['NAH'] },
        { id: 'HAB' },
        { id: 'ZEP', altIds: ['ZEPH'] },
        { id: 'HAG' },
        { id: 'ZEC' },
        { id: 'MAL' },
      ],
    },
    {
      key: 'deuterocanon',
      books: [
        { id: 'TOB', names: ['Tobit'] },
        { id: 'JDT', names: ['Judith'] },
        { id: 'WIS', names: ['Wisdom', 'Wisdom of Solomon'] },
        { id: 'SIR', names: ['Sirach', 'Ecclesiasticus'] },
        { id: 'BAR', names: ['Baruch'] },
        { id: 'LJE', names: ['Letter of Jeremiah'], altIds: ['EPJER'] },
        { id: 'S3Y', altIds: ['PRAZ'], names: ['Prayer of Azariah', 'Song of the Three'] },
        { id: 'SUS', names: ['Susanna'] },
        { id: 'BEL', names: ['Bel and the Dragon'] },
        { id: '1MA', altIds: ['1MAC', 'MA1'], names: ['1 Maccabees'] },
        { id: '2MA', altIds: ['2MAC', 'MA2'], names: ['2 Maccabees'] },
        { id: 'ESG', altIds: ['ADE', 'ADD_ESTH'], names: ['Additions to Esther'] },
      ],
    },
  ],
  new: [
    { key: 'gospels', books: [{ id: 'MAT' }, { id: 'MRK', altIds: ['MAR'] }, { id: 'LUK' }, { id: 'JHN', altIds: ['JOH'] }] },
    { key: 'acts', books: [{ id: 'ACT' }] },
    {
      key: 'epistles',
      books: [
        { id: 'ROM' },
        { id: '1CO', altIds: ['1COR'] },
        { id: '2CO', altIds: ['2COR'] },
        { id: 'GAL' },
        { id: 'EPH' },
        { id: 'PHP', altIds: ['PHI'] },
        { id: 'COL' },
        { id: '1TH', altIds: ['1THS'] },
        { id: '2TH', altIds: ['2THS'] },
        { id: '1TI', altIds: ['1TIM'] },
        { id: '2TI', altIds: ['2TIM'] },
        { id: 'TIT' },
        { id: 'PHM' },
        { id: 'HEB' },
        { id: 'JAS', altIds: ['JAM'] },
        { id: '1PE', altIds: ['1PET'] },
        { id: '2PE', altIds: ['2PET'] },
        { id: '1JN', altIds: ['1JOH'] },
        { id: '2JN', altIds: ['2JOH'] },
        { id: '3JN', altIds: ['3JOH'] },
        { id: 'JUD' },
      ],
    },
    { key: 'revelation', books: [{ id: 'REV' }, { id: 'APC', names: ['Apocalypse'] }] },
  ],
};

const OLD_TESTAMENT_IDS = new Set([
  'GEN',
  'EXO',
  'LEV',
  'NUM',
  'DEU',
  'JOS',
  'JDG',
  'RUT',
  '1SA',
  '2SA',
  '1KI',
  '2KI',
  '1CH',
  '2CH',
  'EZR',
  'NEH',
  'EST',
  'JOB',
  'PSA',
  'PRO',
  'ECC',
  'SNG',
  'ISA',
  'JER',
  'LAM',
  'EZK',
  'DAN',
  'HOS',
  'JOL',
  'AMO',
  'OBA',
  'JON',
  'MIC',
  'NAM',
  'HAB',
  'ZEP',
  'HAG',
  'ZEC',
  'MAL',
  'TOB',
  'JDT',
  'WIS',
  'SIR',
  'BAR',
  'LJE',
  'S3Y',
  'SUS',
  'BEL',
  '1MA',
  '2MA',
  'ESG',
]);

const NEW_TESTAMENT_IDS = new Set([
  'MAT',
  'MRK',
  'LUK',
  'JHN',
  'ACT',
  'ROM',
  '1CO',
  '2CO',
  'GAL',
  'EPH',
  'PHP',
  'COL',
  '1TH',
  '2TH',
  '1TI',
  '2TI',
  'TIT',
  'PHM',
  'HEB',
  'JAS',
  '1PE',
  '2PE',
  '1JN',
  '2JN',
  '3JN',
  'JUD',
  'REV',
  'APC',
]);

type BookSection = {
  key: string;
  title: string;
  data: BibleBook[];
};

type LastChapterCache = {
  bibleId: string;
  chapterId: string;
  bookId: string;
  bookName: string;
  chapterNumber: string;
  chapterReference: string;
  verses: BibleVerse[];
  bibleName?: string;
  translationLanguage?: string;
  timestamp: number;
};

const normalizeId = (value?: string) => (value ? value.replace(/[^A-Z0-9]/gi, '').toUpperCase() : '');
const normalizeName = (value?: string) => (value ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

const filterBooksForTestament = (books: BibleBook[], testament: TestamentKey) => {
  const target = testament === 'old' ? OLD_TESTAMENT_IDS : NEW_TESTAMENT_IDS;
  return books.filter((book) => {
    if (book.testament) {
      const normalized = book.testament.toLowerCase();
      if (testament === 'old' && normalized.startsWith('o')) {
        return true;
      }
      if (testament === 'new' && normalized.startsWith('n')) {
        return true;
      }
    }
    const id = normalizeId(book.id || book.abbreviation);
    return id ? target.has(id) : false;
  });
};

const findBookByDescriptor = (
  descriptor: BookDescriptor,
  books: BibleBook[],
  used: Set<string>,
  byId: Map<string, BibleBook>,
) => {
  const idCandidates = [descriptor.id, ...(descriptor.altIds ?? [])]
    .map((entry) => normalizeId(entry))
    .filter(Boolean);
  for (const candidate of idCandidates) {
    const book = byId.get(candidate);
    if (book && !used.has(book.id)) {
      return book;
    }
  }
  const nameCandidates = (descriptor.names ?? []).map((entry) => normalizeName(entry)).filter(Boolean);
  if (nameCandidates.length > 0) {
    for (const book of books) {
      if (used.has(book.id)) {
        continue;
      }
      const namesToCheck = [book.name, book.nameLong, book.abbreviation].map((value) => normalizeName(value));
      if (namesToCheck.some((name) => name && nameCandidates.includes(name))) {
        return book;
      }
    }
  }
  return null;
};

const buildBookSections = (books: BibleBook[], testament: TestamentKey, t: TFunction): BookSection[] => {
  const relevant = filterBooksForTestament(books, testament);
  const used = new Set<string>();
  const byId = new Map<string, BibleBook>();
  relevant.forEach((book) => {
    byId.set(normalizeId(book.id), book);
    if (book.abbreviation) {
      byId.set(normalizeId(book.abbreviation), book);
    }
  });
  const sections: BookSection[] = [];
  ORTHODOX_STRUCTURE[testament].forEach((group) => {
    const data: BibleBook[] = [];
    group.books.forEach((descriptor) => {
      const book = findBookByDescriptor(descriptor, relevant, used, byId);
      if (book && !used.has(book.id)) {
        used.add(book.id);
        data.push(book);
      }
    });
    if (data.length > 0) {
      sections.push({ key: group.key, title: t(`bible.groups.${group.key}`), data });
    }
  });
  const leftovers = relevant.filter((book) => !used.has(book.id));
  if (leftovers.length > 0) {
    sections.push({ key: 'other', title: t('bible.groups.other'), data: leftovers });
  }
  return sections;
};

const determineDefaultBibleId = (bibles: BibleSummary[], preferredLang?: string): string | null => {
  if (bibles.length === 0) {
    return null;
  }
  const preferredId = preferredLang && DEFAULT_BIBLE_IDS[preferredLang] ? DEFAULT_BIBLE_IDS[preferredLang] : undefined;
  if (preferredId && bibles.some((bible) => bible.id === preferredId)) {
    return preferredId;
  }
  for (const candidate of Object.values(DEFAULT_BIBLE_IDS)) {
    if (bibles.some((bible) => bible.id === candidate)) {
      return candidate;
    }
  }
  return bibles[0]?.id ?? null;
};
const BibleHomeScreen: React.FC<NativeStackScreenProps<BibleStackParamList, 'Home'>> = ({ navigation }) => {
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const { resolvedTheme, isRTL, textLang } = useLanguage();

  const palette = config.theme[resolvedTheme];

  const [bibles, setBibles] = useState<BibleSummary[]>([]);
  const [selectedBibleId, setSelectedBibleId] = useState<string | null>(null);
  const [hasManualTranslation, setHasManualTranslation] = useState(false);
  const [bibleError, setBibleError] = useState<string | null>(null);
  const [loadingBibles, setLoadingBibles] = useState(false);

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(false);

  const [testament, setTestament] = useState<TestamentKey>('old');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingBibles(true);
    setBibleError(null);
    listBibles()
      .then((response) => {
        if (!mounted) {
          return;
        }
        const available = response.filter((bible) => recognizedBibleIds.has(bible.id));
        const usable = available.length > 0 ? available : response;
        setBibles(usable);
        const defaultId = determineDefaultBibleId(usable, textLang);
        setHasManualTranslation(false);
        setSelectedBibleId((current) => {
          if (current && usable.some((entry) => entry.id === current)) {
            return current;
          }
          return defaultId;
        });
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }
        setBibleError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (mounted) {
          setLoadingBibles(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [textLang]);

  useEffect(() => {
    if (hasManualTranslation || bibles.length === 0) {
      return;
    }
    const preferredId = textLang && DEFAULT_BIBLE_IDS[textLang] ? DEFAULT_BIBLE_IDS[textLang] : null;
    if (preferredId && bibles.some((bible) => bible.id === preferredId)) {
      setSelectedBibleId(preferredId);
      return;
    }
    setSelectedBibleId((current) => {
      if (current && bibles.some((bible) => bible.id === current)) {
        return current;
      }
      return determineDefaultBibleId(bibles, textLang);
    });
  }, [bibles, hasManualTranslation, textLang]);

  const selectedBible = useMemo(
    () => (selectedBibleId ? bibles.find((bible) => bible.id === selectedBibleId) ?? null : null),
    [bibles, selectedBibleId],
  );

  const loadBooks = useCallback(
    (bibleId: string) => {
      setLoadingBooks(true);
      setBooksError(null);
      getBooks(bibleId)
        .then((data) => {
          setBooks(data);
        })
        .catch((error) => {
          setBooks([]);
          setBooksError(error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          setLoadingBooks(false);
        });
    },
    [],
  );

  useEffect(() => {
    if (!selectedBibleId) {
      return;
    }
    loadBooks(selectedBibleId);
    setSearchResults([]);
    setSearchError(null);
  }, [loadBooks, selectedBibleId]);

  const sections = useMemo(() => buildBookSections(books, testament, t), [books, testament, t]);

  const bookMap = useMemo(() => {
    const map = new Map<string, BibleBook>();
    books.forEach((book) => {
      map.set(book.id, book);
      map.set(normalizeId(book.id), book);
    });
    return map;
  }, [books]);

  const handleSelectBible = useCallback(
    (bibleId: string) => {
      setHasManualTranslation(true);
      setSelectedBibleId(bibleId);
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    if (!selectedBibleId) {
      return;
    }
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const results = await searchBible(trimmed, selectedBibleId);
      setSearchResults(results);
      setSearchError(results.length === 0 ? t('bible.searchNoResults') : null);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : String(error));
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, selectedBibleId, t]);

  const handleBookPress = useCallback(
    (book: BibleBook) => {
      if (!selectedBibleId) {
        return;
      }
      navigation.navigate('ChapterList', {
        bibleId: selectedBibleId,
        bibleName: selectedBible?.name ?? '',
        translationLanguage: selectedBible?.language,
        bookId: book.id,
        bookName: book.nameLong ?? book.name,
      });
    },
    [navigation, selectedBible, selectedBibleId],
  );

  const handleSearchResultPress = useCallback(
    (result: BibleSearchResult) => {
      if (!selectedBibleId) {
        return;
      }
      const book = bookMap.get(result.bookId) ?? bookMap.get(normalizeId(result.bookId));
      const chapterNumber = result.chapterId.split('.').pop() ?? '';
      navigation.navigate('Chapter', {
        bibleId: selectedBibleId,
        bibleName: selectedBible?.name ?? '',
        translationLanguage: selectedBible?.language,
        bookId: result.bookId,
        bookName: book?.nameLong ?? book?.name ?? result.reference.split(':')[0] ?? result.bookId,
        chapterId: result.chapterId,
        chapterNumber,
        chapterReference: result.reference,
        initialVerseId: result.verseId ?? result.id,
      });
    },
    [bookMap, navigation, selectedBible, selectedBibleId],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<BibleBook> }) => (
      <Text
        style={{
          ...styles.sectionHeader,
          color: palette.textSecondary,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {section.title}
      </Text>
    ),
    [isRTL, palette.textSecondary],
  );

  const renderBookItem = useCallback(
    ({ item }: SectionListRenderItemInfo<BibleBook>) => (
      <Pressable
        onPress={() => handleBookPress(item)}
        style={({ pressed }) => ({
          ...styles.bookItem,
          borderColor: pressed ? palette.primary : palette.divider,
          backgroundColor: palette.surface,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        })}
      >
        <Text
          style={{
            ...styles.bookTitle,
            color: palette.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {item.nameLong ?? item.name}
        </Text>
        <MaterialCommunityIcons
          name={isRTL ? 'chevron-left' : 'chevron-right'}
          size={20}
          color={palette.textSecondary}
        />
      </Pressable>
    ),
    [handleBookPress, isRTL, palette.divider, palette.primary, palette.surface, palette.textPrimary, palette.textSecondary],
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderBookItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={{ paddingBottom: 24 }}>
            <Text
              style={{
                ...styles.sectionLabel,
                color: palette.textSecondary,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {t('bible.translationTitle')}
            </Text>
            <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {loadingBibles ? (
                <ActivityIndicator color={palette.primary} />
              ) : bibles.length === 0 ? (
                <Text style={{ color: palette.textSecondary, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  {bibleError ?? t('bible.noTranslations')}
                </Text>
              ) : (
                bibles.map((bible) => {
                  const active = bible.id === selectedBibleId;
                  return (
                    <Pressable key={bible.id} onPress={() => handleSelectBible(bible.id)}>
                      <View
                        style={{
                          ...styles.chip,
                          borderColor: active ? palette.primary : palette.divider,
                          backgroundColor: active ? `${palette.primary}22` : palette.background,
                        }}
                      >
                        <Text
                          style={{
                            ...styles.chipLabel,
                            color: active ? palette.primary : palette.textPrimary,
                            textAlign: isRTL ? 'right' : 'left',
                          }}
                        >
                          {bible.name}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
            <View
              style={{
                ...styles.segmentedControl,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                borderColor: palette.divider,
              }}
            >
              {(['old', 'new'] as TestamentKey[]).map((key) => {
                const active = testament === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.segmentedItem, active && { backgroundColor: `${palette.primary}22` }]}
                    onPress={() => setTestament(key)}
                  >
                    <Text
                      style={{
                        ...styles.segmentedLabel,
                        color: active ? palette.primary : palette.textPrimary,
                      }}
                    >
                      {t(`bible.testaments.${key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.searchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('bible.searchPlaceholder')}
                placeholderTextColor={palette.textSecondary}
                style={{
                  ...styles.searchInput,
                  borderColor: palette.divider,
                  color: palette.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <Pressable
                onPress={handleSearch}
                style={({ pressed }) => ({
                  ...styles.searchButton,
                  borderColor: pressed ? palette.primary : palette.divider,
                  backgroundColor: palette.surface,
                })}
              >
                {searchLoading ? (
                  <ActivityIndicator size="small" color={palette.primary} />
                ) : (
                  <MaterialCommunityIcons name="magnify" size={22} color={palette.textPrimary} />
                )}
              </Pressable>
            </View>
            {searchError ? (
              <View style={[styles.infoCard, { borderColor: palette.divider, backgroundColor: palette.surface }]}>
                <Text style={{ color: palette.accent, textAlign: isRTL ? 'right' : 'left' }}>{searchError}</Text>
              </View>
            ) : null}
            {searchResults.length > 0 ? (
              <View style={styles.searchResultsContainer}>
                <Text
                  style={{
                    ...styles.sectionLabel,
                    color: palette.textSecondary,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {t('bible.searchResultsTitle', { count: searchResults.length })}
                </Text>
                {searchResults.map((result) => (
                  <Pressable
                    key={result.id}
                    onPress={() => handleSearchResultPress(result)}
                    style={({ pressed }) => ({
                      ...styles.searchResult,
                      borderColor: pressed ? palette.primary : palette.divider,
                      backgroundColor: palette.surface,
                    })}
                  >
                    <Text
                      style={{
                        ...styles.searchReference,
                        color: palette.accent,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {result.reference}
                    </Text>
                    <Text
                      style={{
                        ...styles.searchText,
                        color: palette.textPrimary,
                        textAlign: isRTL ? 'right' : 'left',
                      }}
                    >
                      {result.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            {loadingBooks ? (
              <ActivityIndicator color={palette.primary} />
            ) : booksError ? (
              <View style={[styles.infoCard, { borderColor: palette.divider, backgroundColor: palette.surface }]}>
                <Text style={{ color: palette.accent, textAlign: 'center' }}>{booksError}</Text>
                <Pressable
                  onPress={() => {
                    if (selectedBibleId) {
                      loadBooks(selectedBibleId);
                    }
                  }}
                  style={({ pressed }) => ({
                    ...styles.retryButton,
                    borderColor: palette.primary,
                    backgroundColor: pressed ? `${palette.primary}33` : `${palette.primary}22`,
                  })}
                >
                  <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={{ color: palette.textSecondary, textAlign: 'center' }}>{t('bible.emptyBooks')}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
};
const ChapterListScreen: React.FC<NativeStackScreenProps<BibleStackParamList, 'ChapterList'>> = ({ route, navigation }) => {
  const { bibleId, bibleName, translationLanguage, bookId, bookName } = route.params;
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const { resolvedTheme, isRTL } = useLanguage();

  const palette = config.theme[resolvedTheme];

  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: bookName });
  }, [bookName, navigation]);

  const loadChapters = useCallback(() => {
    setLoading(true);
    setError(null);
    getChapters(bookId, bibleId)
      .then((data) => {
        setChapters(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bibleId, bookId]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  const handlePressChapter = useCallback(
    (chapter: BibleChapter) => {
      navigation.navigate('Chapter', {
        bibleId,
        bibleName,
        translationLanguage,
        bookId,
        bookName,
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        chapterReference: chapter.reference,
      });
    },
    [bibleId, bibleName, bookId, bookName, navigation, translationLanguage],
  );

  const renderChapter: ListRenderItem<BibleChapter> = useCallback(
    ({ item }) => (
      <Pressable
        onPress={() => handlePressChapter(item)}
        style={({ pressed }) => ({
          ...styles.chapterItem,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          borderColor: pressed ? palette.primary : palette.divider,
          backgroundColor: palette.surface,
        })}
      >
        <Text
          style={{
            ...styles.chapterLabel,
            color: palette.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {t('bible.chapterNumber', { number: item.number })}
        </Text>
        <MaterialCommunityIcons
          name={isRTL ? 'chevron-left' : 'chevron-right'}
          size={20}
          color={palette.textSecondary}
        />
      </Pressable>
    ),
    [handlePressChapter, isRTL, palette.divider, palette.primary, palette.surface, palette.textPrimary, palette.textSecondary, t],
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={{ color: palette.accent, textAlign: 'center' }}>{error}</Text>
          <Pressable
            onPress={loadChapters}
            style={({ pressed }) => ({
              ...styles.retryButton,
              borderColor: palette.primary,
              backgroundColor: pressed ? `${palette.primary}33` : `${palette.primary}22`,
            })}
          >
            <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          renderItem={renderChapter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={(
            <Text
              style={{
                ...styles.sectionLabel,
                color: palette.textSecondary,
                textAlign: isRTL ? 'right' : 'left',
                marginBottom: 12,
              }}
            >
              {t('bible.chaptersTitle')}
            </Text>
          )}
        />
      )}
    </View>
  );
};

const ChapterScreen: React.FC<NativeStackScreenProps<BibleStackParamList, 'Chapter'>> = ({ route, navigation }) => {
  const { bibleId, bibleName, translationLanguage, bookId, bookName, chapterId, chapterNumber, chapterReference, initialVerseId } =
    route.params;
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const { resolvedTheme, isRTL } = useLanguage();

  const palette = config.theme[resolvedTheme];

  const [chapter, setChapter] = useState<BibleChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingOffline, setUsingOffline] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    navigation.setOptions({ title: `${bookName} ${chapterNumber}` });
  }, [bookName, chapterNumber, navigation]);

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          setBookmarks(new Set(parsed));
        }
      })
      .catch((err) => console.warn('Failed to load bible bookmarks', err));
  }, []);

  const persistBookmarks = useCallback((value: Set<string>) => {
    AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(value))).catch((err) =>
      console.warn('Failed to persist bible bookmarks', err),
    );
  }, []);

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingOffline(false);
    try {
      const data = await getChapterContent(chapterId, bibleId);
      setChapter(data);
      setUsingOffline(false);
      const cache: LastChapterCache = {
        bibleId,
        chapterId: data.id,
        bookId: data.bookId,
        bookName,
        chapterNumber: data.number,
        chapterReference: data.reference,
        verses: data.verses,
        bibleName,
        translationLanguage,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(LAST_CHAPTER_KEY, JSON.stringify(cache));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      try {
        const cachedRaw = await AsyncStorage.getItem(LAST_CHAPTER_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as LastChapterCache;
          if (cached.bibleId === bibleId && cached.chapterId === chapterId) {
            setChapter({
              id: cached.chapterId,
              bookId: cached.bookId,
              number: cached.chapterNumber,
              reference: cached.chapterReference,
              verses: cached.verses,
            });
            setUsingOffline(true);
            setError(null);
            setLoading(false);
            return;
          }
        }
      } catch (cacheError) {
        console.warn('Failed to restore cached chapter', cacheError);
      }
      setChapter(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [bibleId, bibleName, bookName, chapterId, translationLanguage]);

  useEffect(() => {
    loadChapter();
  }, [loadChapter]);

  const isBookmarked = useCallback((verse: BibleVerse) => bookmarks.has(`${bibleId}:${verse.id}`), [bibleId, bookmarks]);

  const toggleBookmark = useCallback(
    (verse: BibleVerse) => {
      setBookmarks((current) => {
        const next = new Set(current);
        const key = `${bibleId}:${verse.id}`;
        if (next.has(key)) {
          next.delete(key);
          showToast(t('bible.toastBookmarkRemoved'));
        } else {
          next.add(key);
          showToast(t('bible.toastBookmarkAdded'));
        }
        persistBookmarks(next);
        return next;
      });
    },
    [bibleId, persistBookmarks, t],
  );

  const copyVerse = useCallback(
    async (verse: BibleVerse) => {
      try {
        await Clipboard.setStringAsync(`${verse.reference} — ${verse.text}`);
        showToast(t('bible.toastCopied'));
      } catch (err) {
        console.warn('Failed to copy verse', err);
      }
    },
    [t],
  );

  const shareVerse = useCallback(async (verse: BibleVerse) => {
    try {
      await Share.share({ message: `${verse.reference}\n${verse.text}` });
    } catch (err) {
      console.warn('Failed to share verse', err);
    }
  }, []);

  const renderVerse: ListRenderItem<BibleVerse> = useCallback(
    ({ item }) => {
      const isHighlighted = initialVerseId ? item.id === initialVerseId : false;
      return (
        <View
          style={{
            ...styles.verseCard,
            backgroundColor: isHighlighted ? `${palette.primary}22` : palette.surface,
            borderColor: isHighlighted ? palette.primary : palette.divider,
          }}
        >
          <View
            style={{
              ...styles.verseHeader,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            }}
          >
          <Text
            style={{
              ...styles.verseReference,
              color: palette.accent,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {item.reference}
          </Text>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => toggleBookmark(item)}
              style={({ pressed }) => ({
                ...styles.actionButton,
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
                backgroundColor: isBookmarked(item) ? `${palette.accent}22` : palette.background,
                borderColor: pressed || isBookmarked(item) ? palette.accent : palette.divider,
              })}
            >
              <MaterialCommunityIcons
                name={isBookmarked(item) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked(item) ? palette.accent : palette.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => copyVerse(item)}
              style={({ pressed }) => ({
                ...styles.actionButton,
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
                backgroundColor: palette.background,
                borderColor: pressed ? palette.primary : palette.divider,
              })}
            >
              <MaterialCommunityIcons name="content-copy" size={18} color={palette.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => shareVerse(item)}
              style={({ pressed }) => ({
                ...styles.actionButton,
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
                backgroundColor: palette.background,
                borderColor: pressed ? palette.primary : palette.divider,
              })}
            >
              <MaterialCommunityIcons name="share-variant" size={18} color={palette.textSecondary} />
            </Pressable>
          </View>
        </View>
        <Text
          style={{
            ...styles.verseText,
            color: palette.textPrimary,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {item.text.trim()}
        </Text>
        </View>
      );
    },
    [copyVerse, initialVerseId, isBookmarked, isRTL, palette.accent, palette.background, palette.divider, palette.primary, palette.surface, palette.textPrimary, palette.textSecondary, shareVerse, toggleBookmark],
  );

  const listHeader = useMemo(() => {
    if (!chapter && !usingOffline) {
      return null;
    }
    return (
      <View style={{ paddingBottom: 16 }}>
        {usingOffline ? (
          <View
            style={{
              ...styles.offlineBanner,
              backgroundColor: `${palette.accent}22`,
              borderColor: palette.accent,
            }}
          >
            <Text style={{ color: palette.accent, textAlign: isRTL ? 'right' : 'left' }}>{t('bible.offlineNotice')}</Text>
          </View>
        ) : null}
        <Text
          style={{
            ...styles.chapterReference,
            color: palette.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {chapter?.reference ?? chapterReference}
        </Text>
        {bibleName ? (
          <Text
            style={{
              ...styles.translationLabel,
              color: palette.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {translationLanguage ? `${bibleName} · ${translationLanguage.toUpperCase()}` : bibleName}
          </Text>
        ) : null}
      </View>
    );
  }, [bibleName, chapter, chapterReference, isRTL, palette.accent, palette.textSecondary, t, translationLanguage, usingOffline]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={palette.primary} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={{ color: palette.accent, textAlign: 'center' }}>{error}</Text>
          <Pressable
            onPress={loadChapter}
            style={({ pressed }) => ({
              ...styles.retryButton,
              borderColor: palette.primary,
              backgroundColor: pressed ? `${palette.primary}33` : `${palette.primary}22`,
            })}
          >
            <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      );
    }
    if (chapter && chapter.verses.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={{ color: palette.textSecondary, textAlign: 'center' }}>{t('bible.emptyVerses')}</Text>
        </View>
      );
    }
    return null;
  }, [chapter, error, loadChapter, loading, palette.accent, palette.primary, palette.textSecondary, t]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {chapter ? (
        <FlatList
          data={chapter.verses}
          keyExtractor={(item) => item.id}
          renderItem={renderVerse}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
        />
      ) : (
        listEmpty
      )}
    </View>
  );
};

const BibleScreen = () => {
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const { resolvedTheme } = useLanguage();

  const palette = config.theme[resolvedTheme];

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerTintColor: palette.textPrimary,
        headerStyle: { backgroundColor: palette.surface },
        headerShadowVisible: config.navigation.headers.style === 'elevated',
      }}
    >
      <Stack.Screen
        name="Home"
        component={BibleHomeScreen}
        options={{ title: t('menu.bible') }}
      />
      <Stack.Screen name="ChapterList" component={ChapterListScreen} options={{ headerBackTitleVisible: false }} />
      <Stack.Screen name="Chapter" component={ChapterScreen} options={{ headerBackTitleVisible: false }} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipRow: {
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedControl: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  segmentedItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchRow: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    width: 48,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  searchResultsContainer: {
    gap: 12,
  },
  searchResult: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  searchReference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  searchText: {
    fontSize: 16,
    lineHeight: 22,
  },
  bookItem: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chapterItem: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chapterLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  offlineBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  chapterReference: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  translationLabel: {
    fontSize: 14,
  },
  verseCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  verseReference: {
    fontSize: 15,
    fontWeight: '700',
  },
  verseText: {
    fontSize: 17,
    lineHeight: 26,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default BibleScreen;
