import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@services/api';

// Conditionally import ImagePicker - will be available when expo-image-picker is installed
let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  console.log('expo-image-picker not available');
}

/**
 * Add Property Screen
 * 
 * Form for landlords to add new property listings
 * - Property details (address, configuration, rent)
 * - Photos upload
 * - Amenities selection
 * - Availability settings
 */

interface PropertyForm {
  address: string;
  neighborhood: string;
  city: string;
  pincode: string;
  configuration: '1rk' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | 'villa';
  furnishing: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  rent: string;
  deposit: string;
  area: string;
  floor: string;
  totalFloors: string;
  availableFrom: string;
  description: string;
  amenities: string[];
}

interface Props {
  navigation: any;
  route?: {
    params?: {
      propertyId?: string;
      editMode?: boolean;
    };
  };
}

const CONFIGURATIONS = [
  { value: '1rk', label: '1 RK' },
  { value: '1bhk', label: '1 BHK' },
  { value: '2bhk', label: '2 BHK' },
  { value: '3bhk', label: '3 BHK' },
  { value: '4bhk', label: '4 BHK' },
  { value: 'villa', label: 'Villa' },
];

const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi-furnished', label: 'Semi-Furnished' },
  { value: 'fully-furnished', label: 'Fully Furnished' },
];

