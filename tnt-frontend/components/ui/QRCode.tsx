import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QRCodeProps {
  value: string;
  size?: number;
}

export default function QRCode({ value, size = 200 }: QRCodeProps) {
  // For now, we'll show a placeholder since we need to install a QR library
  // In production, you'd use react-native-qrcode-svg or similar
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.qrPlaceholder}>
        <Ionicons name="qr-code" size={size * 0.6} color="#007bff" />
        <Text style={styles.qrText}>{value.slice(0, 8)}...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});
