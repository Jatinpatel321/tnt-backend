import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { stationeryService } from '../../../services/stationery';

interface PrintOptions {
  copies: number;
  color: 'black_white' | 'color';
  sides: 'single' | 'double';
  binding: 'none' | 'spiral' | 'thermal' | 'saddle';
}

export default function JobSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [submitting, setSubmitting] = useState(false);

  const vendorId = parseInt(params.vendorId as string);
  const vendorName = params.vendorName as string;
  const serviceId = parseInt(params.serviceId as string);
  const serviceName = params.serviceName as string;
  const fileUri = params.fileUri as string;
  const fileName = params.fileName as string;
  const fileSize = params.fileSize as string;
  const options: PrintOptions = JSON.parse(params.options as string);
  const estimatedPrice = parseFloat(params.estimatedPrice as string);
  const unit = params.unit as string;

  const formatFileSize = (bytes: string) => {
    const numBytes = parseInt(bytes);
    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getColorLabel = (color: string) => {
    return color === 'color' ? 'Color' : 'Black & White';
  };

  const getSidesLabel = (sides: string) => {
    return sides === 'double' ? 'Double Sided' : 'Single Sided';
  };

  const getBindingLabel = (binding: string) => {
    switch (binding) {
      case 'spiral': return 'Spiral Binding';
      case 'thermal': return 'Thermal Binding';
      case 'saddle': return 'Saddle Stitch';
      default: return 'No Binding';
    }
  };

  const submitJob = async () => {
    setSubmitting(true);
    try {
      // Convert file URI to blob/file for upload
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Create a File object from the blob
      const file = new File([blob], fileName, { type: 'application/pdf' });

      const jobData = await stationeryService.createJob({
        service_id: serviceId,
        quantity: options.copies,
        file: file,
      });

      router.push({
        pathname: '/(tabs)/stationery/status',
        params: {
          jobId: jobData.id.toString(),
        },
      });
    } catch (error) {
      console.error('Error submitting job:', error);
      Alert.alert(
        'Submission Failed',
        'Failed to submit your job. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Summary</Text>
        <Text style={styles.subtitle}>Review your printing job details</Text>
      </View>

      {/* File Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document</Text>
        <View style={styles.detailCard}>
          <View style={styles.fileIcon}>
            <Ionicons name="document-outline" size={24} color="#28a745" />
          </View>
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
            <Text style={styles.fileSize}>{formatFileSize(fileSize)}</Text>
          </View>
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Details</Text>
        <View style={styles.detailCard}>
          <View style={styles.serviceIcon}>
            <Ionicons name="print-outline" size={24} color="#007bff" />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceName}>{serviceName}</Text>
            <Text style={styles.vendorName}>{vendorName}</Text>
          </View>
        </View>
      </View>

      {/* Print Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Print Options</Text>
        <View style={styles.optionsCard}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Copies:</Text>
            <Text style={styles.optionValue}>{options.copies}</Text>
          </View>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Color:</Text>
            <Text style={styles.optionValue}>{getColorLabel(options.color)}</Text>
          </View>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Sides:</Text>
            <Text style={styles.optionValue}>{getSidesLabel(options.sides)}</Text>
          </View>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Binding:</Text>
            <Text style={styles.optionValue}>{getBindingLabel(options.binding)}</Text>
          </View>
        </View>
      </View>

      {/* Price Estimate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estimated Cost</Text>
        <View style={styles.priceCard}>
          <Text style={styles.priceAmount}>₹{estimatedPrice}</Text>
          <Text style={styles.priceNote}>
            This is an estimate. Final price will be calculated when your job is ready for pickup.
          </Text>
        </View>
      </View>

      {/* Important Notice */}
      <View style={styles.section}>
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={24} color="#007bff" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Pay When Ready</Text>
            <Text style={styles.noticeText}>
              You'll only pay for this job when it's completed and ready for pickup.
              No upfront payment required.
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={submitJob}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm Job</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Ionicons name="pencil-outline" size={20} color="#007bff" />
          <Text style={styles.editButtonText}>Edit Details</Text>
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
    fontSize: 24,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 14,
    color: '#666',
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  optionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  priceCard: {
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
  priceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#28a745',
    marginBottom: 8,
  },
  priceNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  noticeCard: {
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
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionSection: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  editButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
