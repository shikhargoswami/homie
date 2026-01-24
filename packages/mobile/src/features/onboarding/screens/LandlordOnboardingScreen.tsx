import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';

interface VerificationStatus {
  phoneVerified: boolean;
  emailVerified: boolean;
  idVerified: boolean;
  propertyOwnershipVerified: boolean;
  verificationLevel: string;
  trustScore: number;
}

interface LandlordProfile {
  name: string;
  email: string;
  propertiesCount: 'single' | 'multiple' | 'agency';
  propertyTypes: string[];
  locations: string[];
  experience: 'new' | 'experienced' | 'professional';
}

interface Props {
  onComplete: (profile: LandlordProfile) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: 'business' },
  { id: 'house', label: 'House', icon: 'home' },
  { id: 'villa', label: 'Villa', icon: 'home-sharp' },
  { id: 'pg', label: 'PG/Hostel', icon: 'bed' },
];

const LOCATIONS = [
  'Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield',
  'Marathahalli', 'Electronic City', 'Jayanagar', 'Malleshwaram',
  'JP Nagar', 'BTM Layout', 'Bellandur', 'Sarjapur Road',
];

export const LandlordOnboardingScreen: React.FC<Props> = ({
  onComplete,
  onBack,
  isLoading,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // Updated from 4 to 5 to include verification step

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [propertiesCount, setPropertiesCount] = useState<'single' | 'multiple' | 'agency' | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [experience, setExperience] = useState<'new' | 'experienced' | 'professional'>('experienced');

  // Verification state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    phoneVerified: true, // Always true via OTP login
    emailVerified: false,
    idVerified: false,
    propertyOwnershipVerified: false,
    verificationLevel: 'basic',
    trustScore: 20,
  });
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [idDocumentType, setIdDocumentType] = useState<'aadhar' | 'pan' | null>(null);
  const [idDocumentNumber, setIdDocumentNumber] = useState('');
  const [showIdInput, setShowIdInput] = useState(false);
  const [showPropertyUpload, setShowPropertyUpload] = useState(false);

  const toggleSelection = (
    item: string,
    selectedItems: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedItems.includes(item)) {
      setItems(selectedItems.filter(i => i !== item));
    } else {
      setItems([...selectedItems, item]);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!name.trim()) {
          Alert.alert('Required', 'Please enter your name');
          return false;
        }
        if (email && !validateEmail(email)) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          return false;
        }
        return true;
      case 2:
        // Verification step - always valid (can be skipped)
        return true;
      case 3:
        if (!propertiesCount) {
          Alert.alert('Required', 'Please select your property ownership type');
          return false;
        }
        return true;
      case 4:
        if (propertyTypes.length === 0) {
          Alert.alert('Required', 'Please select at least one property type');
          return false;
        }
        return true;
      case 5:
        if (selectedLocations.length === 0) {
          Alert.alert('Required', 'Please select at least one location');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleComplete = () => {
    const profile: LandlordProfile = {
      name: name.trim(),
      email: email.trim(),
      propertiesCount: propertiesCount!,
      propertyTypes,
      locations: selectedLocations,
      experience,
    };
    onComplete(profile);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="person-circle" size={48} color="#f59e0b" />
        <Text style={styles.stepTitle}>Welcome, Property Owner!</Text>
        <Text style={styles.stepSubtitle}>Let's set up your landlord profile</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your Name *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.inputHint}>
          We'll send you notifications about tenant inquiries
        </Text>
      </View>

      <View style={styles.experienceSection}>
        <Text style={styles.sectionLabel}>Landlord Experience</Text>
        <View style={styles.experienceOptions}>
          {[
            { id: 'new', label: 'New to Renting', icon: 'star' },
            { id: 'experienced', label: 'Experienced', icon: 'trophy' },
            { id: 'professional', label: 'Property Manager', icon: 'briefcase' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.experienceCard,
                experience === option.id && styles.experienceCardSelected,
              ]}
              onPress={() => setExperience(option.id as any)}
            >
              <Ionicons
                name={option.icon as any}
                size={20}
                color={experience === option.id ? '#f59e0b' : '#6b7280'}
              />
              <Text
                style={[
                  styles.experienceLabel,
                  experience === option.id && styles.experienceLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Verification helper functions
  const handleSendEmailOtp = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address in Step 1');
      return;
    }
    
    setVerificationLoading(true);
    try {
      await apiClient.post('/api/landlord/verification/email/send', { email });
      setEmailOtpSent(true);
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to send verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    
    setVerificationLoading(true);
    try {
      const response = await apiClient.post('/api/landlord/verification/email/verify', { otp: emailOtp });
      if (response.data?.data?.verification) {
        setVerificationStatus(response.data.data.verification);
      }
      setEmailOtpSent(false);
      setEmailOtp('');
      Alert.alert('Success', 'Email verified successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyId = async () => {
    if (!idDocumentType || !idDocumentNumber) {
      Alert.alert('Error', 'Please select document type and enter number');
      return;
    }
    
    setVerificationLoading(true);
    try {
      const response = await apiClient.post('/api/landlord/verification/id', {
        documentType: idDocumentType,
        documentNumber: idDocumentNumber.toUpperCase().replace(/\s/g, ''),
      });
      if (response.data?.data?.verification) {
        setVerificationStatus(response.data.data.verification);
      }
      setShowIdInput(false);
      setIdDocumentNumber('');
      setIdDocumentType(null);
      Alert.alert('Success', 'ID verified successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'ID verification failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleUploadPropertyDocs = async () => {
    // In production, this would open document picker
    // For MVP, simulate document upload
    setVerificationLoading(true);
    try {
      const response = await apiClient.post('/api/landlord/verification/property-docs', {
        documentUrls: ['placeholder-doc-url'],
        documentType: 'electricity_bill',
      });
      if (response.data?.data?.verification) {
        setVerificationStatus(response.data.data.verification);
      }
      setShowPropertyUpload(false);
      Alert.alert('Success', 'Property documents submitted!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Document upload failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSkipVerification = async () => {
    try {
      await apiClient.post('/api/landlord/verification/skip');
    } catch {
      // Silently fail - we'll continue anyway
    }
    setCurrentStep(currentStep + 1);
  };

  const renderVerificationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="shield-checkmark" size={48} color="#10b981" />
        <Text style={styles.stepTitle}>Get Verified & Build Trust 🛡️</Text>
        <Text style={styles.stepSubtitle}>
          Verified landlords get 3x more tenant matches
        </Text>
      </View>

      <ScrollView style={styles.verificationScroll} showsVerticalScrollIndicator={false}>
        {/* Phone Verified - Always done */}
        <View style={[styles.verificationCard, styles.verificationCardDone]}>
          <View style={styles.verificationCardHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <View style={styles.verificationCardContent}>
              <Text style={styles.verificationCardTitle}>Phone Verified</Text>
              <Text style={styles.verificationCardDesc}>Verified via OTP</Text>
            </View>
            <Text style={styles.verificationBadgeDone}>Done</Text>
          </View>
        </View>

        {/* Email Verification */}
        <View style={[
          styles.verificationCard,
          verificationStatus.emailVerified && styles.verificationCardDone
        ]}>
          <View style={styles.verificationCardHeader}>
            <Ionicons 
              name={verificationStatus.emailVerified ? "checkmark-circle" : "mail"} 
              size={24} 
              color={verificationStatus.emailVerified ? "#10b981" : "#6366f1"} 
            />
            <View style={styles.verificationCardContent}>
              <Text style={styles.verificationCardTitle}>Email Verification</Text>
              <Text style={styles.verificationCardDesc}>
                {verificationStatus.emailVerified 
                  ? 'Email verified' 
                  : email 
                    ? `Verify ${email}` 
                    : 'Add email in previous step'}
              </Text>
            </View>
            {verificationStatus.emailVerified && (
              <Text style={styles.verificationBadgeDone}>Done</Text>
            )}
          </View>
          
          {!verificationStatus.emailVerified && email && (
            <View style={styles.verificationCardActions}>
              {!emailOtpSent ? (
                <TouchableOpacity 
                  style={styles.verificationBtn}
                  onPress={handleSendEmailOtp}
                  disabled={verificationLoading}
                >
                  {verificationLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.verificationBtnText}>Verify Email</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter 6-digit OTP"
                    value={emailOtp}
                    onChangeText={setEmailOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity 
                    style={styles.verificationBtnSmall}
                    onPress={handleVerifyEmailOtp}
                    disabled={verificationLoading}
                  >
                    {verificationLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.verificationBtnText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ID Verification */}
        <View style={[
          styles.verificationCard,
          verificationStatus.idVerified && styles.verificationCardDone
        ]}>
          <View style={styles.verificationCardHeader}>
            <Ionicons 
              name={verificationStatus.idVerified ? "checkmark-circle" : "card"} 
              size={24} 
              color={verificationStatus.idVerified ? "#10b981" : "#f59e0b"} 
            />
            <View style={styles.verificationCardContent}>
              <Text style={styles.verificationCardTitle}>ID Verification (Recommended)</Text>
              <Text style={styles.verificationCardDesc}>
                {verificationStatus.idVerified 
                  ? 'ID verified' 
                  : 'Upload Aadhar/PAN for instant trust'}
              </Text>
            </View>
            {verificationStatus.idVerified && (
              <Text style={styles.verificationBadgeDone}>Done</Text>
            )}
          </View>
          
          {!verificationStatus.idVerified && (
            <View style={styles.verificationCardActions}>
              {!showIdInput ? (
                <TouchableOpacity 
                  style={[styles.verificationBtn, { backgroundColor: '#f59e0b' }]}
                  onPress={() => setShowIdInput(true)}
                >
                  <Text style={styles.verificationBtnText}>Verify ID</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.idInputContainer}>
                  <View style={styles.idTypeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.idTypeBtn,
                        idDocumentType === 'aadhar' && styles.idTypeBtnSelected
                      ]}
                      onPress={() => setIdDocumentType('aadhar')}
                    >
                      <Text style={[
                        styles.idTypeBtnText,
                        idDocumentType === 'aadhar' && styles.idTypeBtnTextSelected
                      ]}>Aadhar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.idTypeBtn,
                        idDocumentType === 'pan' && styles.idTypeBtnSelected
                      ]}
                      onPress={() => setIdDocumentType('pan')}
                    >
                      <Text style={[
                        styles.idTypeBtnText,
                        idDocumentType === 'pan' && styles.idTypeBtnTextSelected
                      ]}>PAN</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.idNumberInput}
                    placeholder={idDocumentType === 'aadhar' ? '12-digit Aadhar' : 'PAN (e.g. ABCDE1234F)'}
                    value={idDocumentNumber}
                    onChangeText={setIdDocumentNumber}
                    autoCapitalize="characters"
                    maxLength={idDocumentType === 'aadhar' ? 12 : 10}
                  />
                  <TouchableOpacity 
                    style={[styles.verificationBtn, { backgroundColor: '#f59e0b' }]}
                    onPress={handleVerifyId}
                    disabled={verificationLoading}
                  >
                    {verificationLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.verificationBtnText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Property Ownership Verification */}
        <View style={[
          styles.verificationCard,
          verificationStatus.propertyOwnershipVerified && styles.verificationCardDone
        ]}>
          <View style={styles.verificationCardHeader}>
            <Ionicons 
              name={verificationStatus.propertyOwnershipVerified ? "checkmark-circle" : "document-text"} 
              size={24} 
              color={verificationStatus.propertyOwnershipVerified ? "#10b981" : "#8b5cf6"} 
            />
            <View style={styles.verificationCardContent}>
              <Text style={styles.verificationCardTitle}>Property Ownership Proof</Text>
              <Text style={styles.verificationCardDesc}>
                {verificationStatus.propertyOwnershipVerified 
                  ? 'Documents verified' 
                  : 'Upload docs for "Verified Owner" badge'}
              </Text>
            </View>
            {verificationStatus.propertyOwnershipVerified && (
              <Text style={styles.verificationBadgeDone}>Done</Text>
            )}
          </View>
          
          {!verificationStatus.propertyOwnershipVerified && (
            <View style={styles.verificationCardActions}>
              <TouchableOpacity 
                style={[styles.verificationBtn, { backgroundColor: '#8b5cf6' }]}
                onPress={handleUploadPropertyDocs}
                disabled={verificationLoading}
              >
                {verificationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.verificationBtnText}>Upload Documents</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Trust Score Display */}
        <View style={styles.trustScoreCard}>
          <Text style={styles.trustScoreLabel}>Your Trust Score</Text>
          <View style={styles.trustScoreBar}>
            <View style={[styles.trustScoreFill, { width: `${verificationStatus.trustScore}%` }]} />
          </View>
          <Text style={styles.trustScoreValue}>{verificationStatus.trustScore}/100</Text>
        </View>

        {/* Skip Option */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkipVerification}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="home" size={48} color="#6366f1" />
        <Text style={styles.stepTitle}>Property Portfolio</Text>
        <Text style={styles.stepSubtitle}>How many properties do you own?</Text>
      </View>

      <View style={styles.portfolioOptions}>
        <TouchableOpacity
          style={[
            styles.portfolioCard,
            propertiesCount === 'single' && styles.portfolioCardSelected,
          ]}
          onPress={() => setPropertiesCount('single')}
        >
          <View style={[styles.portfolioIcon, propertiesCount === 'single' && styles.portfolioIconSelected]}>
            <Ionicons
              name="home"
              size={32}
              color={propertiesCount === 'single' ? '#fff' : '#6b7280'}
            />
          </View>
          <Text style={styles.portfolioTitle}>Single Property</Text>
          <Text style={styles.portfolioDesc}>I have 1 property to rent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.portfolioCard,
            propertiesCount === 'multiple' && styles.portfolioCardSelected,
          ]}
          onPress={() => setPropertiesCount('multiple')}
        >
          <View style={[styles.portfolioIcon, propertiesCount === 'multiple' && styles.portfolioIconSelected]}>
            <Ionicons
              name="business"
              size={32}
              color={propertiesCount === 'multiple' ? '#fff' : '#6b7280'}
            />
          </View>
          <Text style={styles.portfolioTitle}>Multiple Properties</Text>
          <Text style={styles.portfolioDesc}>I have 2-5 properties</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.portfolioCard,
            propertiesCount === 'agency' && styles.portfolioCardSelected,
          ]}
          onPress={() => setPropertiesCount('agency')}
        >
          <View style={[styles.portfolioIcon, propertiesCount === 'agency' && styles.portfolioIconSelected]}>
            <Ionicons
              name="business-outline"
              size={32}
              color={propertiesCount === 'agency' ? '#fff' : '#6b7280'}
            />
          </View>
          <Text style={styles.portfolioTitle}>Property Agency</Text>
          <Text style={styles.portfolioDesc}>I manage 6+ properties</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="list" size={48} color="#14b8a6" />
        <Text style={styles.stepTitle}>Property Types</Text>
        <Text style={styles.stepSubtitle}>What types of properties do you have?</Text>
      </View>

      <View style={styles.propertyTypeGrid}>
        {PROPERTY_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.propertyTypeCard,
              propertyTypes.includes(type.id) && styles.propertyTypeCardSelected,
            ]}
            onPress={() => toggleSelection(type.id, propertyTypes, setPropertyTypes)}
          >
            <View
              style={[
                styles.propertyTypeIconContainer,
                propertyTypes.includes(type.id) && styles.propertyTypeIconSelected,
              ]}
            >
              <Ionicons
                name={type.icon as any}
                size={28}
                color={propertyTypes.includes(type.id) ? '#fff' : '#6b7280'}
              />
            </View>
            <Text
              style={[
                styles.propertyTypeLabel,
                propertyTypes.includes(type.id) && styles.propertyTypeLabelSelected,
              ]}
            >
              {type.label}
            </Text>
            {propertyTypes.includes(type.id) && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={20} color="#14b8a6" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={20} color="#f59e0b" />
        <Text style={styles.tipText}>
          Select all types that apply. You can add specific properties after setup.
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="location" size={48} color="#ec4899" />
        <Text style={styles.stepTitle}>Property Locations</Text>
        <Text style={styles.stepSubtitle}>Where are your properties located?</Text>
      </View>

      <ScrollView style={styles.locationsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.locationsGrid}>
          {LOCATIONS.map((location) => (
            <TouchableOpacity
              key={location}
              style={[
                styles.locationChip,
                selectedLocations.includes(location) && styles.locationChipSelected,
              ]}
              onPress={() => toggleSelection(location, selectedLocations, setSelectedLocations)}
            >
              <Text
                style={[
                  styles.locationChipText,
                  selectedLocations.includes(location) && styles.locationChipTextSelected,
                ]}
              >
                {location}
              </Text>
              {selectedLocations.includes(location) && (
                <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedLocations.length > 0 && (
        <Text style={styles.selectionCount}>
          {selectedLocations.length} location{selectedLocations.length > 1 ? 's' : ''} selected
        </Text>
      )}

      <View style={styles.readyCard}>
        <Ionicons name="rocket" size={24} color="#6366f1" />
        <View style={styles.readyContent}>
          <Text style={styles.readyTitle}>Almost Ready!</Text>
          <Text style={styles.readyDesc}>
            After setup, you can add your first property and start receiving tenant matches.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderVerificationStep();
      case 3:
        return renderStep2();
      case 4:
        return renderStep3();
      case 5:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / totalSteps) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Step {currentStep} of {totalSteps}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollContent}>
          {renderCurrentStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
            </Text>
            <Ionicons
              name={currentStep === totalSteps ? 'checkmark' : 'arrow-forward'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    width: '100%',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
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
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  experienceSection: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  experienceOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  experienceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 6,
  },
  experienceCardSelected: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  experienceLabel: {
    fontSize: 11,
    color: '#6b7280',
    flex: 1,
  },
  experienceLabelSelected: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  portfolioOptions: {
    gap: 16,
  },
  portfolioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  portfolioCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f5f5ff',
  },
  portfolioIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  portfolioIconSelected: {
    backgroundColor: '#6366f1',
  },
  portfolioTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  portfolioDesc: {
    fontSize: 13,
    color: '#6b7280',
    position: 'absolute',
    bottom: 20,
    left: 92,
  },
  propertyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  propertyTypeCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  propertyTypeCardSelected: {
    borderColor: '#14b8a6',
    backgroundColor: '#f0fdfa',
  },
  propertyTypeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyTypeIconSelected: {
    backgroundColor: '#14b8a6',
  },
  propertyTypeLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  propertyTypeLabelSelected: {
    color: '#14b8a6',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 20,
  },
  locationsScroll: {
    maxHeight: 280,
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  locationChipSelected: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  locationChipText: {
    fontSize: 14,
    color: '#374151',
  },
  locationChipTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  selectionCount: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 13,
    marginTop: 16,
    marginBottom: 16,
  },
  readyCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f0ff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 16,
  },
  readyContent: {
    flex: 1,
  },
  readyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 4,
  },
  readyDesc: {
    fontSize: 13,
    color: '#4f46e5',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Verification Step Styles
  verificationScroll: {
    maxHeight: 480,
  },
  verificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  verificationCardDone: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  verificationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verificationCardContent: {
    flex: 1,
  },
  verificationCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  verificationCardDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  verificationBadgeDone: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verificationCardActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  verificationBtn: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  verificationBtnSmall: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  otpInputContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  idInputContainer: {
    gap: 10,
  },
  idTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  idTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  idTypeBtnSelected: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  idTypeBtnText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  idTypeBtnTextSelected: {
    color: '#92400e',
  },
  idNumberInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  trustScoreCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  trustScoreLabel: {
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '500',
    marginBottom: 8,
  },
  trustScoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trustScoreFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
  },
  trustScoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginTop: 6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
});

export default LandlordOnboardingScreen;
