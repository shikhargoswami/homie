import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { PropertyWizardHeader } from '../../components/property/PropertyWizardHeader';
import { LocationAutocomplete } from '../../components/common/LocationAutocomplete';
import { PlaceDetails, extractAddressComponents } from '../../services/places.service';
import { 
  useAddProperty, 
  PROPERTY_TYPES, 
  CONFIGURATIONS,
  PropertyType,
  Configuration,
} from '../../contexts/AddPropertyContext';

/**
 * Add Property Step 1: Basic Info
 * 
 * Collects:
 * - Property title
 * - Full address
 * - Property type (Apartment, Villa, Independent House, PG)
 * - Configuration (1RK, 1BHK, 2BHK, 3BHK, 4BHK+)
 * - Size (sqft)
 * - Floor details (floor number, total floors)
 */

interface Props {
  navigation: any;
}

export const AddPropertyStep1Screen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute();
  const {
    basicInfo,
    updateBasicInfo,
    goToNextStep,
    saveDraft,
    draft,
    resetForm,
    currentStep,
    setCurrentStep,
  } = useAddProperty();

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Reset form when entering from AddProperty route (fresh start)
  useFocusEffect(
    React.useCallback(() => {
      // Only reset if coming from AddProperty route and we're not already in the middle of wizard
      if (route.name === 'AddProperty' && currentStep === 1) {
        resetForm();
      }
      // Make sure we're on step 1
      setCurrentStep(1);
    }, [route.name])
  );

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard this property listing?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            resetForm();
            navigation.goBack();
          }
        },
      ]
    );
  };

  const handleNext = () => {
    if (goToNextStep()) {
      navigation.navigate('AddPropertyStep2');
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // Try to get location if available
      let Location: typeof import('expo-location') | null = null;
      try {
        Location = require('expo-location');
      } catch (e) {
        Alert.alert('Not Available', 'Location services are not available.');
        setIsLoadingLocation(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const fullAddress = [
          address.streetNumber,
          address.street,
          address.district,
          address.city,
          address.postalCode,
        ].filter(Boolean).join(', ');
        
        updateBasicInfo({
          address: fullAddress,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get current location. Please enter address manually.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PropertyWizardHeader
        currentStep={1}
        totalSteps={4}
        stepTitle="Basic Info"
        onBack={handleCancel}
        onSaveDraft={saveDraft}
        isFirstStep={true}
        isSavingDraft={draft.isSaving}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Property Details</Text>

        {/* Property Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Title</Text>
          <TextInput
            style={styles.input}
            value={basicInfo.title}
            onChangeText={(v) => updateBasicInfo({ title: v })}
            placeholder="e.g., Sky Villa, Green Haven"
            placeholderTextColor="#999"
            maxLength={50}
          />
        </View>

        {/* Full Address with Google Places Autocomplete */}
        <View style={styles.inputGroup}>
          <LocationAutocomplete
            value={basicInfo.address}
            onPlaceSelect={(place: PlaceDetails, displayText: string) => {
              // Extract address components
              const components = extractAddressComponents(place);
              
              updateBasicInfo({
                address: place.formattedAddress,
                neighborhood: components.neighborhood || components.city || '',
                city: components.city || 'Bangalore',
                pincode: components.postalCode || '',
                latitude: place.location.lat,
                longitude: place.location.lng,
              });
            }}
            onChangeText={(v) => updateBasicInfo({ address: v })}
            label="Full Address"
            placeholder="Search for property address"
            types="geocode"
            biasLocation={{ lat: 12.9716, lng: 77.5946 }} // Bangalore center
            biasRadius={50000}
            showCurrentLocation={true}
            onCurrentLocationPress={handleUseCurrentLocation}
            testID="property-address-input"
          />
        </View>

        {/* Neighborhood and City */}
        <View style={styles.rowInputs}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Neighborhood</Text>
            <TextInput
              style={styles.input}
              value={basicInfo.neighborhood}
              onChangeText={(v) => updateBasicInfo({ neighborhood: v })}
              placeholder="Koramangala"
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={basicInfo.city}
              onChangeText={(v) => updateBasicInfo({ city: v })}
              placeholder="Bangalore"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Pincode */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pincode</Text>
          <TextInput
            style={styles.input}
            value={basicInfo.pincode}
            onChangeText={(v) => updateBasicInfo({ pincode: v.replace(/[^0-9]/g, '') })}
            placeholder="560034"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        {/* Use Current Location Button */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={handleUseCurrentLocation}
          disabled={isLoadingLocation}
        >
          <Ionicons 
            name="location" 
            size={20} 
            color={isLoadingLocation ? '#999' : '#6366f1'} 
          />
          <Text style={[
            styles.locationButtonText,
            isLoadingLocation && styles.locationButtonTextDisabled
          ]}>
            {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Property Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Property Type</Text>
          <View style={styles.optionRow}>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.radioOption,
                  basicInfo.propertyType === type.value && styles.radioOptionActive,
                ]}
                onPress={() => updateBasicInfo({ propertyType: type.value as PropertyType })}
              >
                <View style={[
                  styles.radioCircle,
                  basicInfo.propertyType === type.value && styles.radioCircleActive,
                ]}>
                  {basicInfo.propertyType === type.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={[
                  styles.radioLabel,
                  basicInfo.propertyType === type.value && styles.radioLabelActive,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Configuration */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Configuration</Text>
          <View style={styles.chipRow}>
            {CONFIGURATIONS.map((config) => (
              <TouchableOpacity
                key={config.value}
                style={[
                  styles.chip,
                  basicInfo.configuration === config.value && styles.chipActive,
                ]}
                onPress={() => updateBasicInfo({ configuration: config.value as Configuration })}
              >
                <Text style={[
                  styles.chipText,
                  basicInfo.configuration === config.value && styles.chipTextActive,
                ]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Size */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Size (sqft)</Text>
          <TextInput
            style={styles.input}
            value={basicInfo.size}
            onChangeText={(v) => updateBasicInfo({ size: v.replace(/[^0-9]/g, '') })}
            placeholder="e.g., 1200"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        {/* Floor Details */}
        <Text style={styles.inputLabel}>Floor Details</Text>
        <View style={styles.floorRow}>
          <View style={styles.floorInput}>
            <Text style={styles.floorInputLabel}>Floor Number</Text>
            <TextInput
              style={styles.input}
              value={basicInfo.floorNumber}
              onChangeText={(v) => updateBasicInfo({ floorNumber: v.replace(/[^0-9]/g, '') })}
              placeholder="3"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.floorInput}>
            <Text style={styles.floorInputLabel}>Total Floors</Text>
            <TextInput
              style={styles.input}
              value={basicInfo.totalFloors}
              onChangeText={(v) => updateBasicInfo({ totalFloors: v.replace(/[^0-9]/g, '') })}
              placeholder="5"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue to Pricing</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
  },
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInput: {
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  locationButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  locationButtonTextDisabled: {
    color: '#999',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  radioOptionActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
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
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  radioLabelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  chipTextActive: {
    color: '#fff',
  },
  floorRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  floorInput: {
    flex: 1,
  },
  floorInputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
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
});

export default AddPropertyStep1Screen;
