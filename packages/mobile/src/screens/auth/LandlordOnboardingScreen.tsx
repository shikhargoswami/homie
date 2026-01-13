import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const totalSteps = 4;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [propertiesCount, setPropertiesCount] = useState<'single' | 'multiple' | 'agency' | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [experience, setExperience] = useState<'new' | 'experienced' | 'professional'>('experienced');

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
        if (!propertiesCount) {
          Alert.alert('Required', 'Please select your property ownership type');
          return false;
        }
        return true;
      case 3:
        if (propertyTypes.length === 0) {
          Alert.alert('Required', 'Please select at least one property type');
          return false;
        }
        return true;
      case 4:
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
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
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
});

export default LandlordOnboardingScreen;
