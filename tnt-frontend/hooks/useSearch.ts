import { useState, useEffect, useCallback } from 'react';

interface UseSearchOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  debounceMs?: number;
}

interface UseSearchReturn<T> {
  query: string;
  setQuery: (query: string) => void;
  filteredData: T[];
  isSearching: boolean;
  clearSearch: () => void;
}

export function useSearch<T extends Record<string, any>>({
  data,
  searchKeys,
  debounceMs = 300,
}: UseSearchOptions<T>): UseSearchReturn<T> {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filteredData, setFilteredData] = useState<T[]>(data);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Filter data based on debounced query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setFilteredData(data);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const filtered = data.filter((item) => {
      const searchTerm = debouncedQuery.toLowerCase();
      return searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm);
        }
        if (typeof value === 'number') {
          return value.toString().includes(searchTerm);
        }
        return false;
      });
    });

    setFilteredData(filtered);
    setIsSearching(false);
  }, [debouncedQuery, data, searchKeys]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    filteredData,
    isSearching,
    clearSearch,
  };
}
