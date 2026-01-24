import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { apiClient } from '../services/api';

/**
 * Add Property Context
 * 
 * Manages state for the multi-step property creation wizard:
 * - Step 1: Basic Info (title, address, type, configuration, size, floors)
 * - Step 2: Pricing (rent, deposit, maintenance, furnishing, availability)
 * - Step 3: Amenities (amenity selection, description)
 * - Step 4: Photos (property photos, VR tour option)
 */

// Property Types
export type PropertyType = 'apartment' | 'villa' | 'independent_house' | 'pg';
export type Configuration = '1rk' | '1bhk' | '2bhk' | '3bhk' | '4bhk+';
export type FurnishingStatus = 'unfurnished' | 'semi-furnished' | 'fully-furnished';

// Step 1: Basic Info
export interface BasicInfoData {
  title: string;
  address: string;
  neighborhood: string;
  city: string;
  pincode: string;
  propertyType: PropertyType;
  configuration: Configuration;
  size: string; // sqft
  floorNumber: string;
  totalFloors: string;
  latitude?: number;
  longitude?: number;
}

// Step 2: Pricing
export interface PricingData {
  rent: string;
  deposit: string;
  maintenanceCharge: string;
  furnishing: FurnishingStatus;
  availableFrom: Date;
}

// Step 3: Amenities
export interface AmenitiesData {
  amenities: string[];
  description: string;
  customAmenities: string[];
}

// Step 4: Photos
export interface PhotosData {
  photos: string[]; // URIs or URLs
  vrTourRequested: boolean;
}

// Complete property data for API submission
export interface PropertyFormData {
  basicInfo: BasicInfoData;
  pricing: PricingData;
  amenities: AmenitiesData;
  photos: PhotosData;
}

// Draft status
export interface DraftStatus {
  id?: string;
  lastSaved?: Date;
  isSaving: boolean;
}

interface AddPropertyContextType {
  // Current step
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Step data
  basicInfo: BasicInfoData;
  setBasicInfo: (data: BasicInfoData) => void;
  updateBasicInfo: (data: Partial<BasicInfoData>) => void;
  
  pricing: PricingData;
  setPricing: (data: PricingData) => void;
  updatePricing: (data: Partial<PricingData>) => void;
  
  amenitiesData: AmenitiesData;
  setAmenitiesData: (data: AmenitiesData) => void;
  updateAmenities: (data: Partial<AmenitiesData>) => void;
  toggleAmenity: (amenityId: string) => void;
  addCustomAmenity: (amenity: string) => void;
  
  photosData: PhotosData;
  setPhotosData: (data: PhotosData) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (index: number) => void;
  setVRTourRequested: (requested: boolean) => void;
  
  // Validation
  validateStep: (step: number) => { valid: boolean; errors: string[] };
  
  // Navigation
  goToNextStep: () => boolean;
  goToPreviousStep: () => void;
  
  // Draft management
  draft: DraftStatus;
  saveDraft: () => Promise<void>;
  loadDraft: (draftId: string) => Promise<void>;
  
  // Submission
  isSubmitting: boolean;
  submitProperty: () => Promise<{ success: boolean; propertyId?: string; error?: string }>;
  
  // Reset
  resetForm: () => void;
  
  // Edit mode
  isEditMode: boolean;
  editPropertyId?: string;
  loadPropertyForEdit: (propertyId: string) => Promise<void>;
}

// Initial values
const initialBasicInfo: BasicInfoData = {
  title: '',
  address: '',
  neighborhood: '',
  city: '',
  pincode: '',
  propertyType: 'apartment',
  configuration: '2bhk',
  size: '',
  floorNumber: '',
  totalFloors: '',
};

const initialPricing: PricingData = {
  rent: '',
  deposit: '',
  maintenanceCharge: '',
  furnishing: 'semi-furnished',
  availableFrom: new Date(),
};

const initialAmenities: AmenitiesData = {
  amenities: [],
  description: '',
  customAmenities: [],
};