const AMENITIES = [
  { id: 'parking', label: 'Parking', icon: 'car-outline' },
  { id: 'gym', label: 'Gym', icon: 'barbell-outline' },
  { id: 'pool', label: 'Pool', icon: 'water-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'lift', label: 'Lift', icon: 'arrow-up-outline' },
  { id: 'power-backup', label: 'Power Backup', icon: 'flash-outline' },
  { id: 'wifi', label: 'WiFi', icon: 'wifi-outline' },
  { id: 'ac', label: 'AC', icon: 'snow-outline' },
  { id: 'washing-machine', label: 'Washing Machine', icon: 'water-outline' },
  { id: 'geyser', label: 'Geyser', icon: 'flame-outline' },
  { id: 'garden', label: 'Garden', icon: 'leaf-outline' },
  { id: 'clubhouse', label: 'Clubhouse', icon: 'people-outline' },
];

export const AddPropertyScreen: React.FC<Props> = ({ navigation, route }) => {
  const editMode = route?.params?.editMode || false;
  const propertyId = route?.params?.propertyId;

  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [form, setForm] = useState<PropertyForm>({
    address: '',
    neighborhood: '',
    city: '',
    pincode: '',
    configuration: '2bhk',
    furnishing: 'semi-furnished',
    rent: '',
    deposit: '',
    area: '',
    floor: '',
    totalFloors: '',
    availableFrom: new Date().toISOString().split('T')[0],
    description: '',
    amenities: [],
  });

  const updateForm = (key: keyof PropertyForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenityId: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const handlePickImages = async () => {
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Image picker is not available. Please add photos via URL.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [16, 9],
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map((asset: { uri: string }) => asset.uri);
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!form.address || !form.neighborhood || !form.city) {
          Alert.alert('Required Fields', 'Please fill in the address details');
          return false;
        }
        return true;
      case 2:
        if (!form.rent || !form.deposit) {
          Alert.alert('Required Fields', 'Please enter rent and deposit amount');
          return false;
        }
        return true;
      case 3:
        if (photos.length === 0) {
          Alert.alert('Photos Required', 'Please add at least one photo');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      const propertyData = {
        ...form,
        rent: parseInt(form.rent, 10),
        deposit: parseInt(form.deposit, 10),
        area: form.area ? parseInt(form.area, 10) : null,
        floor: form.floor ? parseInt(form.floor, 10) : null,
        totalFloors: form.totalFloors ? parseInt(form.totalFloors, 10) : null,
        photos,
      };

      if (editMode && propertyId) {
        await apiClient.put(`/api/landlord/properties/${propertyId}`, propertyData);
        Alert.alert('Success', 'Property updated successfully!');
      } else {
        await apiClient.post('/api/landlord/properties', propertyData);
        Alert.alert('Success', 'Property listed successfully!');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save property:', error);
      Alert.alert('Error', 'Failed to save property. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Property Location</Text>
      <Text style={styles.stepSubtitle}>Enter the address details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address *</Text>
        <TextInput
          style={styles.input}
          value={form.address}
          onChangeText={(v) => updateForm('address', v)}
          placeholder="e.g., 123 MG Road, Block A"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Neighborhood *</Text>
          <TextInput
            style={styles.input}
            value={form.neighborhood}
            onChangeText={(v) => updateForm('neighborhood', v)}
            placeholder="e.g., Koramangala"
            placeholderTextColor="#999"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>City *</Text>
          <TextInput
            style={styles.input}
            value={form.city}
            onChangeText={(v) => updateForm('city', v)}
            placeholder="e.g., Bangalore"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Pincode</Text>
        <TextInput
          style={styles.input}
          value={form.pincode}
          onChangeText={(v) => updateForm('pincode', v)}
          placeholder="e.g., 560034"
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={6}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Property Details</Text>
      <Text style={styles.stepSubtitle}>Tell us about your property</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Configuration *</Text>
        <View style={styles.optionGrid}>
          {CONFIGURATIONS.map((config) => (
            <TouchableOpacity
              key={config.value}
              style={[
                styles.optionButton,
                form.configuration === config.value && styles.optionButtonActive,
              ]}
              onPress={() => updateForm('configuration', config.value)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  form.configuration === config.value && styles.optionButtonTextActive,
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Furnishing *</Text>
        <View style={styles.optionRow}>
          {FURNISHING_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.furnishingButton,
                form.furnishing === option.value && styles.furnishingButtonActive,
              ]}
              onPress={() => updateForm('furnishing', option.value)}
            >
              <Text
                style={[
                  styles.furnishingButtonText,
                  form.furnishing === option.value && styles.furnishingButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Rent (₹/month) *</Text>
          <TextInput
            style={styles.input}
            value={form.rent}
            onChangeText={(v) => updateForm('rent', v)}
            placeholder="e.g., 35000"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Deposit (₹) *</Text>
          <TextInput
            style={styles.input}
            value={form.deposit}
            onChangeText={(v) => updateForm('deposit', v)}
            placeholder="e.g., 100000"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Area (sq ft)</Text>
          <TextInput
            style={styles.input}
            value={form.area}
            onChangeText={(v) => updateForm('area', v)}
            placeholder="e.g., 1200"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 0.5, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Floor</Text>
          <TextInput
            style={styles.input}
            value={form.floor}
            onChangeText={(v) => updateForm('floor', v)}
            placeholder="e.g., 3"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => updateForm('description', v)}
          placeholder="Describe your property..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {AMENITIES.map((amenity) => (
            <TouchableOpacity
              key={amenity.id}
              style={[
                styles.amenityButton,
                form.amenities.includes(amenity.id) && styles.amenityButtonActive,
              ]}
              onPress={() => toggleAmenity(amenity.id)}
            >
              <Ionicons
                name={amenity.icon as any}
                size={20}
                color={form.amenities.includes(amenity.id) ? '#6366f1' : '#666'}
              />
              <Text
                style={[
                  styles.amenityButtonText,
                  form.amenities.includes(amenity.id) && styles.amenityButtonTextActive,
                ]}
              >
                {amenity.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Photos</Text>
      <Text style={styles.stepSubtitle}>Add photos of your property (max 10)</Text>

      <View style={styles.photosGrid}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => handleRemovePhoto(index)}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
        
        {photos.length < 10 && (
          <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickImages}>
            <Ionicons name="camera-outline" size={32} color="#6366f1" />
            <Text style={styles.addPhotoText}>Add Photos</Text>
          </TouchableOpacity>
        )}
      </View>

      {photos.length > 0 && (
        <Text style={styles.photoCount}>{photos.length}/10 photos added</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editMode ? 'Edit Property' : 'Add Property'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.progressBar,
              step <= currentStep && styles.progressBarActive,
            ]}
          />
        ))}
      </View>

      {/* Form Content */}
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backStepButton} onPress={handleBack}>
            <Text style={styles.backStepButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {editMode ? 'Update Property' : 'List Property'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#6366f1',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  optionButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  optionButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  furnishingButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  furnishingButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  furnishingButtonText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  furnishingButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 6,
  },
  amenityButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  amenityButtonText: {
    fontSize: 12,
    color: '#666',
  },
  amenityButtonTextActive: {
    color: '#6366f1',
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
  },
  photoCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  backStepButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  backStepButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AddPropertyScreen;
