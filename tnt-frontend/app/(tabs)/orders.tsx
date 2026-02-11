import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ordersService, Order } from '../../services/orders';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true); // User control for alerts

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const userOrders = await ordersService.getUserOrders();
      setOrders(userOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleReorder = async (orderId: string) => {
    try {
      const result = await ordersService.reorderOrder(orderId);
      Alert.alert(
        'Reorder Successful',
        `Order #${result.order_id} placed successfully!\nETA: ${new Date(result.estimated_ready_at).toLocaleTimeString()}`,
        [{ text: 'OK', onPress: loadOrders }]
      );
    } catch (error) {
      console.error('Reorder failed:', error);
      Alert.alert('Error', 'Failed to reorder. Please try again.');
    }
  };

  const getStatusColor = (status: string, isDelayed?: boolean) => {
    if (isDelayed) return '#dc3545'; // Red for delayed
    switch (status.toLowerCase()) {
      case 'completed': return '#28a745';
      case 'confirmed': return '#007bff';
      case 'pending': return '#ffc107';
      case 'cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatETA = (eta?: string) => {
    if (!eta) return 'Calculating...';
    return new Date(eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.vendorName}>{order.vendor_name}</Text>
          <Text style={styles.orderId}>Order #{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status, order.is_delayed) }]}>
          <Text style={styles.statusText}>
            {order.is_delayed ? 'DELAYED' : order.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.slotTime}>{order.slot_time}</Text>
        <Text style={styles.amount}>₹{order.amount}</Text>
      </View>

      {order.estimated_ready_at && (
        <View style={styles.etaContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={[styles.etaText, order.is_delayed && styles.delayedText]}>
            ETA: {formatETA(order.estimated_ready_at)}
            {order.is_delayed && ` (+${order.delay_minutes}min)`}
          </Text>
        </View>
      )}

      <View style={styles.orderActions}>
        {order.status === 'completed' && (
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => handleReorder(order.id)}
          >
            <Ionicons name="refresh" size={16} color="#007bff" />
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Track your food and stationery orders</Text>
      </View>

      {orders.length > 0 ? (
        <View style={styles.ordersList}>
          {orders.map(renderOrderCard)}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#e0e0e0" />
          <Text style={styles.emptyStateText}>No orders yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Your food orders and stationery jobs will appear here
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Start Ordering</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.orderTypes}>
        <View style={styles.orderTypeCard}>
          <Ionicons name="restaurant-outline" size={32} color="#FF6B6B" />
          <Text style={styles.orderTypeTitle}>Food Orders</Text>
          <Text style={styles.orderTypeCount}>0 active</Text>
        </View>
        <View style={styles.orderTypeCard}>
          <Ionicons name="document-outline" size={32} color="#4A90E2" />
          <Text style={styles.orderTypeTitle}>Stationery Jobs</Text>
          <Text style={styles.orderTypeCount}>0 active</Text>
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
    padding: 20,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  ordersList: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
  },
  slotTime: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  etaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  delayedText: {
    color: '#dc3545',
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reorderButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#666',
    fontSize: 14,
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 20,
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
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orderTypes: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  orderTypeCard: {
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
  orderTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  orderTypeCount: {
    fontSize: 14,
    color: '#666',
  },
});
