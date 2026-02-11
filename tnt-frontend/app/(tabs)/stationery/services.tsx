import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { vendorsService } from '../../../services/vendors';
import { stationeryService, StationeryService } from '../../../services/stationery';
import { Vendor } from '../../../services/vendors';

export default function StationeryServicesScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<StationeryService[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const vendorsData = await vendorsService.getVendors('stationery');
      setVendors(vendorsData);
    } catch (error) {
      console.error('Error loading vendors:', error);
      Alert.alert('Error', 'Failed to load stationery vendors');
    } finally {
      setLoading(false);
    }
  };

  const loadVendorServices = async (vendor: Vendor) => {
    setServicesLoading(true);
    try {
      const servicesData = await stationeryService.getVendorServices(vendor.id);
      setServices(servicesData);
      setSelectedVendor(vendor);
    } catch (error) {
      console.error('Error loading services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  };

  const selectService = (service: StationeryService) => {
    if (!selectedVendor) return;

    router.push({
      pathname: '/(tabs)/stationery/upload',
      params: {
        vendorId: selectedVendor.id.toString(),
        vendorName: selectedVendor.name,
        serviceId: service.id.toString(),
        serviceName: service.name,
        pricePerUnit: service.price_per_unit.toString(),
        unit: service.unit,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading stationery vendors...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Stationery Services</Text>
        <Text style={styles.subtitle}>Choose a vendor and service for your printing needs</Text>
      </View>

      {/* Vendors Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Vendor</Text>
        <View style={styles.vendorsGrid}>
          {vendors.map((vendor) => (
            <TouchableOpacity
              key={vendor.id}
              style={[
                styles.vendorCard,
                selectedVendor?.id === vendor.id && styles.vendorCardSelected,
              ]}
              onPress={() => loadVendorServices(vendor)}
            >
              <View style={styles.vendorIcon}>
                <Ionicons name="business-outline" size={24} color="#007bff" />
              </View>
              <Text style={styles.vendorName}>{vendor.name}</Text>
              <Text style={styles.vendorDescription}>{vendor.description}</Text>
              {vendor.is_open && (
                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>Open</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Services Section */}
      {selectedVendor && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services by {selectedVendor.name}</Text>

          {servicesLoading ? (
            <View style={styles.servicesLoading}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.servicesLoadingText}>Loading services...</Text>
            </View>
          ) : services.length > 0 ? (
            <View style={styles.servicesGrid}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => selectService(service)}
                >
                  <View style={styles.serviceIcon}>
                    <Ionicons name="document-outline" size={24} color="#28a745" />
                  </View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>
                    ₹{service.price_per_unit} per {service.unit}
                  </Text>
                  <View style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Select</Text>
                    <Ionicons name="chevron-forward" size={16} color="#007bff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No services available</Text>
            </View>
          )}
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#007bff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              Select a vendor and service, upload your PDF, and pay only when your job is ready for pickup.
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  vendorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  vendorCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vendorCardSelected: {
    borderColor: '#007bff',
  },
  vendorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  vendorDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  openBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 8,
  },
  openBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  servicesLoading: {
    alignItems: 'center',
    padding: 20,
  },
  servicesLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 12,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
