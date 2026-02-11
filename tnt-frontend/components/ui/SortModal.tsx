import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortOption = {
  key: string;
  label: string;
  direction?: 'asc' | 'desc';
};

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sort: SortOption) => void;
  currentSort?: SortOption;
  sortOptions: SortOption[];
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentSort,
  sortOptions,
}) => {
  const handleSelect = (option: SortOption) => {
    onSelect(option);
    onClose();
  };

  const getDirectionIcon = (option: SortOption) => {
    if (currentSort?.key === option.key) {
      return option.direction === 'desc' ? 'chevron-down' : 'chevron-up';
    }
    return 'chevron-forward';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Sort By</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.optionRow,
                currentSort?.key === option.key && styles.optionRowSelected
              ]}
              onPress={() => handleSelect(option)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  currentSort?.key === option.key && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
                {currentSort?.key === option.key && (
                  <Text style={styles.currentSortText}>Current</Text>
                )}
              </View>
              <Ionicons
                name={getDirectionIcon(option)}
                size={20}
                color={currentSort?.key === option.key ? '#007AFF' : '#ccc'}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionRowSelected: {
    backgroundColor: '#f8f9ff',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  currentSortText: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e8f0ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
});
