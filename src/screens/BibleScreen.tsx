import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  BibleBook,
  BibleChapter,
  BibleSearchResult,
  BibleVerse,
  DEFAULT_BIBLE_IDS,
  getBooks,
  getChapters,
  getVerses,
  search as searchBible,
} from '../api/bible';
import { useAppConfig } from '../context/AppConfigContext';
import { useLanguage } from '../context/LanguageContext';
import { useSearch } from '../context/SearchContext';
import { showToast } from '../utils/toast';

const BOOKMARKS_KEY = 'digital-kholagy:bible:bookmarks';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchResults: {
    marginTop: 12,
    gap: 8,
  },
  searchResultCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  verseCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
});

type BibleLanguage = keyof typeof DEFAULT_BIBLE_IDS;

const translationFallbackLabels: Record<BibleLanguage, string> = {
  en: 'KJV',
  ar: 'SVD',
  ru: 'Synodal',
};

const BibleScreen: React.FC = () => {
  const { t } = useTranslation();
  const { textLang, resolvedTheme, isRTL } = useLanguage();
  const { config } = useAppConfig();
  const { setDomainResults, clearDomain } = useSearch();

  const palette = config.theme[resolvedTheme];
  const translations = useMemo(() => Object.keys(DEFAULT_BIBLE_IDS) as BibleLanguage[], []);
  const initialTranslation = translations.includes(textLang as BibleLanguage) ? (textLang as BibleLanguage) : 'en';

  const [translation, setTranslation] = useState<BibleLanguage>(initialTranslation);

  useEffect(() => {
    const candidate = textLang as BibleLanguage;
    const nextTranslation = translations.includes(candidate) ? candidate : 'en';
    if (nextTranslation !== translation) {
      setTranslation(nextTranslation);
    }
  }, [textLang, translation, translations]);
  const bibleId = DEFAULT_BIBLE_IDS[translation];

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [verses, setVerses] = useState<BibleVerse[]>([]);

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingVerses, setLoadingVerses] = useState(false);

  const [booksError, setBooksError] = useState<string | null>(null);
  const [chaptersError, setChaptersError] = useState<string | null>(null);
  const [versesError, setVersesError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const activeBookRef = useRef<string | null>(null);
  const activeChapterRef = useRef<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          setBookmarks(new Set(parsed));
        }
      })
      .catch((error) => console.warn('Failed to load bible bookmarks', error));
  }, []);

  const persistBookmarks = useCallback((next: Set<string>) => {
    AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(next))).catch((error) =>
      console.warn('Failed to persist bible bookmarks', error),
    );
  }, []);

  const loadVerses = useCallback(
    async (chapterId: string) => {
      activeChapterRef.current = chapterId;
      setLoadingVerses(true);
      setVersesError(null);
      try {
        const data = await getVerses(chapterId, bibleId, translation);
        if (activeChapterRef.current === chapterId) {
          setVerses(data);
        }
      } catch (error) {
        if (activeChapterRef.current === chapterId) {
          setVerses([]);
          setVersesError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (activeChapterRef.current === chapterId) {
          setLoadingVerses(false);
        }
      }
    },
    [bibleId, translation],
  );

  const loadChapters = useCallback(
    async (bookId: string) => {
      activeBookRef.current = bookId;
      setLoadingChapters(true);
      setChaptersError(null);
      try {
        const data = await getChapters(bookId, bibleId, translation);
        if (activeBookRef.current !== bookId) {
          return;
        }
        setChapters(data);
        if (data.length > 0) {
          const firstChapter = data[0].id;
          setSelectedChapterId(firstChapter);
          await loadVerses(firstChapter);
        } else {
          setSelectedChapterId(null);
          setVerses([]);
        }
      } catch (error) {
        if (activeBookRef.current === bookId) {
          setChapters([]);
          setSelectedChapterId(null);
          setVerses([]);
          setChaptersError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (activeBookRef.current === bookId) {
          setLoadingChapters(false);
        }
      }
    },
    [bibleId, loadVerses, translation],
  );

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true);
    setBooksError(null);
    try {
      const data = await getBooks(bibleId, translation);
      setBooks(data);
      if (data.length > 0) {
        const firstBook = data[0].id;
        setSelectedBookId(firstBook);
        await loadChapters(firstBook);
      } else {
        setSelectedBookId(null);
        setChapters([]);
        setSelectedChapterId(null);
        setVerses([]);
      }
    } catch (error) {
      setBooks([]);
      setSelectedBookId(null);
      setChapters([]);
      setSelectedChapterId(null);
      setVerses([]);
      setBooksError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingBooks(false);
    }
  }, [bibleId, loadChapters, translation]);

  useEffect(() => {
    setSelectedBookId(null);
    setSelectedChapterId(null);
    setBooks([]);
    setChapters([]);
    setVerses([]);
    activeBookRef.current = null;
    activeChapterRef.current = null;
    setSearchResults([]);
    setSearchError(null);
    setSearchQuery('');
    clearDomain('bible');
    void loadBooks();
  }, [clearDomain, loadBooks, translation]);

  const selectedBook = useMemo(() => books.find((book) => book.id === selectedBookId) ?? null, [books, selectedBookId]);
  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === selectedChapterId) ?? null,
    [chapters, selectedChapterId],
  );

  const isBookmarked = useCallback((verse: BibleVerse) => bookmarks.has(`${bibleId}:${verse.id}`), [bibleId, bookmarks]);

  const toggleBookmark = useCallback(
    (verse: BibleVerse) => {
      const key = `${bibleId}:${verse.id}`;
      setBookmarks((current) => {
        const next = new Set(current);
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
      } catch (error) {
        console.warn('Failed to copy verse', error);
      }
    },
    [t],
  );

  const shareVerse = useCallback(async (verse: BibleVerse) => {
    try {
      await Share.share({ message: `${verse.reference}\n${verse.text}` });
    } catch (error) {
      console.warn('Failed to share verse', error);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchError(null);
      clearDomain('bible');
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const results = await searchBible(trimmed, bibleId, translation);
      setSearchResults(results);
      setDomainResults('bible', { query: trimmed, results });
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : String(error));
    } finally {
      setSearchLoading(false);
    }
  }, [bibleId, clearDomain, searchQuery, setDomainResults, translation]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      clearDomain('bible');
    }
  }, [clearDomain, searchQuery]);
  useEffect(() => {
    return () => {
      clearDomain('bible');
    };
  }, [clearDomain]);

  const jumpToSearchResult = useCallback(
    (result: BibleSearchResult) => {
      if (selectedBookId !== result.bookId) {
        setSelectedBookId(result.bookId);
        void loadChapters(result.bookId).then(() => {
          setSelectedChapterId(result.chapterId);
          void loadVerses(result.chapterId);
        });
      } else {
        setSelectedChapterId(result.chapterId);
        void loadVerses(result.chapterId);
      }
    },
    [loadChapters, loadVerses, selectedBookId],
  );

  const renderVerse = useCallback(
    ({ item }: { item: BibleVerse }) => (
      <View
        style={{
          ...styles.verseCard,
          backgroundColor: palette.surface,
          borderColor: palette.divider,
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => toggleBookmark(item)}
              style={{
                ...styles.actionButton,
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
                backgroundColor: isBookmarked(item) ? palette.accent + '22' : palette.background,
                borderColor: palette.divider,
              }}
            >
              <MaterialCommunityIcons
                name={isBookmarked(item) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked(item) ? palette.accent : palette.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => copyVerse(item)}
              style={{
                ...styles.actionButton,
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
                backgroundColor: palette.background,
                borderColor: palette.divider,
              }}
            >
              <MaterialCommunityIcons name="content-copy" size={18} color={palette.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => shareVerse(item)}
              style={{
                ...styles.actionButton,
                marginLeft: isRTL ? 0 : 8,
                marginRight: isRTL ? 8 : 0,
                backgroundColor: palette.background,
                borderColor: palette.divider,
              }}
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
    ),
    [copyVerse, isBookmarked, isRTL, palette, shareVerse, toggleBookmark],
  );

  const listEmpty = useMemo(() => {
    if (loadingVerses) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={palette.primary} />
        </View>
      );
    }
    if (versesError) {
      return (
        <View style={[styles.emptyState, { backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.divider }]}>
          <Text style={{ color: palette.accent, textAlign: 'center' }}>{versesError}</Text>
          {selectedChapterId ? (
            <Pressable
              onPress={() => {
                void loadVerses(selectedChapterId);
              }}
              style={{
                ...styles.retryButton,
                borderColor: palette.primary,
                backgroundColor: palette.primary + '22',
              }}
            >
              <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: palette.textSecondary, textAlign: 'center' }}>{t('bible.emptyVerses')}</Text>
      </View>
    );
  }, [loadingVerses, palette, selectedChapterId, t, versesError, loadVerses]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <FlatList
        data={verses}
        keyExtractor={(item) => item.id}
        renderItem={renderVerse}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={{ ...styles.content, paddingTop: 16 }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View style={styles.searchRow}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  void handleSearch();
                }}
                placeholder={t('bible.searchPlaceholder')}
                placeholderTextColor={palette.textSecondary}
                style={{
                  ...styles.searchInput,
                  borderColor: palette.divider,
                  backgroundColor: palette.surface,
                  color: palette.textPrimary,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              />
              <Pressable
                onPress={() => {
                  void handleSearch();
                }}
                style={{
                  ...styles.searchButton,
                  borderColor: palette.primary,
                  backgroundColor: palette.primary + '22',
                }}
              >
                {searchLoading ? (
                  <ActivityIndicator color={palette.primary} />
                ) : (
                  <MaterialCommunityIcons name="text-search" size={20} color={palette.primary} />
                )}
              </Pressable>
            </View>
            {searchError ? (
              <Text style={{ color: palette.accent, textAlign: isRTL ? 'right' : 'left' }}>{searchError}</Text>
            ) : null}
            {searchResults.length > 0 ? (
              <View style={{ ...styles.card, backgroundColor: palette.surface, borderColor: palette.divider }}>
                <Text style={{ ...styles.sectionTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                  {t('bible.searchResultsTitle', { count: searchResults.length })}
                </Text>
                <View style={styles.searchResults}>
                  {searchResults.map((result) => (
                    <Pressable
                      key={result.id}
                      onPress={() => jumpToSearchResult(result)}
                      style={({ pressed }) => ({
                        ...styles.searchResultCard,
                        backgroundColor: palette.surface,
                        borderColor: pressed ? palette.primary : palette.divider,
                      })}
                    >
                      <Text style={{ color: palette.accent, fontWeight: '600', marginBottom: 6, textAlign: isRTL ? 'right' : 'left' }}>
                        {result.reference}
                      </Text>
                      <Text style={{ color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>{result.text.trim()}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <View style={{ ...styles.card, backgroundColor: palette.surface, borderColor: palette.divider }}>
              <Text style={{ ...styles.sectionTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {t('bible.translationTitle')}
              </Text>
              <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {translations.map((lang) => {
                  const active = translation === lang;
                  return (
                    <Pressable key={lang} onPress={() => setTranslation(lang)}>
                      <View
                        style={{
                          ...styles.chip,
                          borderColor: active ? palette.primary : palette.divider,
                          backgroundColor: active ? palette.primary + '22' : palette.background,
                        }}
                      >
                        <Text style={{ color: active ? palette.primary : palette.textPrimary }}>
                          {t(`bible.translationLabel.${lang}`, { defaultValue: translationFallbackLabels[lang] })}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={{ ...styles.card, backgroundColor: palette.surface, borderColor: palette.divider }}>
              <Text style={{ ...styles.sectionTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {t('bible.booksTitle')}
              </Text>
              {loadingBooks ? (
                <ActivityIndicator color={palette.primary} />
              ) : booksError ? (
                <View style={{ alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: palette.accent, textAlign: 'center' }}>{booksError}</Text>
                  <Pressable
                    onPress={() => {
                      void loadBooks();
                    }}
                    style={{
                      ...styles.retryButton,
                      borderColor: palette.primary,
                      backgroundColor: palette.primary + '22',
                    }}
                  >
                    <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {books.map((book) => {
                    const active = selectedBookId === book.id;
                    return (
                      <Pressable key={book.id} onPress={() => {
                        setSelectedBookId(book.id);
                        void loadChapters(book.id);
                      }}>
                        <View
                          style={{
                            ...styles.chip,
                            borderColor: active ? palette.primary : palette.divider,
                            backgroundColor: active ? palette.primary + '22' : palette.background,
                          }}
                        >
                          <Text style={{ color: active ? palette.primary : palette.textPrimary }}>
                            {book.nameLong ?? book.name}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
            <View style={{ ...styles.card, backgroundColor: palette.surface, borderColor: palette.divider }}>
              <Text style={{ ...styles.sectionTitle, color: palette.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {t('bible.chaptersTitle')}
              </Text>
              {loadingChapters ? (
                <ActivityIndicator color={palette.primary} />
              ) : chaptersError ? (
                <View style={{ alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: palette.accent, textAlign: 'center' }}>{chaptersError}</Text>
                  {selectedBook ? (
                    <Pressable
                      onPress={() => {
                        void loadChapters(selectedBook.id);
                      }}
                      style={{
                        ...styles.retryButton,
                        borderColor: palette.primary,
                        backgroundColor: palette.primary + '22',
                      }}
                    >
                      <Text style={{ color: palette.primary }}>{t('common.retry')}</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {chapters.map((chapter) => {
                    const active = selectedChapterId === chapter.id;
                    return (
                      <Pressable key={chapter.id} onPress={() => {
                        setSelectedChapterId(chapter.id);
                        void loadVerses(chapter.id);
                      }}>
                        <View
                          style={{
                            ...styles.chip,
                            borderColor: active ? palette.accent : palette.divider,
                            backgroundColor: active ? palette.accent + '22' : palette.background,
                          }}
                        >
                          <Text style={{ color: active ? palette.accent : palette.textPrimary }}>
                            {chapter.reference.split(':')[0] ?? chapter.number}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        }
      />
    </View>
  );
};

export default BibleScreen;
