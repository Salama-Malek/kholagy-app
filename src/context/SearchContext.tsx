import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { BibleSearchResult } from '../api/bible';
import type { LiturgySearchHit } from '../api/liturgy';

export type CalendarSearchHitType = 'reading' | 'feast' | 'fast';

export interface CalendarSearchHit {
  id: string;
  title: string;
  type: CalendarSearchHitType;
  description?: string;
  metadata?: string;
}

type SearchDomain = 'bible' | 'calendar' | 'liturgy';

type DomainPayloadMap = {
  bible: BibleSearchResult[];
  calendar: CalendarSearchHit[];
  liturgy: LiturgySearchHit[];
};

interface DomainState<T> {
  query: string;
  results: T[];
  updatedAt: number | null;
}

interface SearchContextValue {
  query: string;
  setQuery: (value: string) => void;
  bible: DomainState<BibleSearchResult>;
  calendar: DomainState<CalendarSearchHit>;
  liturgy: DomainState<LiturgySearchHit>;
  setDomainResults: <K extends SearchDomain>(domain: K, payload: { query: string; results: DomainPayloadMap[K] }) => void;
  clearDomain: (domain: SearchDomain) => void;
  clearAll: () => void;
}

const createDefaultDomainState = <T,>(): DomainState<T> => ({ query: '', results: [], updatedAt: null });

const SearchContext = createContext<SearchContextValue>({
  query: '',
  setQuery: () => undefined,
  bible: createDefaultDomainState<BibleSearchResult>(),
  calendar: createDefaultDomainState<CalendarSearchHit>(),
  liturgy: createDefaultDomainState<LiturgySearchHit>(),
  setDomainResults: () => undefined,
  clearDomain: () => undefined,
  clearAll: () => undefined,
});

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [bible, setBible] = useState<DomainState<BibleSearchResult>>(createDefaultDomainState<BibleSearchResult>());
  const [calendar, setCalendar] = useState<DomainState<CalendarSearchHit>>(createDefaultDomainState<CalendarSearchHit>());
  const [liturgy, setLiturgy] = useState<DomainState<LiturgySearchHit>>(createDefaultDomainState<LiturgySearchHit>());

  const setDomainResults = useCallback(
    <K extends SearchDomain>(domain: K, payload: { query: string; results: DomainPayloadMap[K] }) => {
      const updatedAt = Date.now();
      setQuery(payload.query);
      if (domain === 'bible') {
        setBible({ query: payload.query, results: payload.results as BibleSearchResult[], updatedAt });
        return;
      }
      if (domain === 'calendar') {
        setCalendar({ query: payload.query, results: payload.results as CalendarSearchHit[], updatedAt });
        return;
      }
      setLiturgy({ query: payload.query, results: payload.results as LiturgySearchHit[], updatedAt });
    },
    [],
  );

  const clearDomain = useCallback((domain: SearchDomain) => {
    if (domain === 'bible') {
      setBible(createDefaultDomainState<BibleSearchResult>());
      return;
    }
    if (domain === 'calendar') {
      setCalendar(createDefaultDomainState<CalendarSearchHit>());
      return;
    }
    setLiturgy(createDefaultDomainState<LiturgySearchHit>());
  }, []);

  const clearAll = useCallback(() => {
    setQuery('');
    setBible(createDefaultDomainState<BibleSearchResult>());
    setCalendar(createDefaultDomainState<CalendarSearchHit>());
    setLiturgy(createDefaultDomainState<LiturgySearchHit>());
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      bible,
      calendar,
      liturgy,
      setDomainResults,
      clearDomain,
      clearAll,
    }),
    [bible, calendar, clearAll, clearDomain, liturgy, query, setDomainResults],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => useContext(SearchContext);
