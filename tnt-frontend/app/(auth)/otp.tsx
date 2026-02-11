import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, OTPInput } from '../../components/ui';
import { authService } from '../../services';
import { useAuthStore } from '../../store';
import * as SecureStore from 'expo-secure-store';

export default function OTPScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOTPComplete = async (otpValue: string) => {
    setOtp(otpValue);
    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyOTP(phone as string, otpValue);

      // Update auth store (token storage handled by store)
      await login(response.access_token, response.role);

      // Navigate to main app (replace to prevent back navigation)
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setCountdown(30);
    setCanResend(false);

    try {
      await authService.sendOTP(phone as string);
      Alert.alert('Success', 'OTP sent successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    return `+91 ${phone.slice(0, 5)}XXXXX`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            OTP sent to {formatPhone(phone as string)}
          </Text>
        </View>

        <View style={styles.form}>
          <OTPInput
            onComplete={handleOTPComplete}
            error={error}
          />

          <View style={styles.resendContainer}>
            {canResend ? (
              <Button
                title="Resend OTP"
                onPress={handleResendOTP}
                variant="secondary"
                loading={loading}
                style={styles.resendButton}
              />
            ) : (
              <Text style={styles.countdownText}>
                Resend OTP in {countdown}s
              </Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendButton: {
    minWidth: 120,
  },
  countdownText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});
