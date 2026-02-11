import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Signal } from '../../services/signals';
import { signalsService } from '../../services/signals';
import { SignalBanner } from '../../components/ui/SignalBanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [dismissedSignals, setDismissedSignals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load dismissed signals from storage
  useEffect(() => {
    const loadDismissedSignals = async () => {
      try {
        const dismissed = await AsyncStorage.getItem('dismissed_signals');
        if (dismissed) {
          setDismissedSignals(new Set(JSON.parse(dismissed)));
        }
      } catch (error) {
        console.error('Error loading dismissed signals:', error);
      }
    };
    loadDismissedSignals();
  }, []);

  // Fetch signals on component mount
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await signalsService.getSignals();
        setSignals(response.signals);
      } catch (error) {
        console.error('Error fetching signals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, []);

  // Filter out dismissed signals
  const activeSignals = signals.filter(signal =>
    !dismissedSignals.has(`${signal.type}_${signal.title}`)
  );

  // Handle signal dismiss
  const handleSignalDismiss = async (signal: Signal) => {
    const signalKey = `${signal.type}_${signal.title}`;
    const newDismissed = new Set(dismissedSignals);
    newDismissed.add(signalKey);
    setDismissedSignals(newDismissed);

    try {
      await AsyncStorage.setItem('dismissed_signals', JSON.stringify([...newDismissed]));
    } catch (error) {
      console.error('Error saving dismissed signals:', error);
    }
  };

  // Handle signal action
  const handleSignalAction = (signal: Signal) => {
    switch (signal.action) {
      case 'suggest_alternative_slots':
        router.push('/(tabs)/food/slots');
        break;
      case 'suggest_slot':
        // Navigate to slots with suggested slot highlighted
        router.push({
          pathname: '/(tabs)/food/slots',
          params: { suggestedSlotId: signal.data?.suggested_slot_id }
        });
        break;
      case 'suggest_reorder':
        // Navigate to food menu with item pre-selected
        router.push({
          pathname: '/(tabs)/food/menu',
          params: { preselectItemId: signal.data?.item_id }
        });
        break;
      default:
        break;
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.welcomeText}>Welcome to TNT</Text>
        <Text style={styles.roleText}>
          {role === 'student' ? 'Student Dashboard' :
           role === 'vendor' ? 'Vendor Dashboard' :
           role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
        </Text>
      </View>

      {/* Smart Signals Section */}
      {activeSignals.length > 0 && (
        <View style={styles.signalsSection}>
          {activeSignals.map((signal, index) => (
            <SignalBanner
              key={`${signal.type}_${signal.title}`}
              signal={signal}
              onDismiss={() => handleSignalDismiss(signal)}
              onAction={() => handleSignalAction(signal)}
            />
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/food')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="restaurant" size={28} color="#FF6B6B" />
          </View>
          <Text style={styles.actionTitle}>Order Food</Text>
          <Text style={styles.actionSubtitle}>From campus vendors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/stationery')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E8F4FF' }]}>
            <Ionicons name="document-text" size={28} color="#4A90E2" />
          </View>
          <Text style={styles.actionTitle}>Stationery</Text>
          <Text style={styles.actionSubtitle}>Print, copy & more</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#F0F8E8' }]}>
            <Ionicons name="receipt" size={28} color="#7CB342" />
          </View>
          <Text style={styles.actionTitle}>My Orders</Text>
          <Text style={styles.actionSubtitle}>Track your orders</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No recent activity</Text>
          <Text style={styles.emptyStateSubtext}>Your orders and activities will appear here</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  signalsSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
