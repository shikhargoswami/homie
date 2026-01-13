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
import Slider from '@react-native-community/slider';

interface TenantPreferences {
  searchType: 'full_home' | 'room_sharing';
  name: string;
  budgetMin: string;
  budgetMax: string;
  preferredLocations: string[];
  moveInDate: string;
  employmentStatus: 'employed' | 'self_employed' | 'student' | 'other';
  // Full home specific
  propertyType?: ('apartment' | 'house' | 'villa' | 'studio')[];
  configuration?: ('1bhk' | '2bhk' | '3bhk' | '4bhk+')[];
  furnishing?: ('unfurnished' | 'semi_furnished' | 'fully_furnished')[];
  // Room sharing specific
  genderPreference?: 'any' | 'male' | 'female';
  lifestylePreferences?: string[];
}

interface Props {
  searchType: 'full_home' | 'room_sharing';
  onComplete: (preferences: TenantPreferences) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const LOCATIONS = [
  'Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield',
  'Marathahalli', 'Electronic City', 'Jayanagar', 'Malleshwaram',
  'JP Nagar', 'BTM Layout', 'Bellandur', 'Sarjapur Road',
];

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: 'business' },
  { id: 'house', label: 'House', icon: 'home' },
  { id: 'villa', label: 'Villa', icon: 'home-sharp' },
  { id: 'studio', label: 'Studio', icon: 'cube' },
];

const CONFIGURATIONS = [
  { id: '1bhk', label: '1 BHK' },
  { id: '2bhk', label: '2 BHK' },
  { id: '3bhk', label: '3 BHK' },
  { id: '4bhk+', label: '4+ BHK' },
];

const FURNISHING_OPTIONS = [
  { id: 'unfurnished', label: 'Unfurnished' },
  { id: 'semi_furnished', label: 'Semi-Furnished' },
  { id: 'fully_furnished', label: 'Fully Furnished' },
];

