import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../src/context/LanguageContext';
import { useAppConfig } from '../src/context/AppConfigContext';
import { usePreferences } from '../src/context/PreferencesContext';
import { loadLiturgyDocument, searchLiturgyDocument } from '../src/api/liturgy';
import { useSearch } from '../src/context/SearchContext';
import { showToast } from '../src/utils/toast';
import type { RootStackParamList } from '../navigation/types';
type ReaderRoute = RouteProp<RootStackParamList, 'Reader'>;
type TocEntry = {
  slug: string;
  title: string;
  level: number;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
  },
  tocContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tocTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tocItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  fallback: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 16,
  },
});
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const parseHeadings = (source: string): TocEntry[] => {
  const regex = /^#{1,4}\s.+$/gm;
  const matches = source.match(regex);
  if (!matches) {
    return [];
  }
  return matches.map((line, index) => {
    const level = (line.match(/^#+/)?.[0].length ?? 1) as number;
    const title = line.replace(/^#+\s*/, '').trim();
    const slug = `${index}-${title.toLowerCase().replace(/\s+/g, '-')}`;
    return { slug, title, level };
  });
};
const ReaderScreen: React.FC = () => {
  const route = useRoute<ReaderRoute>();
  const { textLang, fontScale, resolvedTheme, isRTL } = useLanguage();
  const { config } = useAppConfig();
  const { blueBackground } = usePreferences();
  const { setDomainResults, clearDomain } = useSearch();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const bookmarkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headingOffsetsRef = useRef<Record<string, number>>({});
  const headingIndexRef = useRef(0);
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeLanguage, setActiveLanguage] = useState<string>(textLang);
  const [hasDocument, setHasDocument] = useState<boolean>(true);
  const [bookmarkRestored, setBookmarkRestored] = useState<boolean>(false);
  const itemId = route.params.itemId;
  const palette = config.theme[resolvedTheme];
  const baseFontSize = config.theme.typography.baseSize;
  const baseLineHeight = Math.round(baseFontSize * config.theme.typography.lineHeight);
  const readerBackground = blueBackground ? '#0A2740' : palette.background;
  const readerSurface = blueBackground ? '#10335B' : palette.surface;
  const readerTextColor = blueBackground ? '#E6EEFF' : palette.textPrimary;
  const readerMutedColor = blueBackground ? '#B3C4E5' : palette.textSecondary;
  const bookmarkKey = useMemo(() => {
    const lang = activeLanguage || textLang;
    return `digital-kholagy:bookmark:${itemId}:${lang}`;
  }, [activeLanguage, itemId, textLang]);
  useEffect(() => {
    headingOffsetsRef.current = {};
    headingIndexRef.current = 0;
  }, [markdown]);
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const document = await loadLiturgyDocument(itemId, textLang);
        if (!isMounted) {
          return;
        }
        if (!document) {
          setHasDocument(false);
          setMarkdown('');
          return;
        }
        setHasDocument(true);
        setActiveLanguage(document.language ?? textLang);
        setMarkdown(document.markdown);
        const bookmarkLang = document.language ?? textLang;
        const savedOffset = await AsyncStorage.getItem(`digital-kholagy:bookmark:${itemId}:${bookmarkLang}`);
        if (savedOffset) {
          const offsetValue = Number(savedOffset);
          if (!Number.isNaN(offsetValue)) {
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({ y: offsetValue, animated: false });
              setBookmarkRestored(true);
            }, 250);
          }
        } else {
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
          setBookmarkRestored(false);
        }
      } catch (error) {
        console.warn('Failed to load content', error);
        if (isMounted) {
          setHasDocument(false);
          setMarkdown('');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [itemId, textLang]);
  useEffect(() => {
    return () => {
      if (bookmarkTimeout.current) {
        clearTimeout(bookmarkTimeout.current);
      }
    };
  }, []);
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      if (bookmarkTimeout.current) {
        clearTimeout(bookmarkTimeout.current);
      }
      bookmarkTimeout.current = setTimeout(() => {
        AsyncStorage.setItem(bookmarkKey, String(Math.round(offsetY))).catch((error) =>
          console.warn('Failed to store bookmark', error),
        );
      }, 300);
    },
    [bookmarkKey],
  );
  const highlightedMarkdown = useMemo(() => {
    if (!searchTerm.trim()) {
      return markdown;
    }
    const pattern = new RegExp(`(${escapeRegExp(searchTerm.trim())})`, 'gi');
    return markdown.replace(pattern, '**$1**');
  }, [markdown, searchTerm]);
  const toc = useMemo(() => parseHeadings(markdown), [markdown]);
  useEffect(() => {
    if (!searchTerm.trim()) {
      clearDomain('liturgy');
      return;
    }
    const hits = searchLiturgyDocument(markdown, searchTerm.trim()).map((hit) => ({
      ...hit,
      id: `${itemId}:${activeLanguage}:${hit.id}`,
    }));
    setDomainResults('liturgy', { query: searchTerm.trim(), results: hits });
  }, [activeLanguage, clearDomain, itemId, markdown, searchTerm, setDomainResults]);
  useEffect(() => {
    return () => {
      clearDomain('liturgy');
    };
  }, [clearDomain]);
  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(markdown);
      showToast(t('reader.toastCopied'));
    } catch (error) {
      console.warn('Failed to copy text', error);
    }
  }, [markdown, t]);
  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: markdown });
      showToast(t('reader.toastShared'));
    } catch (error) {
      console.warn('Failed to share text', error);
    }
  }, [markdown, t]);
  const handleTocPress = useCallback((slug: string) => {
    const position = headingOffsetsRef.current[slug];
    if (position !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(position - 12, 0), animated: true });
    }
  }, []);
  const renderHeading = useCallback(
    (level: number, props: { key: string; children: React.ReactNode }) => {
      const index = headingIndexRef.current;
      const entry = toc[index];
      const slug = entry?.slug ?? props.key ?? `${index}`;
      headingIndexRef.current += 1;
      const sizeBoost = level === 1 ? 10 : level === 2 ? 6 : 4;
      return (
        <Text
          key={slug}
          onLayout={(event) => {
            headingOffsetsRef.current[slug] = event.nativeEvent.layout.y;
          }}
          style={{
            fontSize: (baseFontSize + sizeBoost) * fontScale,
            color: palette.primary,
            fontWeight: config.theme.typography.headingWeight as any,
            marginTop: level === 1 ? 18 : 14,
            marginBottom: 6,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {props.children}
        </Text>
      );
    },
    [baseFontSize, config.theme.typography.headingWeight, fontScale, isRTL, palette.primary, toc],
  );
  const markdownRules = useMemo(
    () => ({
      heading1: (node: any, children: React.ReactNode) => renderHeading(1, { key: node.key, children }),
      heading2: (node: any, children: React.ReactNode) => renderHeading(2, { key: node.key, children }),
      heading3: (node: any, children: React.ReactNode) => renderHeading(3, { key: node.key, children }),
    }),
    [renderHeading],
  );
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: readerBackground }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }
  if (!hasDocument) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: readerBackground }]}>
        <Text style={[styles.fallback, { color: readerTextColor }]}>
          {t('reader.noContent')}
        </Text>
      </View>
    );
  }
  const isFallback = activeLanguage !== textLang;
  headingIndexRef.current = 0;
  return (
    <View style={[styles.container, { backgroundColor: readerBackground }]}>
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder={t('reader.searchPlaceholder')}
            placeholderTextColor={readerMutedColor}
            style={{
              ...styles.searchInput,
              borderColor: palette.divider,
              color: readerTextColor,
              backgroundColor: readerSurface,
              textAlign: isRTL ? 'right' : 'left',
            }}
          />
          <Pressable
            accessibilityLabel="copy-text"
            onPress={handleCopy}
            style={[styles.actionButton, { borderColor: palette.divider, backgroundColor: readerSurface }]}
          >
            <MaterialCommunityIcons name="content-copy" color={palette.primary} size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="share-text"
            onPress={handleShare}
            style={[styles.actionButton, { borderColor: palette.divider, backgroundColor: readerSurface }]}
          >
            <MaterialCommunityIcons name="share-variant" color={palette.primary} size={20} />
          </Pressable>
        </View>
        {bookmarkRestored ? (
          <Text
            style={{
              ...styles.infoText,
              color: readerMutedColor,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('reader.lastPositionRestored')}
          </Text>
        ) : null}
        {isFallback ? (
          <Text
            style={{
              ...styles.infoText,
              color: palette.accent,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('reader.fallbackNotice')}
          </Text>
        ) : null}
      </View>
      {toc.length > 0 ? (
        <View style={styles.tocContainer}>
          <Text style={{ ...styles.tocTitle, color: readerTextColor, textAlign: isRTL ? 'right' : 'left' }}>
            {t('reader.toc')}
          </Text>
          {toc.map((entry) => (
            <Pressable
              key={entry.slug}
              onPress={() => handleTocPress(entry.slug)}
              style={{
                ...styles.tocItem,
                marginLeft: isRTL ? 0 : entry.level > 1 ? (entry.level - 1) * 12 : 0,
                marginRight: isRTL ? (entry.level > 1 ? (entry.level - 1) * 12 : 0) : 0,
                backgroundColor: readerSurface,
              }}
            >
              <Text style={{ color: readerTextColor, fontSize: 14, textAlign: isRTL ? 'right' : 'left' }}>
                {entry.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        <Markdown
          rules={markdownRules}
          style={{
            body: {
              fontSize: baseFontSize * fontScale,
              lineHeight: baseLineHeight * fontScale,
              color: readerTextColor,
              textAlign: isRTL ? 'right' : 'left',
            },
            text: {
              color: readerTextColor,
            },
            list_item: {
              color: readerTextColor,
            },
            strong: {
              color: palette.primary,
            },
          }}
        >
          {highlightedMarkdown}
        </Markdown>
      </ScrollView>
    </View>
  );
};
export default ReaderScreen;
