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
import { ordersService, Order } from '../../../services/orders';
import QRCode from '../../../components/ui/QRCode';

const ORDER_STATUSES = [
  { key: 'placed', label: 'Order Placed', icon: 'checkmark-circle', color: '#007bff' },
  { key: 'accepted', label: 'Order Accepted', icon: 'checkmark-circle', color: '#28a745' },
  { key: 'preparing', label: 'Preparing', icon: 'restaurant', color: '#ffc107' },
  { key: 'ready', label: 'Ready for Pickup', icon: 'bag-check', color: '#17a2b8' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle', color: '#28a745' },
];

export default function OrderStatusScreen() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  useEffect(() => {
    if (orderId) {
      fetchOrderStatus();
      // Start polling for status updates
      const interval = setInterval(fetchOrderStatus, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrderStatus = async () => {
    if (!orderId) return;

    try {
      setPolling(true);
      const orderData = await ordersService.getOrder(orderId as string);
      setOrder(orderData);
    } catch (error: any) {
      console.error('Failed to fetch order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please refresh.');
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  const getCurrentStatusIndex = (status: string) => {
    return ORDER_STATUSES.findIndex(s => s.key === status);
  };

  const canCancelOrder = (status: string) => {
    return ['placed', 'accepted'].includes(status);
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersService.cancelOrder(orderId as string);
              fetchOrderStatus(); // Refresh status
              Alert.alert('Success', 'Order cancelled successfully.');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleOrderAgain = () => {
    router.replace('/(tabs)/food/vendors');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading order status...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleGoHome}>
          <Text style={styles.retryButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex(order.status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Status</Text>
        {polling && <ActivityIndicator size="small" color="#007bff" />}
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{order.id.slice(-8)}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.vendorInfo}>
          <Ionicons name="storefront-outline" size={20} color="#666" />
          <Text style={styles.vendorName}>{order.vendor_name}</Text>
        </View>
      </View>

      {/* Status Timeline */}
      <View style={styles.timelineContainer}>
        {ORDER_STATUSES.map((status, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          return (
            <View key={status.key} style={styles.timelineItem}>
              <View style={styles.timelineLine}>
                {index > 0 && (
                  <View
                    style={[
                      styles.timelineConnector,
                      isCompleted && styles.completedConnector
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted && styles.completedDot,
                    isCurrent && styles.currentDot
                  ]}
                >
                  <Ionicons
                    name={status.icon as any}
                    size={16}
                    color={isCompleted ? '#fff' : '#ccc'}
                  />
                </View>
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.statusLabel,
                    isCompleted && styles.completedLabel,
                    isCurrent && styles.currentLabel
                  ]}
                >
                  {status.label}
                </Text>
                {isCurrent && (
                  <Text style={styles.statusDescription}>
                    {order.status === 'ready' && 'Your order is ready for pickup!'}
                    {order.status === 'preparing' && 'Your order is being prepared.'}
                    {order.status === 'accepted' && 'Your order has been accepted.'}
                    {order.status === 'placed' && 'Your order has been placed successfully.'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Order Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Order Details</Text>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Pickup Time</Text>
              <Text style={styles.detailValue}>{order.slot_time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={20} color="#666" />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Payment</Text>
              <Text style={styles.detailValue}>
                {order.payment_status === 'paid' ? 'Paid' : 'Cash on Pickup'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>Items Ordered</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                Qty: {item.quantity} × ₹{item.price}
              </Text>
              <Text style={styles.itemTotal}>₹{item.quantity * item.price}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{order.amount}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {canCancelOrder(order.status) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
          >
            <Ionicons name="close-circle-outline" size={20} color="#dc3545" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {order.status === 'completed' && (
          <TouchableOpacity
            style={styles.orderAgainButton}
            onPress={handleOrderAgain}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.orderAgainText}>Order Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
        >
          <Ionicons name="home-outline" size={20} color="#007bff" />
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  orderInfo: {
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  timelineContainer: {
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLine: {
    alignItems: 'center',
    width: 40,
  },
  timelineConnector: {
    width: 2,
    height: 40,
    backgroundColor: '#e9ecef',
    position: 'absolute',
    top: -20,
  },
  completedConnector: {
    backgroundColor: '#007bff',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDot: {
    backgroundColor: '#007bff',
  },
  currentDot: {
    backgroundColor: '#28a745',
    transform: [{ scale: 1.1 }],
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  completedLabel: {
    color: '#333',
  },
  currentLabel: {
    color: '#28a745',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007bff',
  },
  actionsContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderAgainButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  homeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
