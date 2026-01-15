import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PropertyWizardHeader } from '../../components/property/PropertyWizardHeader';
import { useAddProperty } from '../../contexts/AddPropertyContext';

/**
 * Add Property Step 4: Photos
 * 
 * Features:
 * - Photo upload (Min 5, Max 15)
 * - Take photo / Choose from gallery
 * - Photo tips
 * - VR Tour scheduling option
 * - Publish / Save as Draft
 */

// Conditionally import ImagePicker
let ImagePicker: typeof import('expo-image-picker') | null = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  console.log('expo-image-picker not available');
}

interface Props {
  navigation: any;
}

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 15;

export const AddPropertyStep4Screen: React.FC<Props> = ({ navigation }) => {
  const {
    photosData,
    addPhoto,
    removePhoto,
    setVRTourRequested,
    goToPreviousStep,
    saveDraft,
    draft,
    submitProperty,
    isSubmitting,
    isEditMode,
  } = useAddProperty();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [publishedPropertyId, setPublishedPropertyId] = useState<string | null>(null);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);

  const handleBack = () => {
    goToPreviousStep();
    navigation.goBack();
  };

  const handleTakePhoto = async () => {
    setShowImageSourceModal(false);
    
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Camera is not available on this device.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets[0]) {
      addPhoto(result.assets[0].uri);
    }
  };

  const handleChooseFromGallery = async () => {
    setShowImageSourceModal(false);
    
    if (!ImagePicker) {
      Alert.alert('Not Available', 'Gallery access is not available on this device.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow gallery access to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [16, 9],
      selectionLimit: MAX_PHOTOS - photosData.photos.length,
    });

    if (!result.canceled) {
      result.assets.forEach((asset) => {
        if (photosData.photos.length < MAX_PHOTOS) {
          addPhoto(asset.uri);
        }
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePhoto(index) },
      ]
    );
  };

  const handlePublish = async () => {
    if (photosData.photos.length < MIN_PHOTOS) {
      Alert.alert('More Photos Needed', `Please add at least ${MIN_PHOTOS} photos to publish your property.`);
      return;
    }

    const result = await submitProperty();
    
    if (result.success) {
      setPublishedPropertyId(result.propertyId || null);
      setShowSuccessModal(true);
    } else {
      Alert.alert('Error', result.error || 'Failed to publish property. Please try again.');
    }
  };

  const handleViewProperty = () => {
    setShowSuccessModal(false);
    if (publishedPropertyId) {
      navigation.reset({
        index: 0,
        routes: [
          { name: 'LandlordTabs' },
          { name: 'PropertyDetail', params: { propertyId: publishedPropertyId } },
        ],
      });
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'LandlordTabs' }],
    });
  };

  const renderImageSourceModal = () => (
    <Modal
      visible={showImageSourceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowImageSourceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sourceModalContainer}>
          <Text style={styles.sourceModalTitle}>Add Photo</Text>
          
          <TouchableOpacity style={styles.sourceOption} onPress={handleTakePhoto}>
            <View style={styles.sourceIconContainer}>
              <Ionicons name="camera" size={28} color="#6366f1" />
            </View>
            <View style={styles.sourceTextContainer}>
              <Text style={styles.sourceOptionTitle}>Take Photo</Text>
              <Text style={styles.sourceOptionSubtitle}>Use camera to capture</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sourceOption} onPress={handleChooseFromGallery}>
            <View style={styles.sourceIconContainer}>
              <Ionicons name="images" size={28} color="#6366f1" />
            </View>
            <View style={styles.sourceTextContainer}>
              <Text style={styles.sourceOptionTitle}>Choose from Gallery</Text>
              <Text style={styles.sourceOptionSubtitle}>Select from your photos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sourceModalCancel}
            onPress={() => setShowImageSourceModal(false)}
          >
            <Text style={styles.sourceModalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={handleGoToDashboard}
    >
      <View style={styles.successOverlay}>
        <View style={styles.successContainer}>
          {/* Celebration Icon */}
          <View style={styles.celebrationIcon}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </View>

          <Text style={styles.successTitle}>Property Published!</Text>
          
          <Text style={styles.successMessage}>
            Your property is now live and visible to thousands of verified tenants.
          </Text>

          <View style={styles.whatNextContainer}>
            <Text style={styles.whatNextTitle}>What happens next:</Text>
            <View style={styles.whatNextItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.whatNextText}>AI will match you with compatible tenants</Text>
            </View>
            <View style={styles.whatNextItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.whatNextText}>You'll get notifications when tenants like it</Text>
            </View>
            <View style={styles.whatNextItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.whatNextText}>You can review tenant profiles before responding</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.successPrimaryButton} onPress={handleViewProperty}>
            <Text style={styles.successPrimaryButtonText}>View My Property</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.successSecondaryButton} onPress={handleGoToDashboard}>
            <Text style={styles.successSecondaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
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
        currentStep={4}
        totalSteps={4}
        stepTitle="Photos"
        onBack={handleBack}
        onSaveDraft={saveDraft}
        isFirstStep={false}
        isSavingDraft={draft.isSaving}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>
          Add Property Photos (Min {MIN_PHOTOS}, Max {MAX_PHOTOS})
        </Text>

        {/* Photos Grid */}
        <View style={styles.photosGrid}>
          {photosData.photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => handleRemovePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.photoNumber}>
                <Text style={styles.photoNumberText}>{index + 1}</Text>
              </View>
            </View>
          ))}

          {/* Add Photo Button */}
          {photosData.photos.length < MAX_PHOTOS && (
            <TouchableOpacity 
              style={styles.addPhotoContainer}
              onPress={() => setShowImageSourceModal(true)}
            >
              <Ionicons name="add" size={32} color="#6366f1" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo Count */}
        <Text style={[
          styles.photoCount,
          photosData.photos.length < MIN_PHOTOS && styles.photoCountWarning,
        ]}>
          {photosData.photos.length}/{MAX_PHOTOS} photos added
          {photosData.photos.length < MIN_PHOTOS && ` (minimum ${MIN_PHOTOS} required)`}
        </Text>

        {/* Quick Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTakePhoto}
          >
            <Ionicons name="camera-outline" size={20} color="#6366f1" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleChooseFromGallery}
          >
            <Ionicons name="images-outline" size={20} color="#6366f1" />
            <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Tips */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={18} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Photo Tips:</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="#10b981" />
              <Text style={styles.tipText}>Good lighting, clean rooms</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="#10b981" />
              <Text style={styles.tipText}>Show all rooms (living, bedrooms, kitchen, bath)</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color="#10b981" />
              <Text style={styles.tipText}>Include amenities (gym, parking, etc.)</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.tipText}>Avoid blurry or dark photos</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* VR Tour Option */}
        <View style={styles.vrTourContainer}>
          <View style={styles.vrTourHeader}>
            <Ionicons name="videocam" size={24} color="#6366f1" />
            <View style={styles.vrTourTextContainer}>
              <Text style={styles.vrTourTitle}>Want a VR Tour?</Text>
              <Text style={styles.vrTourSubtitle}>Professional 360° tour increases views by 3x</Text>
            </View>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.vrTourButton,
              photosData.vrTourRequested && styles.vrTourButtonActive,
            ]}
            onPress={() => setVRTourRequested(!photosData.vrTourRequested)}
          >
            <Ionicons 
              name="calendar-outline" 
              size={20} 
              color={photosData.vrTourRequested ? '#fff' : '#6366f1'} 
            />
            <Text style={[
              styles.vrTourButtonText,
              photosData.vrTourRequested && styles.vrTourButtonTextActive,
            ]}>
              {photosData.vrTourRequested 
                ? 'VR Photoshoot Requested ✓' 
                : 'Schedule VR Photoshoot - ₹4,999'
              }
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.vrTourNote}>
            We'll send a photographer to your property
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.publishButton,
            (isSubmitting || photosData.photos.length < MIN_PHOTOS) && styles.publishButtonDisabled,
          ]}
          onPress={handlePublish}
          disabled={isSubmitting || photosData.photos.length < MIN_PHOTOS}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.publishButtonText}>
                {isEditMode ? 'Update Property' : 'Publish Property'} 🎉
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveDraftButton}
          onPress={saveDraft}
          disabled={draft.isSaving}
        >
          <Text style={styles.saveDraftButtonText}>
            {draft.isSaving ? 'Saving...' : 'Save as Draft'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderImageSourceModal()}
      {renderSuccessModal()}
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoContainer: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  photoNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  photoNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addPhotoContainer: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  addPhotoText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  photoCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  photoCountWarning: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    backgroundColor: '#f8fafc',
  },
  actionButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  tipsContainer: {
    marginTop: 24,
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
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#78350f',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  vrTourContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  vrTourHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  vrTourTextContainer: {
    flex: 1,
  },
  vrTourTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  vrTourSubtitle: {
    fontSize: 13,
    color: '#15803d',
    marginTop: 2,
  },
  recommendedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
  },
  vrTourButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6366f1',
    backgroundColor: '#fff',
  },
  vrTourButtonActive: {
    backgroundColor: '#6366f1',
  },
  vrTourButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  vrTourButtonTextActive: {
    color: '#fff',
  },
  vrTourNote: {
    fontSize: 12,
    color: '#166534',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  publishButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveDraftButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveDraftButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  // Image Source Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sourceModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  sourceModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 16,
  },
  sourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceTextContainer: {
    flex: 1,
  },
  sourceOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  sourceOptionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  sourceModalCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sourceModalCancelText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  celebrationEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  whatNextContainer: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  whatNextTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  whatNextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  whatNextText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
  },
  successPrimaryButton: {
    width: '100%',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  successPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successSecondaryButton: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  successSecondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AddPropertyStep4Screen;
