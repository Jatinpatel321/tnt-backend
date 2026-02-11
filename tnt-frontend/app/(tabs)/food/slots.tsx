import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vendorsService, Slot } from '../../../services/vendors';
import { useCartStore } from '../../../store/cartStore';

export default function SlotsScreen() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const router = useRouter();
  const { vendorId } = useLocalSearchParams();
  const { selectedSlot, setSlot } = useCartStore();

  useEffect(() => {
    if (vendorId) {
      fetchSlots();
    }
    // Set initial selected slot from cart
    if (selectedSlot) {
      setSelectedSlotId(selectedSlot);
    }
  }, [vendorId, selectedSlot]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await vendorsService.getVendorSlots(vendorId as string);
      setSlots(data);
    } catch (error: any) {
      console.error('Failed to fetch slots:', error);
      Alert.alert('Error', 'Failed to load available slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: Slot) => {
    if (!slot.is_available) return;

    setSelectedSlotId(slot.id);
    setSlot(slot.id, `${slot.start_time} - ${slot.end_time}`);
  };

  const handleContinue = () => {
    if (!selectedSlotId) {
      Alert.alert('Select Slot', 'Please select a pickup slot to continue.');
      return;
    }

    router.push('/(tabs)/food/cart');
  };

  const formatTime = (timeString: string) => {
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSlotStatus = (slot: Slot) => {
    if (!slot.is_available) return 'unavailable';
    if (slot.current_orders >= slot.max_orders) return 'full';
    return 'available';
  };

  // 🆕 Slot Intelligence: Get congestion level
  const getCongestionLevel = (congestionMetric?: number) => {
    if (!congestionMetric) return 'low';
    if (congestionMetric < 0.3) return 'low';
    if (congestionMetric < 0.7) return 'medium';
    return 'high';
  };

  // 🆕 Slot Intelligence: Get recommended slot
  const getRecommendedSlot = () => {
    if (slots.length === 0) return null;

    // Find slot with lowest congestion that's available
    const availableSlots = slots.filter(slot =>
      slot.is_available && slot.current_orders < slot.max_orders
    );

    if (availableSlots.length === 0) return null;

    return availableSlots.reduce((best, current) => {
      const bestCongestion = best.congestion_metric || 0;
      const currentCongestion = current.congestion_metric || 0;
      return currentCongestion < bestCongestion ? current : best;
    });
  };

  const recommendedSlot = getRecommendedSlot();

  const renderSlot = (slot: Slot) => {
    const status = getSlotStatus(slot);
    const isSelected = selectedSlotId === slot.id;
    const isRecommended = recommendedSlot?.id === slot.id;
    const congestionLevel = getCongestionLevel(slot.congestion_metric);

    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.slotCard,
          status === 'unavailable' && styles.unavailableSlot,
          status === 'full' && styles.fullSlot,
          isSelected && styles.selectedSlot,
          isRecommended && !isSelected && styles.recommendedSlot
        ]}
        onPress={() => handleSlotSelect(slot)}
        disabled={status !== 'available'}
      >
        {/* 🆕 Recommended Badge */}
        {isRecommended && !isSelected && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.recommendedBadgeText}>Recommended</Text>
          </View>
        )}

        <View style={styles.slotTime}>
          <Text style={[
            styles.timeText,
            (status !== 'available' || isSelected) && styles.disabledText
          ]}>
            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
          </Text>

          {/* 🆕 Faculty Priority Indicator */}
          {slot.faculty_priority && (
            <View style={styles.facultyBadge}>
              <Ionicons name="school" size={12} color="#fff" />
              <Text style={styles.facultyBadgeText}>Faculty</Text>
            </View>
          )}
        </View>

        <View style={styles.slotInfo}>
          <View style={styles.capacityContainer}>
            <Ionicons
              name="people"
              size={16}
              color={status === 'available' ? '#666' : '#ccc'}
            />
            <Text style={[
              styles.capacityText,
              status !== 'available' && styles.disabledText
            ]}>
              {slot.current_orders}/{slot.max_orders} orders
            </Text>
          </View>

          {/* 🆕 Congestion Indicator */}
          {status === 'available' && (
            <View style={styles.congestionContainer}>
              <View style={[
                styles.congestionDot,
                congestionLevel === 'low' && styles.congestionLow,
                congestionLevel === 'medium' && styles.congestionMedium,
                congestionLevel === 'high' && styles.congestionHigh
              ]} />
              <Text style={styles.congestionText}>
                {congestionLevel === 'low' ? 'Low' :
                 congestionLevel === 'medium' ? 'Medium' : 'High'} congestion
              </Text>
            </View>
          )}

          {status === 'full' && (
            <Text style={styles.fullText}>Slot Full</Text>
          )}
          {status === 'unavailable' && (
            <Text style={styles.unavailableText}>Unavailable</Text>
          )}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#007bff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.skeletonSlot}>
          <View style={styles.skeletonTime} />
          <View style={styles.skeletonInfo} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pickup Slots</Text>
          <Text style={styles.headerSubtitle}>Choose your preferred time</Text>
        </View>
      </View>

      {loading ? (
        renderSkeletonLoader()
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#007bff" />
            <Text style={styles.infoText}>
              Select a pickup slot for your order. Slots fill up quickly, so choose wisely!
            </Text>
          </View>

          <View style={styles.slotsContainer}>
            {slots.length > 0 ? (
              slots.map(renderSlot)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#e0e0e0" />
                <Text style={styles.emptyStateText}>No slots available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Please check back later or contact the vendor
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedSlotId && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedSlotId}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedSlotId && styles.disabledButtonText
          ]}>
            Continue to Cart
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={selectedSlotId ? "#fff" : "#ccc"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#0066cc',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  slotsContainer: {
    gap: 12,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSlot: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  recommendedSlot: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff8',
  },
  unavailableSlot: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  fullSlot: {
    backgroundColor: '#fff5f5',
  },
  slotTime: {
    flex: 1,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  disabledText: {
    color: '#ccc',
  },
  slotInfo: {
    alignItems: 'flex-end',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  capacityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  fullText: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
  },
  unavailableText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledButtonText: {
    color: '#6c757d',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonSlot: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skeletonTime: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonInfo: {
    width: 80,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  // 🆕 Slot Intelligence Styles
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  recommendedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  facultyBadge: {
    backgroundColor: '#6f42c1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  facultyBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
  congestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  congestionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  congestionLow: {
    backgroundColor: '#28a745',
  },
  congestionMedium: {
    backgroundColor: '#ffc107',
  },
  congestionHigh: {
    backgroundColor: '#dc3545',
  },
  congestionText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});
