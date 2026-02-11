import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService, Vendor, User, Order, LedgerEntry } from '../../services/admin';
import { useAuthStore } from '../../store/authStore';

export default function AdminScreen() {
  const { role } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'vendors' | 'users' | 'orders' | 'ledger'>('vendors');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin
  if (role !== 'admin') {
    return (
      <View style={styles.unauthorized}>
        <Ionicons name="shield-outline" size={64} color="#ccc" />
        <Text style={styles.unauthorizedText}>Access Denied</Text>
        <Text style={styles.unauthorizedSubtext}>Admin privileges required</Text>
      </View>
    );
  }

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      switch (activeTab) {
        case 'vendors':
          const vendorsData = await adminService.getVendors();
          setVendors(vendorsData);
          break;
        case 'users':
          // Note: Backend doesn't have a getAllUsers endpoint yet
          // For now, we'll show a placeholder
          setUsers([]);
          break;
        case 'orders':
          const ordersData = await adminService.getAllOrders();
          setOrders(ordersData);
          break;
        case 'ledger':
          const ledgerData = await adminService.getLedger();
          setLedger(ledgerData);
          break;
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(false);
    setRefreshing(false);
  };

  const handleApproveVendor = async (vendorId: number) => {
    try {
      await adminService.approveVendor(vendorId);
      Alert.alert('Success', 'Vendor approved successfully');
      loadData(false);
    } catch (error) {
      console.error('Error approving vendor:', error);
      Alert.alert('Error', 'Failed to approve vendor');
    }
  };

  const handleToggleUser = async (userId: number) => {
    try {
      const result = await adminService.toggleUser(userId);
      Alert.alert('Success', `User ${result.is_active ? 'activated' : 'deactivated'}`);
      loadData(false);
    } catch (error) {
      console.error('Error toggling user:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const renderVendorsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Vendor Management</Text>
      {vendors.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No vendors found</Text>
        </View>
      ) : (
        vendors.map((vendor) => (
          <View key={vendor.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{vendor.name || 'Unnamed Vendor'}</Text>
                <Text style={styles.cardSubtitle}>{vendor.phone}</Text>
                <Text style={styles.cardMeta}>
                  Joined: {new Date(vendor.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <Text style={[
                  styles.statusText,
                  vendor.is_approved ? styles.approvedStatus : styles.pendingStatus
                ]}>
                  {vendor.is_approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            </View>
            {!vendor.is_approved && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleApproveVendor(vendor.id)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Approve Vendor</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderUsersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>User Management</Text>
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={48} color="#ccc" />
        <Text style={styles.emptyStateText}>User management coming soon</Text>
        <Text style={styles.emptyStateSubtext}>Backend endpoint needs to be implemented</Text>
      </View>
    </View>
  );

  const renderOrdersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>All Orders</Text>
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No orders found</Text>
        </View>
      ) : (
        orders.slice(0, 20).map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Order #{order.id}</Text>
                <Text style={styles.cardSubtitle}>
                  User ID: {order.user_id} | Vendor ID: {order.vendor_id}
                </Text>
                <Text style={styles.cardMeta}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <Text style={[
                  styles.statusText,
                  getOrderStatusStyle(order.status)
                ]}>
                  {order.status}
                </Text>
              </View>
            </View>
            <Text style={styles.amountText}>₹{order.total_amount}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderLedgerTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Transaction Ledger</Text>
      {ledger.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cash-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No ledger entries found</Text>
        </View>
      ) : (
        ledger.slice(0, 20).map((entry) => (
          <View key={entry.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{entry.transaction_type}</Text>
                <Text style={styles.cardSubtitle}>{entry.description}</Text>
                <Text style={styles.cardMeta}>
                  User ID: {entry.user_id} | {new Date(entry.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.amountText,
                entry.amount > 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {entry.amount > 0 ? '+' : ''}₹{entry.amount}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const getOrderStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'ready':
        return styles.completedStatus;
      case 'pending':
      case 'processing':
        return styles.pendingStatus;
      case 'cancelled':
        return styles.cancelledStatus;
      default:
        return styles.defaultStatus;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {[
          { key: 'vendors', label: 'Vendors', icon: 'storefront-outline' },
          { key: 'users', label: 'Users', icon: 'people-outline' },
          { key: 'orders', label: 'Orders', icon: 'receipt-outline' },
          { key: 'ledger', label: 'Ledger', icon: 'cash-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? '#007bff' : '#666'}
            />
            <Text style={[
              styles.tabButtonText,
              activeTab === tab.key && styles.activeTabButtonText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'vendors' && renderVendorsTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'ledger' && renderLedgerTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  unauthorized: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unauthorizedText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabButtonText: {
    color: '#007bff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
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
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'uppercase',
  },
  approvedStatus: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  pendingStatus: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  completedStatus: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  cancelledStatus: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  defaultStatus: {
    backgroundColor: '#e9ecef',
    color: '#495057',
  },
  actionButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  positiveAmount: {
    color: '#28a745',
  },
  negativeAmount: {
    color: '#dc3545',
  },
});
