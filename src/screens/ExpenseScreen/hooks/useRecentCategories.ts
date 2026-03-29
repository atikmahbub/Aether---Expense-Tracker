import {useCallback, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_CATEGORY_KEY = '@aether/recent-categories';
const MAX_RECENT = 3;

const sanitizeList = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0,
  );
};

const persistList = async (ids: string[]) => {
  try {
    await AsyncStorage.setItem(RECENT_CATEGORY_KEY, JSON.stringify(ids));
  } catch (error) {
    console.log('Failed to persist recent categories', error);
  }
};

export const useRecentCategories = () => {
  const [recentCategoryIds, setRecentCategoryIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const payload = await AsyncStorage.getItem(RECENT_CATEGORY_KEY);
        if (!payload) {
          return;
        }
        const parsed = sanitizeList(JSON.parse(payload));
        if (isMounted && parsed.length) {
          setRecentCategoryIds(parsed.slice(0, MAX_RECENT));
        }
      } catch (error) {
        console.log('Failed to load recent categories', error);
      } finally {
        if (isMounted) {
          setHydrated(true);
        }
      }
    };
    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const recordRecentCategory = useCallback((categoryId: string) => {
    if (!categoryId) {
      return;
    }
    setRecentCategoryIds(prev => {
      const filtered = prev.filter(id => id !== categoryId);
      const next = [categoryId, ...filtered].slice(0, MAX_RECENT);
      persistList(next);
      return next;
    });
  }, []);

  const initializeFromHistory = useCallback((historyIds: string[]) => {
    if (!historyIds?.length) {
      return;
    }
    setRecentCategoryIds(prev => {
      if (prev.length) {
        return prev;
      }
      const unique: string[] = [];
      historyIds.forEach(id => {
        if (id && !unique.includes(id)) {
          unique.push(id);
        }
      });
      const trimmed = unique.slice(0, MAX_RECENT);
      if (trimmed.length) {
        persistList(trimmed);
        return trimmed;
      }
      return prev;
    });
  }, []);

  const lastUsedCategoryId = useMemo(
    () => recentCategoryIds[0] || null,
    [recentCategoryIds],
  );

  return {
    hydrated,
    recentCategoryIds,
    lastUsedCategoryId,
    recordRecentCategory,
    initializeFromHistory,
  } as const;
};