const initialPhotos: PhotosData = {
  photos: [],
  vrTourRequested: false,
};

const AddPropertyContext = createContext<AddPropertyContextType | undefined>(undefined);

// Available amenities
export const AVAILABLE_AMENITIES = [
  { id: 'parking', label: 'Parking', icon: 'car-outline' },
  { id: 'gym', label: 'Gym', icon: 'barbell-outline' },
  { id: 'swimming_pool', label: 'Swimming Pool', icon: 'water-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'power_backup', label: 'Power Backup', icon: 'flash-outline' },
  { id: 'lift', label: 'Lift', icon: 'arrow-up-outline' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: 'paw-outline' },
  { id: 'balcony', label: 'Balcony', icon: 'sunny-outline' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi-outline' },
  { id: 'clubhouse', label: 'Clubhouse', icon: 'people-outline' },
  { id: 'playground', label: 'Playground', icon: 'football-outline' },
  { id: 'garden', label: 'Garden', icon: 'leaf-outline' },
];

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'independent_house', label: 'Independent House' },
  { value: 'pg', label: 'PG' },
];

export const CONFIGURATIONS = [
  { value: '1rk', label: '1RK' },
  { value: '1bhk', label: '1BHK' },
  { value: '2bhk', label: '2BHK' },
  { value: '3bhk', label: '3BHK' },
  { value: '4bhk+', label: '4BHK+' },
];

export const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi-furnished', label: 'Semi-Furnished' },
  { value: 'fully-furnished', label: 'Fully Furnished' },
];

