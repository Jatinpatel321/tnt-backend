import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { vendorsService, Vendor } from '../../../services/vendors';
import { useCartStore } from '../../../store/cartStore';

export default function VendorsScreen() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { clearCart } = useCartStore();

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    // Filter vendors based on search query
    if (searchQuery.trim() === '') {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vendor.description && vendor.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredVendors(filtered);
    }
  }, [searchQuery, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsService.getVendors('food');
      setVendors(data);
      setFilteredVendors(data);
    } catch (error: any) {
      console.error('Failed to fetch vendors:', error);
      Alert.alert('Error', 'Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorPress = (vendor: Vendor) => {
    // Clear cart if switching vendors
    clearCart();
    router.push({
      pathname: '/(tabs)/food/menu',
      params: { vendorId: vendor.id, vendorName: vendor.name }
    });
  };

  const renderVendorCard = (vendor: Vendor) => (
    <TouchableOpacity
      key={vendor.id}
      style={styles.vendorCard}
      onPress={() => handleVendorPress(vendor)}
      disabled={!vendor.is_open}
    >
      <View style={styles.vendorImageContainer}>
        {vendor.logo_url ? (
          <Image source={{ uri: vendor.logo_url }} style={styles.vendorImage} />
        ) : (
          <View style={styles.vendorImagePlaceholder}>
            <Ionicons name="restaurant-outline" size={32} color="#666" />
          </View>
        )}
        <View style={[styles.statusBadge, vendor.is_open ? styles.openBadge : styles.closedBadge]}>
          <Text style={styles.statusText}>
            {vendor.is_open ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      <View style={styles.vendorInfo}>
        <Text style={styles.vendorName}>{vendor.name}</Text>
        {vendor.description && (
          <Text style={styles.vendorDescription} numberOfLines={2}>
            {vendor.description}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#e0e0e0" />
      <Text style={styles.emptyStateText}>No food vendors available</Text>
      <Text style={styles.emptyStateSubtext}>
        Check back later or try refreshing the page
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchVendors}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Vendors</Text>
        <Text style={styles.subtitle}>Order from your favorite campus spots</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        renderSkeletonLoader()
      ) : filteredVendors.length > 0 ? (
        <View style={styles.vendorsList}>
          {filteredVendors.map(renderVendorCard)}
        </View>
      ) : (
        renderEmptyState()
      )}
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
  searchContainer: {
    padding: 20,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  vendorsList: {
    padding: 20,
  },
  vendorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  vendorImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  vendorImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  vendorImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: '#28a745',
  },
  closedBadge: {
    backgroundColor: '#dc3545',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vendorDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skeletonImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    width: '70%',
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
});
