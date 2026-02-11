import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StationeryScreen() {
  // Placeholder data for stationery services
  const services = [
    {
      id: 1,
      name: 'Printing',
      description: 'Documents, photos, and more',
      icon: 'print-outline',
      color: '#FF6B6B',
      bgColor: '#FFE8E8'
    },
    {
      id: 2,
      name: 'Photocopying',
      description: 'Black & white and color copies',
      icon: 'copy-outline',
      color: '#4A90E2',
      bgColor: '#E8F4FF'
    },
    {
      id: 3,
      name: 'Binding',
      description: 'Spiral, thermal, and saddle stitch',
      icon: 'book-outline',
      color: '#7CB342',
      bgColor: '#F0F8E8'
    },
    {
      id: 4,
      name: 'Lamination',
      description: 'Document protection and finishing',
      icon: 'shield-outline',
      color: '#FF9800',
      bgColor: '#FFF3E0'
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Stationery & Printing</Text>
        <Text style={styles.subtitle}>Professional printing and stationery services</Text>
      </View>

      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <TouchableOpacity key={service.id} style={styles.serviceCard}>
            <View style={[styles.iconContainer, { backgroundColor: service.bgColor }]}>
              <Ionicons name={service.icon as any} size={32} color={service.color} />
            </View>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#007bff" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              Upload your documents, choose your service, and pick up when ready.
              Track your order status in real-time.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={24} color="#28a745" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Quick turnaround</Text>
            <Text style={styles.infoText}>
              Most jobs completed within 24 hours. Express service available for urgent needs.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.ctaSection}>
        <TouchableOpacity style={styles.uploadButton}>
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload Document</Text>
        </TouchableOpacity>
        <Text style={styles.ctaNote}>Supported formats: PDF, DOC, JPG, PNG</Text>
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  serviceCard: {
    width: '47%', // Two cards per row with gap
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
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  ctaSection: {
    padding: 20,
    paddingBottom: 40,
  },
  uploadButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  ctaNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