const LIFESTYLE_PREFERENCES = [
  { id: 'non_smoker', label: 'Non-Smoker', icon: 'ban' },
  { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
  { id: 'early_riser', label: 'Early Riser', icon: 'sunny' },
  { id: 'night_owl', label: 'Night Owl', icon: 'moon' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: 'paw' },
  { id: 'work_from_home', label: 'Work from Home', icon: 'laptop' },
  { id: 'social', label: 'Social', icon: 'people' },
  { id: 'quiet', label: 'Quiet', icon: 'volume-mute' },
];

export const TenantOnboardingScreen: React.FC<Props> = ({
  searchType,
  onComplete,
  onBack,
  isLoading,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = searchType === 'full_home' ? 4 : 5;
  
  const [name, setName] = useState('');
  const [budgetMin, setBudgetMin] = useState(15000);
  const [budgetMax, setBudgetMax] = useState(50000);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [employmentStatus, setEmploymentStatus] = useState<'employed' | 'self_employed' | 'student' | 'other'>('employed');
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [configurations, setConfigurations] = useState<string[]>([]);
  const [furnishing, setFurnishing] = useState<string[]>([]);
  const [genderPreference, setGenderPreference] = useState<'any' | 'male' | 'female'>('any');
  const [lifestylePreferences, setLifestylePreferences] = useState<string[]>([]);

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

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!name.trim()) {
          Alert.alert('Required', 'Please enter your name');
          return false;
        }
        return true;
      case 2:
        if (budgetMin < 5000) {
          Alert.alert('Invalid Budget', 'Minimum budget should be at least ₹5,000');
          return false;
        }
        if (budgetMax < budgetMin) {
          Alert.alert('Invalid Budget', 'Maximum budget should be greater than minimum');
          return false;
        }
        return true;
      case 3:
        if (selectedLocations.length === 0) {
          Alert.alert('Required', 'Please select at least one preferred location');
          return false;
        }
        return true;
      case 4:
        if (searchType === 'full_home') {
          if (propertyTypes.length === 0) {
            Alert.alert('Required', 'Please select at least one property type');
            return false;
          }
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
    const preferences: TenantPreferences = {
      searchType,
      name: name.trim(),
      budgetMin: String(budgetMin),
      budgetMax: String(budgetMax),
      preferredLocations: selectedLocations,
      moveInDate: new Date().toISOString(),
      employmentStatus,
    };

    if (searchType === 'full_home') {
      preferences.propertyType = propertyTypes as any;
      preferences.configuration = configurations as any;
      preferences.furnishing = furnishing as any;
    } else {
      preferences.genderPreference = genderPreference;
      preferences.lifestylePreferences = lifestylePreferences;
    }

    onComplete(preferences);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="person-circle" size={48} color="#6366f1" />
        <Text style={styles.stepTitle}>What's your name?</Text>
        <Text style={styles.stepSubtitle}>Help landlords know who you are</Text>
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoFocus
      />

      <View style={styles.employmentSection}>
        <Text style={styles.sectionLabel}>Employment Status</Text>
        <View style={styles.employmentOptions}>
          {[
            { id: 'employed', label: 'Employed' },
            { id: 'self_employed', label: 'Self-Employed' },
            { id: 'student', label: 'Student' },
            { id: 'other', label: 'Other' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.employmentChip,
                employmentStatus === option.id && styles.employmentChipSelected,
              ]}
              onPress={() => setEmploymentStatus(option.id as any)}
            >
              <Text
                style={[
                  styles.employmentChipText,
                  employmentStatus === option.id && styles.employmentChipTextSelected,
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

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="wallet" size={48} color="#14b8a6" />
        <Text style={styles.stepTitle}>What's your budget?</Text>
        <Text style={styles.stepSubtitle}>Set your monthly rent range</Text>
      </View>

      {/* Budget Display */}
      <View style={styles.budgetDisplay}>
        <Text style={styles.budgetDisplayText}>
          {formatCurrency(budgetMin)} - {formatCurrency(budgetMax)}
        </Text>
        <Text style={styles.budgetDisplaySubtext}>per month</Text>
      </View>

      {/* Min Budget Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Minimum Budget</Text>
          <Text style={styles.sliderValue}>{formatCurrency(budgetMin)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={5000}
          maximumValue={150000}
          step={5000}
          value={budgetMin}
          onValueChange={(value) => {
            setBudgetMin(value);
            if (value > budgetMax) {
              setBudgetMax(value);
            }
          }}
          minimumTrackTintColor="#14b8a6"
          maximumTrackTintColor="#e5e7eb"
          thumbTintColor="#14b8a6"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderMinMax}>₹5K</Text>
          <Text style={styles.sliderMinMax}>₹1.5L</Text>
        </View>
      </View>

      {/* Max Budget Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Maximum Budget</Text>
          <Text style={styles.sliderValue}>{formatCurrency(budgetMax)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={5000}
          maximumValue={200000}
          step={5000}
          value={budgetMax}
          onValueChange={(value) => {
            setBudgetMax(value);
            if (value < budgetMin) {
              setBudgetMin(value);
            }
          }}
          minimumTrackTintColor="#6366f1"
          maximumTrackTintColor="#e5e7eb"
          thumbTintColor="#6366f1"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderMinMax}>₹5K</Text>
          <Text style={styles.sliderMinMax}>₹2L</Text>
        </View>
      </View>

      <View style={styles.budgetTips}>
        <Text style={styles.tipsTitle}>💡 Budget Tips</Text>
        <Text style={styles.tipsText}>
          • 1 BHK: ₹15,000 - ₹35,000{'\n'}
          • 2 BHK: ₹25,000 - ₹55,000{'\n'}
          • 3 BHK: ₹40,000 - ₹80,000
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="location" size={48} color="#f59e0b" />
        <Text style={styles.stepTitle}>Preferred Locations</Text>
        <Text style={styles.stepSubtitle}>Select areas you'd like to live in</Text>
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
    </View>
  );

  const renderFullHomeStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="home" size={48} color="#6366f1" />
        <Text style={styles.stepTitle}>Property Preferences</Text>
        <Text style={styles.stepSubtitle}>What type of home are you looking for?</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.preferenceSection}>
          <Text style={styles.sectionLabel}>Property Type</Text>
          <View style={styles.optionsRow}>
            {PROPERTY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.propertyTypeCard,
                  propertyTypes.includes(type.id) && styles.propertyTypeCardSelected,
                ]}
                onPress={() => toggleSelection(type.id, propertyTypes, setPropertyTypes)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={propertyTypes.includes(type.id) ? '#6366f1' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.propertyTypeLabel,
                    propertyTypes.includes(type.id) && styles.propertyTypeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.preferenceSection}>
          <Text style={styles.sectionLabel}>Configuration</Text>
          <View style={styles.chipRow}>
            {CONFIGURATIONS.map((config) => (
              <TouchableOpacity
                key={config.id}
                style={[
                  styles.configChip,
                  configurations.includes(config.id) && styles.configChipSelected,
                ]}
                onPress={() => toggleSelection(config.id, configurations, setConfigurations)}
              >
                <Text
                  style={[
                    styles.configChipText,
                    configurations.includes(config.id) && styles.configChipTextSelected,
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.preferenceSection}>
          <Text style={styles.sectionLabel}>Furnishing</Text>
          <View style={styles.chipRow}>
            {FURNISHING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.furnishingChip,
                  furnishing.includes(option.id) && styles.furnishingChipSelected,
                ]}
                onPress={() => toggleSelection(option.id, furnishing, setFurnishing)}
              >
                <Text
                  style={[
                    styles.furnishingChipText,
                    furnishing.includes(option.id) && styles.furnishingChipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderRoomSharingStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="people" size={48} color="#14b8a6" />
        <Text style={styles.stepTitle}>Flatmate Preferences</Text>
        <Text style={styles.stepSubtitle}>Who would you like to share with?</Text>
      </View>

      <View style={styles.genderSection}>
        <Text style={styles.sectionLabel}>Preferred Gender</Text>
        <View style={styles.genderOptions}>
          {[
            { id: 'any', label: 'Any', icon: 'people' },
            { id: 'male', label: 'Male', icon: 'man' },
            { id: 'female', label: 'Female', icon: 'woman' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.genderCard,
                genderPreference === option.id && styles.genderCardSelected,
              ]}
              onPress={() => setGenderPreference(option.id as any)}
            >
              <Ionicons
                name={option.icon as any}
                size={28}
                color={genderPreference === option.id ? '#14b8a6' : '#6b7280'}
              />
              <Text
                style={[
                  styles.genderLabel,
                  genderPreference === option.id && styles.genderLabelSelected,
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

  const renderRoomSharingStep5 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Ionicons name="heart" size={48} color="#ec4899" />
        <Text style={styles.stepTitle}>Your Lifestyle</Text>
        <Text style={styles.stepSubtitle}>Help us find compatible flatmates</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.lifestyleGrid}>
          {LIFESTYLE_PREFERENCES.map((pref) => (
            <TouchableOpacity
              key={pref.id}
              style={[
                styles.lifestyleCard,
                lifestylePreferences.includes(pref.id) && styles.lifestyleCardSelected,
              ]}
              onPress={() => toggleSelection(pref.id, lifestylePreferences, setLifestylePreferences)}
            >
              <Ionicons
                name={pref.icon as any}
                size={24}
                color={lifestylePreferences.includes(pref.id) ? '#ec4899' : '#6b7280'}
              />
              <Text
                style={[
                  styles.lifestyleLabel,
                  lifestylePreferences.includes(pref.id) && styles.lifestyleLabelSelected,
                ]}
              >
                {pref.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
        return searchType === 'full_home' ? renderFullHomeStep4() : renderRoomSharingStep4();
      case 5:
        return renderRoomSharingStep5();
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
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  employmentSection: {
    marginTop: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  employmentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  employmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  employmentChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  employmentChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  employmentChipTextSelected: {
    color: '#fff',
  },
  budgetDisplay: {
    backgroundColor: '#f0fdfa',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  budgetDisplayText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0d9488',
  },
  budgetDisplaySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14b8a6',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderMinMax: {
    fontSize: 12,
    color: '#9ca3af',
  },
  budgetTips: {
    marginTop: 16,
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 22,
  },
  locationsScroll: {
    maxHeight: 300,
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
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
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
  },
  preferenceSection: {
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  propertyTypeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  propertyTypeCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f0ff',
  },
  propertyTypeLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
  propertyTypeLabelSelected: {
    color: '#6366f1',
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  configChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  configChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  configChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  configChipTextSelected: {
    color: '#fff',
  },
  furnishingChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  furnishingChipSelected: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  furnishingChipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  furnishingChipTextSelected: {
    color: '#fff',
  },
  genderSection: {
    marginBottom: 24,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderCardSelected: {
    borderColor: '#14b8a6',
    backgroundColor: '#f0fdfa',
  },
  genderLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  genderLabelSelected: {
    color: '#14b8a6',
    fontWeight: '500',
  },
  lifestyleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  lifestyleCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 10,
  },
  lifestyleCardSelected: {
    borderColor: '#ec4899',
    backgroundColor: '#fdf2f8',
  },
  lifestyleLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  lifestyleLabelSelected: {
    color: '#ec4899',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
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

export default TenantOnboardingScreen;
