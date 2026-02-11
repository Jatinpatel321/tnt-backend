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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { stationeryService, JobDetails } from '../../../services/stationery';

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  icon: string;
}

export default function JobStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const jobId = params.jobId as string;

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const jobData = await stationeryService.getJobDetails(parseInt(jobId));
      setJob(jobData);
    } catch (error) {
      console.error('Error loading job details:', error);
      Alert.alert('Error', 'Failed to load job details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobDetails();
  };

  const getTimelineSteps = (job: JobDetails): TimelineStep[] => {
    const steps: TimelineStep[] = [
      {
        id: 'submitted',
        title: 'Job Submitted',
        description: 'Your job has been received and is being processed',
        status: 'completed',
        icon: 'document-outline',
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        description: 'Your job is being prepared',
        status: 'pending',
        icon: 'construct-outline',
      },
      {
        id: 'ready',
        title: 'Ready for Pickup',
        description: 'Your job is ready for collection and payment',
        status: 'pending',
        icon: 'checkmark-circle-outline',
      },
      {
        id: 'collected',
        title: 'Collected',
        description: 'Job completed and collected',
        status: 'pending',
        icon: 'bag-check-outline',
      },
    ];

    // Update status based on current job status
    const statusOrder = ['submitted', 'in_progress', 'ready', 'collected'];
    const currentStatusIndex = statusOrder.indexOf(job.status);

    steps.forEach((step, index) => {
      if (index < currentStatusIndex) {
        step.status = 'completed';
      } else if (index === currentStatusIndex) {
        step.status = 'current';
      } else {
        step.status = 'pending';
      }
    });

    return steps;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return '#ffc107';
      case 'in_progress': return '#007bff';
      case 'ready': return '#28a745';
      case 'collected': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'in_progress': return 'In Progress';
      case 'ready': return 'Ready for Pickup';
      case 'collected': return 'Collected';
      default: return status;
    }
  };

  const handlePayment = () => {
    // TODO: Integrate Razorpay payment
    Alert.alert(
      'Payment',
      'Payment integration will be implemented here',
      [{ text: 'OK' }]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading job status...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
        <Text style={styles.errorTitle}>Job Not Found</Text>
        <Text style={styles.errorText}>Unable to load job details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadJobDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timelineSteps = getTimelineSteps(job);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Status</Text>
        <Text style={styles.subtitle}>Track your stationery order</Text>
      </View>

      {/* Job Info Card */}
      <View style={styles.section}>
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View style={styles.jobInfo}>
              <Text style={styles.serviceName}>{job.service.name}</Text>
              <Text style={styles.vendorName}>{job.vendor.name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(job.status)}</Text>
            </View>
          </View>

          <View style={styles.jobDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="document-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Quantity: {job.quantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{formatDate(job.created_at)}</Text>
            </View>
            {job.amount && (
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#666" />
                <Text style={styles.detailText}>₹{job.amount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Timeline</Text>
        <View style={styles.timeline}>
          {timelineSteps.map((step, index) => (
            <View key={step.id} style={styles.timelineItem}>
              <View style={styles.timelineConnector}>
                {index < timelineSteps.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      step.status === 'completed' && styles.timelineLineCompleted,
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineContent}>
                <View style={styles.stepIcon}>
                  <Ionicons
                    name={step.icon as any}
                    size={20}
                    color={
                      step.status === 'completed'
                        ? '#28a745'
                        : step.status === 'current'
                        ? '#007bff'
                        : '#ccc'
                    }
                  />
                </View>

                <View style={styles.stepDetails}>
                  <Text
                    style={[
                      styles.stepTitle,
                      step.status === 'completed' && styles.stepTitleCompleted,
                      step.status === 'current' && styles.stepTitleCurrent,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={[
                      styles.stepDescription,
                      step.status === 'completed' && styles.stepDescriptionCompleted,
                      step.status === 'current' && styles.stepDescriptionCurrent,
                    ]}
                  >
                    {step.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Payment Section */}
      {job.status === 'ready' && !job.is_paid && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card-outline" size={24} color="#28a745" />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Ready for Payment</Text>
                <Text style={styles.paymentSubtitle}>
                  Pay ₹{job.amount} to collect your order
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
              <Ionicons name="card-outline" size={20} color="#fff" />
              <Text style={styles.payButtonText}>Pay & Collect</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={16} color="#007bff" />
              <Text style={styles.refreshButtonText}>Refresh Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/stationery/jobs')}
        >
          <Ionicons name="arrow-back-outline" size={16} color="#666" />
          <Text style={styles.backButtonText}>Back to Jobs</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 14,
    color: '#666',
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
  jobDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  timeline: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineConnector: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e9ecef',
    marginTop: 24,
  },
  timelineLineCompleted: {
    backgroundColor: '#28a745',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  stepDetails: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: '#28a745',
  },
  stepTitleCurrent: {
    color: '#007bff',
  },
  stepDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  stepDescriptionCompleted: {
    color: '#666',
  },
  stepDescriptionCurrent: {
    color: '#666',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  payButton: {
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
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsSection: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  refreshButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  refreshButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
