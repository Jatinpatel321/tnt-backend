import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterPress?: () => void;
  onSortPress?: () => void;
  debounceMs?: number;
  showFilters?: boolean;
  showSort?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  onSearch,
  onFilterPress,
  onSortPress,
  debounceMs = 300,
  showFilters = true,
  showSort = true,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const animatedWidth = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(animatedWidth, {
      toValue: 0.95,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(animatedWidth, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scaleX: animatedWidth }] }]}>
      <View style={[styles.searchContainer, isFocused && styles.focused]}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionsContainer}>
        {showSort && (
          <TouchableOpacity onPress={onSortPress} style={styles.actionButton}>
            <Ionicons name="swap-vertical" size={20} color="#666" />
          </TouchableOpacity>
        )}
        {showFilters && (
          <TouchableOpacity onPress={onFilterPress} style={styles.actionButton}>
            <Ionicons name="filter" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
