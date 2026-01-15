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
import { useAddProperty, AVAILABLE_AMENITIES } from '../../contexts/AddPropertyContext';

/**
 * Add Property Step 3: Amenities
 * 
 * Collects:
 * - Amenities selection (multi-select chips)
 * - Custom amenities
 * - Property description
 */

interface Props {
  navigation: any;
}

const MAX_DESCRIPTION_LENGTH = 500;

export const AddPropertyStep3Screen: React.FC<Props> = ({ navigation }) => {
  const {
    amenitiesData,
    toggleAmenity,
    addCustomAmenity,
    updateAmenities,
    goToNextStep,
    goToPreviousStep,
    saveDraft,
    draft,
  } = useAddProperty();

  const [showCustomAmenityModal, setShowCustomAmenityModal] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  const handleBack = () => {
    goToPreviousStep();
    navigation.goBack();
  };

  const handleNext = () => {
    if (goToNextStep()) {
      navigation.navigate('AddPropertyStep4');
    }
  };

  const handleAddCustomAmenity = () => {
    if (customAmenityInput.trim()) {
      addCustomAmenity(customAmenityInput.trim());
      setCustomAmenityInput('');
      setShowCustomAmenityModal(false);
    }
  };

  const remainingChars = MAX_DESCRIPTION_LENGTH - amenitiesData.description.length;

  const renderCustomAmenityModal = () => (
    <Modal
      visible={showCustomAmenityModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCustomAmenityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Custom Amenity</Text>
          <TextInput
            style={styles.modalInput}
            value={customAmenityInput}
            onChangeText={setCustomAmenityInput}
            placeholder="e.g., Terrace Garden"
            placeholderTextColor="#999"
            autoFocus
            maxLength={30}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => {
                setCustomAmenityInput('');
                setShowCustomAmenityModal(false);
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalAddButton,
                !customAmenityInput.trim() && styles.modalAddButtonDisabled
              ]}
              onPress={handleAddCustomAmenity}
              disabled={!customAmenityInput.trim()}
            >
              <Text style={styles.modalAddText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PropertyWizardHeader
        currentStep={3}
        totalSteps={4}
        stepTitle="Amenities"
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
        <Text style={styles.sectionTitle}>Select Available Amenities</Text>

        {/* Amenities Grid */}
        <View style={styles.amenitiesGrid}>
          {AVAILABLE_AMENITIES.map((amenity) => {
            const isSelected = amenitiesData.amenities.includes(amenity.id);
            return (
              <TouchableOpacity
                key={amenity.id}
                style={[
                  styles.amenityChip,
                  isSelected && styles.amenityChipSelected,
                ]}
                onPress={() => toggleAmenity(amenity.id)}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#6366f1" style={styles.checkIcon} />
                )}
                <Text style={[
                  styles.amenityChipText,
                  isSelected && styles.amenityChipTextSelected,
                ]}>
                  {amenity.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Custom Amenities */}
          {amenitiesData.customAmenities.map((amenity, index) => (
            <TouchableOpacity
              key={`custom-${index}`}
              style={[styles.amenityChip, styles.amenityChipSelected]}
              onPress={() => {
                updateAmenities({
                  customAmenities: amenitiesData.customAmenities.filter((_, i) => i !== index),
                });
              }}
            >
              <Ionicons name="checkmark" size={16} color="#6366f1" style={styles.checkIcon} />
              <Text style={[styles.amenityChipText, styles.amenityChipTextSelected]}>
                {amenity}
              </Text>
              <Ionicons name="close" size={14} color="#6366f1" style={styles.removeIcon} />
            </TouchableOpacity>
          ))}

          {/* Add Custom Button */}
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={() => setShowCustomAmenityModal(true)}
          >
            <Ionicons name="add" size={18} color="#6366f1" />
            <Text style={styles.addCustomText}>Add Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Property Description */}
        <Text style={styles.sectionTitle}>Property Description</Text>
        
        <TextInput
          style={styles.descriptionInput}
          value={amenitiesData.description}
          onChangeText={(v) => updateAmenities({ description: v })}
          placeholder="Beautiful 2BHK apartment in prime Koramangala location. Close to metro, schools, and shopping centers..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={6}
          maxLength={MAX_DESCRIPTION_LENGTH}
          textAlignVertical="top"
        />
        <Text style={[
          styles.charCount,
          remainingChars < 50 && styles.charCountWarning,
        ]}>
          {remainingChars} characters remaining
        </Text>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={18} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Tips for better description:</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Mention nearby landmarks</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Highlight unique features</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Be honest and detailed</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue to Photos</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderCustomAmenityModal()}
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  amenityChipSelected: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  checkIcon: {
    marginRight: 6,
  },
  removeIcon: {
    marginLeft: 6,
  },
  amenityChipText: {
    fontSize: 14,
    color: '#374151',
  },
  amenityChipTextSelected: {
    color: '#6366f1',
    fontWeight: '500',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    gap: 4,
  },
  addCustomText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 6,
  },
  charCountWarning: {
    color: '#f59e0b',
  },
  tipsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#a16207',
  },
  tipText: {
    fontSize: 14,
    color: '#a16207',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalAddButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalAddButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  modalAddText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AddPropertyStep3Screen;
