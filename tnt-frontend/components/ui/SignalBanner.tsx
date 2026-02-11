import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Signal } from '../../services/signals';

interface SignalBannerProps {
  signal: Signal;
  onDismiss: () => void;
  onAction?: () => void;
}

export const SignalBanner: React.FC<SignalBannerProps> = ({
  signal,
  onDismiss,
  onAction,
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  const getIconName = () => {
    switch (signal.type) {
      case 'rush_hour_warning':
        return 'time-outline';
      case 'slot_suggestion':
        return 'calendar-outline';
      case 'reorder_prompt':
        return 'refresh-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getBackgroundColor = () => {
    switch (signal.priority) {
      case 'high':
        return '#fee2e2'; // Light red
      case 'medium':
        return '#fef3c7'; // Light yellow
      case 'low':
        return '#ecfdf5'; // Light green
      default:
        return '#f3f4f6'; // Light gray
    }
  };

  const getTextColor = () => {
    switch (signal.priority) {
      case 'high':
        return '#dc2626'; // Dark red
      case 'medium':
        return '#d97706'; // Dark yellow
      case 'low':
        return '#16a34a'; // Dark green
      default:
        return '#374151'; // Dark gray
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor(), opacity: fadeAnim },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={getIconName()}
          size={20}
          color={getTextColor()}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: getTextColor() }]}>
            {signal.title}
          </Text>
          <Text style={[styles.message, { color: getTextColor() }]}>
            {signal.message}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {signal.action && onAction && (
          <TouchableOpacity style={styles.actionButton} onPress={onAction}>
            <Text style={[styles.actionText, { color: getTextColor() }]}>
              {signal.action === 'suggest_alternative_slots' ? 'View Options' :
               signal.action === 'suggest_slot' ? 'Try It' :
               signal.action === 'suggest_reorder' ? 'Reorder' : 'Action'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Ionicons name="close" size={16} color={getTextColor()} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 8,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
  },
});
