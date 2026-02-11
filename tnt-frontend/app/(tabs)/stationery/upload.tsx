import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface PrintOptions {
  copies: number;
  color: 'black_white' | 'color';
  sides: 'single' | 'double';
  binding: 'none' | 'spiral' | 'thermal' | 'saddle';
}

export default function UploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [options, setOptions] = useState<PrintOptions>({
    copies: 1,
    color: 'black_white',
    sides: 'single',
    binding: 'none',
  });
  const [uploading, setUploading] = useState(false);

  const vendorId = params.vendorId as string;
  const vendorName = params.vendorName as string;
  const serviceId = params.serviceId as string;
  const serviceName = params.serviceName as string;
  const pricePerUnit = parseFloat(params.pricePerUnit as string);
  const unit = params.unit as string;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      // Validate file type
      if (selectedFile.mimeType !== 'application/pdf') {
        Alert.alert('Invalid File', 'Please select a PDF file only.');
        return;
      }

      // Validate file size (max 10MB)
      if ((selectedFile.size || 0) > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
        return;
      }

      setFile(selectedFile);
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculatePrice = () => {
    return options.copies * pricePerUnit;
  };

  const proceedToSummary = () => {
    if (!file) {
      Alert.alert('File Required', 'Please select a PDF file to continue.');
      return;
    }

    router.push({
      pathname: '/(tabs)/stationery/job-summary',
      params: {
        vendorId,
        vendorName,
        serviceId,
        serviceName,
        fileUri: file.uri,
        fileName: file.name,
        fileSize: (file.size || 0).toString(),
        options: JSON.stringify(options),
        estimatedPrice: calculatePrice().toString(),
        unit,
      },
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Document</Text>
        <Text style={styles.subtitle}>Configure your printing options</Text>
      </View>

      {/* File Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Document</Text>

        {!file ? (
          <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
            <Ionicons name="cloud-upload-outline" size={48} color="#007bff" />
            <Text style={styles.uploadTitle}>Select PDF File</Text>
            <Text style={styles.uploadSubtitle}>
              Tap to browse your files{'\n'}Maximum size: 10MB
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileCard}>
            <View style={styles.fileIcon}>
              <Ionicons name="document-outline" size={24} color="#28a745" />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(file.size || 0)}</Text>
            </View>
            <TouchableOpacity
              style={styles.changeFileButton}
              onPress={pickDocument}
            >
              <Ionicons name="pencil-outline" size={16} color="#007bff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Print Options */}
      {file && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Print Options</Text>

          {/* Copies */}
          <View style={styles.optionCard}>
            <Text style={styles.optionLabel}>Number of Copies</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setOptions(prev => ({
                  ...prev,
                  copies: Math.max(1, prev.copies - 1)
                }))}
              >
                <Ionicons name="remove" size={16} color="#007bff" />
              </TouchableOpacity>
              <TextInput
                style={styles.counterInput}
                value={options.copies.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setOptions(prev => ({ ...prev, copies: Math.max(1, num) }));
                }}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setOptions(prev => ({
                  ...prev,
                  copies: prev.copies + 1
                }))}
              >
                <Ionicons name="add" size={16} color="#007bff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Color */}
          <View style={styles.optionCard}>
            <Text style={styles.optionLabel}>Color</Text>
            <View style={styles.optionButtons}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  options.color === 'black_white' && styles.optionButtonSelected,
                ]}
                onPress={() => setOptions(prev => ({ ...prev, color: 'black_white' }))}
              >
                <Text style={[
                  styles.optionButtonText,
                  options.color === 'black_white' && styles.optionButtonTextSelected,
                ]}>
                  Black & White
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  options.color === 'color' && styles.optionButtonSelected,
                ]}
                onPress={() => setOptions(prev => ({ ...prev, color: 'color' }))}
              >
                <Text style={[
                  styles.optionButtonText,
                  options.color === 'color' && styles.optionButtonTextSelected,
                ]}>
                  Color
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sides */}
          <View style={styles.optionCard}>
            <Text style={styles.optionLabel}>Print Sides</Text>
            <View style={styles.optionButtons}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  options.sides === 'single' && styles.optionButtonSelected,
                ]}
                onPress={() => setOptions(prev => ({ ...prev, sides: 'single' }))}
              >
                <Text style={[
                  styles.optionButtonText,
                  options.sides === 'single' && styles.optionButtonTextSelected,
                ]}>
                  Single Sided
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  options.sides === 'double' && styles.optionButtonSelected,
                ]}
                onPress={() => setOptions(prev => ({ ...prev, sides: 'double' }))}
              >
                <Text style={[
                  styles.optionButtonText,
                  options.sides === 'double' && styles.optionButtonTextSelected,
                ]}>
                  Double Sided
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Binding */}
          <View style={styles.optionCard}>
            <Text style={styles.optionLabel}>Binding</Text>
            <View style={styles.bindingOptions}>
              {[
                { value: 'none', label: 'No Binding' },
                { value: 'spiral', label: 'Spiral' },
                { value: 'thermal', label: 'Thermal' },
                { value: 'saddle', label: 'Saddle Stitch' },
              ].map((binding) => (
                <TouchableOpacity
                  key={binding.value}
                  style={[
                    styles.bindingButton,
                    options.binding === binding.value && styles.bindingButtonSelected,
                  ]}
                  onPress={() => setOptions(prev => ({
                    ...prev,
                    binding: binding.value as PrintOptions['binding']
                  }))}
                >
                  <Text style={[
                    styles.bindingButtonText,
                    options.binding === binding.value && styles.bindingButtonTextSelected,
                  ]}>
                    {binding.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Price Summary */}
      {file && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {options.copies} × {serviceName} ({unit})
              </Text>
              <Text style={styles.priceValue}>₹{calculatePrice()}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>₹{calculatePrice()}</Text>
            </View>
            <Text style={styles.priceNote}>
              Final price will be calculated when your job is ready for pickup.
            </Text>
          </View>
        </View>
      )}

      {/* Action Button */}
      {file && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={proceedToSummary}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.continueButtonText}>Continue to Summary</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  fileCard: {
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
    marginRight: 12,
  },
  fileInfo: {
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
  changeFileButton: {
    padding: 8,
  },
  optionCard: {
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
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterInput: {
    width: 60,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    paddingVertical: 8,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonTextSelected: {
    color: '#fff',
  },
  bindingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bindingButton: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  bindingButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  bindingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  bindingButtonTextSelected: {
    color: '#fff',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  priceNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 16,
  },
  actionSection: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
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
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
