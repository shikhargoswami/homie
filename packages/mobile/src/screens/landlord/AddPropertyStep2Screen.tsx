import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropertyWizardHeader } from '../../components/property/PropertyWizardHeader';
import { 
  useAddProperty, 
  FURNISHING_OPTIONS,
  FurnishingStatus,
} from '../../contexts/AddPropertyContext';

/**
 * Add Property Step 2: Pricing
 * 
 * Collects:
 * - Monthly rent
 * - Security deposit
 * - Maintenance charge
 * - Furnishing status
 * - Available from date
 */

interface Props {
  navigation: any;
}

export const AddPropertyStep2Screen: React.FC<Props> = ({ navigation }) => {
  const {
    pricing,
    updatePricing,
    basicInfo,
    goToNextStep,
    goToPreviousStep,
    saveDraft,
    draft,
  } = useAddProperty();

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Calculate suggested rent range based on configuration and area
  const getSuggestedRent = () => {
    const baseRents: Record<string, { min: number; max: number }> = {
      '1rk': { min: 8000, max: 15000 },
      '1bhk': { min: 15000, max: 25000 },
      '2bhk': { min: 25000, max: 40000 },
      '3bhk': { min: 35000, max: 60000 },
      '4bhk+': { min: 50000, max: 100000 },
    };
    
    const range = baseRents[basicInfo.configuration] || baseRents['2bhk'];
    return range;
  };

  const suggestedRent = getSuggestedRent();

  const handleBack = () => {
    goToPreviousStep();
    navigation.goBack();
  };

  const handleNext = () => {
    if (goToNextStep()) {
      navigation.navigate('AddPropertyStep3');
    }
  };

  const formatCurrency = (value: string): string => {
    const num = parseInt(value.replace(/,/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-IN');
  };

  const parseCurrency = (value: string): string => {
    return value.replace(/,/g, '').replace(/[^0-9]/g, '');
  };

  const handleDateSelect = (date: Date) => {
    updatePricing({ availableFrom: date });
    setShowDatePicker(false);
  };

  // Simple date picker modal
  const renderDatePicker = () => {
    const today = new Date();
    const dates: Date[] = [];
    
    // Generate next 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return (
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Available Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dateList}>
              {dates.map((date, index) => {
                const isSelected = pricing.availableFrom.toDateString() === date.toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                    onPress={() => handleDateSelect(date)}
                  >
                    <Text style={[styles.dateOptionText, isSelected && styles.dateOptionTextSelected]}>
                      {date.toLocaleDateString('en-IN', { 
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PropertyWizardHeader
        currentStep={2}
        totalSteps={4}
        stepTitle="Pricing"
        onBack={handleBack}
        onSaveDraft={saveDraft}
        isFirstStep={false}
        isSavingDraft={draft.isSaving}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Pricing Details</Text>

        {/* Monthly Rent */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Monthly Rent (₹)</Text>
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.currencyInput}
              value={formatCurrency(pricing.rent)}
              onChangeText={(v) => updatePricing({ rent: parseCurrency(v) })}
              placeholder="32,000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Suggested Rent Tip */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={18} color="#f59e0b" />
          <View style={styles.tipContent}>
            <Text style={styles.tipText}>
              Suggested rent: ₹{suggestedRent.min.toLocaleString('en-IN')} - ₹{suggestedRent.max.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.tipSubtext}>
              Based on similar {basicInfo.configuration.toUpperCase()} properties in your area
            </Text>
          </View>
        </View>

        {/* Security Deposit */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Security Deposit (₹)</Text>
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.currencyInput}
              value={formatCurrency(pricing.deposit)}
              onChangeText={(v) => updatePricing({ deposit: parseCurrency(v) })}
              placeholder="64,000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.helperText}>Typically 2-3 months rent</Text>
        </View>

        {/* Maintenance Charge */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Maintenance Charge (₹/month)</Text>
          <View style={styles.currencyInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.currencyInput}
              value={formatCurrency(pricing.maintenanceCharge)}
              onChangeText={(v) => updatePricing({ maintenanceCharge: parseCurrency(v) })}
              placeholder="2,000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.helperText}>Include society maintenance, if applicable</Text>
        </View>

        {/* Furnishing Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Furnishing Status</Text>
          <View style={styles.furnishingRow}>
            {FURNISHING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.furnishingOption,
                  pricing.furnishing === option.value && styles.furnishingOptionActive,
                ]}
                onPress={() => updatePricing({ furnishing: option.value as FurnishingStatus })}
              >
                <View style={[
                  styles.radioCircle,
                  pricing.furnishing === option.value && styles.radioCircleActive,
                ]}>
                  {pricing.furnishing === option.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.furnishingLabel,
                  pricing.furnishing === option.value && styles.furnishingLabelActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available From */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Available From</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#6366f1" />
            <Text style={styles.dateText}>
              {pricing.availableFrom.toLocaleDateString('en-IN', { 
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue to Amenities</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderDatePicker()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 14,
    backgroundColor: '#f3f4f6',
    height: '100%',
    textAlignVertical: 'center',
    paddingVertical: 14,
  },
  currencyInput: {
    flex: 1,
    padding: 14,
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
    gap: 10,
  },
  tipContent: {
    flex: 1,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  tipSubtext: {
    fontSize: 12,
    color: '#a16207',
    marginTop: 2,
  },
  furnishingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  furnishingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  furnishingOptionActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#6366f1',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366f1',
  },
  furnishingLabel: {
    fontSize: 14,
    color: '#374151',
  },
  furnishingLabelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Date Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dateList: {
    padding: 8,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  dateOptionSelected: {
    backgroundColor: '#eef2ff',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  dateOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
});

export default AddPropertyStep2Screen;