export const AddPropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data state
  const [basicInfo, setBasicInfo] = useState<BasicInfoData>(initialBasicInfo);
  const [pricing, setPricing] = useState<PricingData>(initialPricing);
  const [amenitiesData, setAmenitiesData] = useState<AmenitiesData>(initialAmenities);
  const [photosData, setPhotosData] = useState<PhotosData>(initialPhotos);
  
  // Draft state
  const [draft, setDraft] = useState<DraftStatus>({ isSaving: false });
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState<string | undefined>();

  // Update functions
  const updateBasicInfo = useCallback((data: Partial<BasicInfoData>) => {
    setBasicInfo(prev => ({ ...prev, ...data }));
  }, []);

  const updatePricing = useCallback((data: Partial<PricingData>) => {
    setPricing(prev => ({ ...prev, ...data }));
  }, []);

  const updateAmenities = useCallback((data: Partial<AmenitiesData>) => {
    setAmenitiesData(prev => ({ ...prev, ...data }));
  }, []);

  const toggleAmenity = useCallback((amenityId: string) => {
    setAmenitiesData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  }, []);

  const addCustomAmenity = useCallback((amenity: string) => {
    if (amenity.trim()) {
      setAmenitiesData(prev => ({
        ...prev,
        customAmenities: [...prev.customAmenities, amenity.trim()],
      }));
    }
  }, []);

  const addPhoto = useCallback((uri: string) => {
    setPhotosData(prev => ({
      ...prev,
      photos: [...prev.photos, uri].slice(0, 15), // Max 15 photos
    }));
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotosData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  const setVRTourRequested = useCallback((requested: boolean) => {
    setPhotosData(prev => ({ ...prev, vrTourRequested: requested }));
  }, []);

  // Validation
  const validateStep = useCallback((step: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (step) {
      case 1: // Basic Info
        if (!basicInfo.title.trim()) errors.push('Property title is required');
        if (!basicInfo.address.trim()) errors.push('Address is required');
        if (!basicInfo.neighborhood.trim()) errors.push('Neighborhood is required');
        if (!basicInfo.city.trim()) errors.push('City is required');
        if (!basicInfo.size.trim()) errors.push('Property size is required');
        break;
        
      case 2: // Pricing
        if (!pricing.rent || parseInt(pricing.rent) <= 0) errors.push('Valid rent amount is required');
        if (!pricing.deposit || parseInt(pricing.deposit) <= 0) errors.push('Valid deposit amount is required');
        break;
        
      case 3: // Amenities
        if (!amenitiesData.description.trim()) errors.push('Property description is required');
        if (amenitiesData.description.length < 50) errors.push('Description should be at least 50 characters');
        break;
        
      case 4: // Photos
        if (photosData.photos.length < 5) errors.push('At least 5 photos are required');
        break;
    }

    return { valid: errors.length === 0, errors };
  }, [basicInfo, pricing, amenitiesData, photosData]);

  const goToNextStep = useCallback((): boolean => {
    const { valid, errors } = validateStep(currentStep);
    
    if (!valid) {
      Alert.alert('Required Fields', errors.join('\n'));
      return false;
    }
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentStep, validateStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Draft management
  const saveDraft = useCallback(async () => {
    setDraft(prev => ({ ...prev, isSaving: true }));
    
    try {
      const draftData = {
        basicInfo,
        pricing: {
          ...pricing,
          availableFrom: pricing.availableFrom.toISOString(),
        },
        amenities: amenitiesData,
        photos: photosData,
        currentStep,
      };

      const response = await apiClient.post('/api/landlord/properties/draft', draftData);
      const draftId = response.data?.id || draft.id;
      
      setDraft({
        id: draftId,
        lastSaved: new Date(),
        isSaving: false,
      });
      
      console.log('[AddPropertyContext] Draft saved:', draftId);
    } catch (error) {
      console.error('[AddPropertyContext] Failed to save draft:', error);
      setDraft(prev => ({ ...prev, isSaving: false }));
      Alert.alert('Error', 'Failed to save draft. Please try again.');
    }
  }, [basicInfo, pricing, amenitiesData, photosData, currentStep, draft.id]);

  const loadDraft = useCallback(async (draftId: string) => {
    try {
      const response = await apiClient.get(`/api/landlord/properties/draft/${draftId}`);
      const draftData = response.data?.data || response.data;
      
      if (draftData.basicInfo) setBasicInfo(draftData.basicInfo);
      if (draftData.pricing) {
        setPricing({
          ...draftData.pricing,
          availableFrom: new Date(draftData.pricing.availableFrom),
        });
      }
      if (draftData.amenities) setAmenitiesData(draftData.amenities);
      if (draftData.photos) setPhotosData(draftData.photos);
      if (draftData.currentStep) setCurrentStep(draftData.currentStep);
      
      setDraft({ id: draftId, lastSaved: new Date(), isSaving: false });
      console.log('[AddPropertyContext] Draft loaded:', draftId);
    } catch (error) {
      console.error('[AddPropertyContext] Failed to load draft:', error);
      Alert.alert('Error', 'Failed to load draft. Starting fresh.');
    }
  }, []);

  // Submit property
  const submitProperty = useCallback(async (): Promise<{ success: boolean; propertyId?: string; error?: string }> => {
    // Validate all steps
    for (let step = 1; step <= 4; step++) {
      const { valid, errors } = validateStep(step);
      if (!valid) {
        return { success: false, error: errors.join('\n') };
      }
    }

    setIsSubmitting(true);
    
    try {
      const propertyData = {
        // Basic Info
        title: basicInfo.title,
        address: basicInfo.address,
        neighborhood: basicInfo.neighborhood,
        city: basicInfo.city,
        pincode: basicInfo.pincode || null,
        propertyType: basicInfo.propertyType,
        configuration: basicInfo.configuration,
        area: parseInt(basicInfo.size),
        floor: basicInfo.floorNumber ? parseInt(basicInfo.floorNumber) : null,
        totalFloors: basicInfo.totalFloors ? parseInt(basicInfo.totalFloors) : null,
        latitude: basicInfo.latitude,
        longitude: basicInfo.longitude,
        
        // Pricing
        rent: parseInt(pricing.rent),
        deposit: parseInt(pricing.deposit),
        maintenanceCharge: pricing.maintenanceCharge ? parseInt(pricing.maintenanceCharge) : 0,
        furnishing: pricing.furnishing,
        availableFrom: pricing.availableFrom.toISOString().split('T')[0],
        
        // Amenities
        amenities: [...amenitiesData.amenities, ...amenitiesData.customAmenities],
        description: amenitiesData.description,
        
        // Photos
        photos: photosData.photos,
        vrTourRequested: photosData.vrTourRequested,
      };

      let response;
      if (isEditMode && editPropertyId) {
        response = await apiClient.put(`/api/landlord/properties/${editPropertyId}`, propertyData);
      } else {
        response = await apiClient.post('/api/landlord/properties', propertyData);
      }

      const propertyId = response.data?.data?.id || response.data?.id;
      console.log('[AddPropertyContext] Property submitted:', propertyId);
      
      return { success: true, propertyId };
    } catch (error: any) {
      console.error('[AddPropertyContext] Failed to submit property:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to publish property. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [basicInfo, pricing, amenitiesData, photosData, isEditMode, editPropertyId, validateStep]);

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setBasicInfo(initialBasicInfo);
    setPricing(initialPricing);
    setAmenitiesData(initialAmenities);
    setPhotosData(initialPhotos);
    setDraft({ isSaving: false });
    setIsEditMode(false);
    setEditPropertyId(undefined);
  }, []);

  // Load property for editing
  const loadPropertyForEdit = useCallback(async (propertyId: string) => {
    try {
      const response = await apiClient.get(`/api/landlord/properties/${propertyId}`);
      const property = response.data?.data || response.data;
      
      setBasicInfo({
        title: property.title || '',
        address: property.address || '',
        neighborhood: property.neighborhood || '',
        city: property.city || '',
        pincode: property.pincode || '',
        propertyType: property.propertyType || 'apartment',
        configuration: property.configuration || '2bhk',
        size: property.area?.toString() || '',
        floorNumber: property.floor?.toString() || '',
        totalFloors: property.totalFloors?.toString() || '',
        latitude: property.latitude,
        longitude: property.longitude,
      });
      
      setPricing({
        rent: property.rent?.toString() || '',
        deposit: property.deposit?.toString() || '',
        maintenanceCharge: property.maintenanceCharge?.toString() || '',
        furnishing: property.furnishing || 'semi-furnished',
        availableFrom: property.availableFrom ? new Date(property.availableFrom) : new Date(),
      });
      
      setAmenitiesData({
        amenities: property.amenities || [],
        description: property.description || '',
        customAmenities: [],
      });
      
      setPhotosData({
        photos: property.photos || [],
        vrTourRequested: property.vrTourRequested || false,
      });
      
      setIsEditMode(true);
      setEditPropertyId(propertyId);
      setCurrentStep(1);
      
      console.log('[AddPropertyContext] Loaded property for edit:', propertyId);
    } catch (error) {
      console.error('[AddPropertyContext] Failed to load property:', error);
      Alert.alert('Error', 'Failed to load property. Please try again.');
    }
  }, []);

  const value: AddPropertyContextType = {
    currentStep,
    setCurrentStep,
    
    basicInfo,
    setBasicInfo,
    updateBasicInfo,
    
    pricing,
    setPricing,
    updatePricing,
    
    amenitiesData,
    setAmenitiesData,
    updateAmenities,
    toggleAmenity,
    addCustomAmenity,
    
    photosData,
    setPhotosData,
    addPhoto,
    removePhoto,
    setVRTourRequested,
    
    validateStep,
    goToNextStep,
    goToPreviousStep,
    
    draft,
    saveDraft,
    loadDraft,
    
    isSubmitting,
    submitProperty,
    
    resetForm,
    
    isEditMode,
    editPropertyId,
    loadPropertyForEdit,
  };

  return (
    <AddPropertyContext.Provider value={value}>
      {children}
    </AddPropertyContext.Provider>
  );
};

export const useAddProperty = (): AddPropertyContextType => {
  const context = useContext(AddPropertyContext);
  if (!context) {
    throw new Error('useAddProperty must be used within an AddPropertyProvider');
  }
  return context;
};

export default AddPropertyContext;
