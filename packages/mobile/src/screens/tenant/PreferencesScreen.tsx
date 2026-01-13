import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@services/api';

/**
 * Preferences Screen
 * 
 * Allows tenants to set their property preferences for matching:
 * - Budget range
 * - Location preferences
 * - BHK type
 * - Furnishing preference
 * - Move-in date
 * - Amenities
 * - Nice-to-haves
 */

interface PreferencesData {
  nonNegotiables: {
    budget: { min: number; max: number };
    location: string;
    bhkType: string[];
    furnishing: 'unfurnished' | 'semi_furnished' | 'fully_furnished' | 'any';
    moveInDate: string;
  };
  mustHaves: {
    amenities: string[];
    homeOfficeSpace?: boolean;
    gatedCommunity?: boolean;
    maxCommute?: number;
  };
  niceToHaves: {
    petFriendly?: boolean;
    balconyPreference?: boolean;
    aestheticPreference?: 'modern' | 'traditional' | 'minimalist' | 'cozy';
    communityVibe?: 'social' | 'quiet' | 'family' | 'young_professionals';
  };
}

const BHK_OPTIONS = ['1bhk', '2bhk', '3bhk', '4bhk'];
const FURNISHING_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'fully_furnished', label: 'Fully Furnished' },
];
const AMENITIES = [
  'parking', 'gym', 'swimming_pool', 'security', 'power_backup',
  'lift', 'garden', 'club_house', 'children_play_area', 'wifi',
];

interface Props {
  navigation: any;
  route?: any;
}

export const PreferencesScreen: React.FC<Props> = ({ navigation, route }) => {
  const isOnboarding = route?.params?.isOnboarding ?? false;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [preferences, setPreferences] = useState<PreferencesData>({
    nonNegotiables: {
      budget: { min: 10000, max: 50000 },
      location: '',
      bhkType: ['2bhk'],
      furnishing: 'any',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    mustHaves: {
      amenities: [],
      homeOfficeSpace: false,
      gatedCommunity: false,
    },
    niceToHaves: {
      petFriendly: false,
      balconyPreference: false,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { preferences: PreferencesData } }>(
        '/api/users/preferences'
      );
      if (response.success && response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.log('No existing preferences found, using defaults');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences.nonNegotiables.location) {
      Alert.alert('Missing Information', 'Please enter your preferred location');
      return;
    }

    if (preferences.nonNegotiables.bhkType.length === 0) {
      Alert.alert('Missing Information', 'Please select at least one BHK type');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put('/api/users/preferences', { preferences });
      
      Alert.alert('Success', 'Your preferences have been saved!', [
        {
          text: 'OK',
          onPress: () => {
            if (isOnboarding) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBHK = (bhk: string) => {
    setPreferences(prev => ({
      ...prev,
      nonNegotiables: {
        ...prev.nonNegotiables,
        bhkType: prev.nonNegotiables.bhkType.includes(bhk)
          ? prev.nonNegotiables.bhkType.filter(b => b !== bhk)
          : [...prev.nonNegotiables.bhkType, bhk],
      },
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setPreferences(prev => ({
      ...prev,
      mustHaves: {
        ...prev.mustHaves,
        amenities: prev.mustHaves.amenities.includes(amenity)
          ? prev.mustHaves.amenities.filter(a => a !== amenity)
          : [...prev.mustHaves.amenities, amenity],
      },
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {!isOnboarding && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {isOnboarding ? 'Set Your Preferences' : 'Edit Preferences'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isOnboarding && (
          <Text style={styles.subtitle}>
            Tell us what you're looking for and we'll find the perfect match for you
          </Text>
        )}

        {/* Budget Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Range (₹/month)</Text>
          <View style={styles.budgetRow}>
            <View style={styles.budgetInput}>
              <Text style={styles.budgetLabel}>Min</Text>
              <TextInput
                style={styles.input}
                value={preferences.nonNegotiables.budget.min.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setPreferences(prev => ({
                    ...prev,
                    nonNegotiables: {
                      ...prev.nonNegotiables,
                      budget: { ...prev.nonNegotiables.budget, min: value },
                    },
                  }));
                }}
                keyboardType="numeric"
                placeholder="10000"
              />
            </View>
            <Text style={styles.budgetSeparator}>to</Text>
            <View style={styles.budgetInput}>
              <Text style={styles.budgetLabel}>Max</Text>
              <TextInput
                style={styles.input}
                value={preferences.nonNegotiables.budget.max.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setPreferences(prev => ({
                    ...prev,
                    nonNegotiables: {
                      ...prev.nonNegotiables,
                      budget: { ...prev.nonNegotiables.budget, max: value },
                    },
                  }));
                }}
                keyboardType="numeric"
                placeholder="50000"
              />
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Location</Text>
          <TextInput
            style={styles.input}
            value={preferences.nonNegotiables.location}
            onChangeText={(text) => {
              setPreferences(prev => ({
                ...prev,
                nonNegotiables: { ...prev.nonNegotiables, location: text },
              }));
            }}
            placeholder="e.g., Koramangala, HSR Layout"
          />
        </View>

        {/* BHK Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BHK Type</Text>
          <View style={styles.chipContainer}>
            {BHK_OPTIONS.map((bhk) => (
              <TouchableOpacity
                key={bhk}
                style={[
                  styles.chip,
                  preferences.nonNegotiables.bhkType.includes(bhk) && styles.chipSelected,
                ]}
                onPress={() => toggleBHK(bhk)}
              >
                <Text
                  style={[
                    styles.chipText,
                    preferences.nonNegotiables.bhkType.includes(bhk) && styles.chipTextSelected,
                  ]}
                >
                  {bhk.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Furnishing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Furnishing</Text>
          <View style={styles.chipContainer}>
            {FURNISHING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.chip,
                  preferences.nonNegotiables.furnishing === option.value && styles.chipSelected,
                ]}
                onPress={() => {
                  setPreferences(prev => ({
                    ...prev,
                    nonNegotiables: {
                      ...prev.nonNegotiables,
                      furnishing: option.value as any,
                    },
                  }));
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    preferences.nonNegotiables.furnishing === option.value && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amenities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Must-Have Amenities</Text>
          <View style={styles.chipContainer}>
            {AMENITIES.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.chip,
                  preferences.mustHaves.amenities.includes(amenity) && styles.chipSelected,
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text
                  style={[
                    styles.chipText,
                    preferences.mustHaves.amenities.includes(amenity) && styles.chipTextSelected,
                  ]}
                >
                  {amenity.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Preferences</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Home Office Space</Text>
            <Switch
              value={preferences.mustHaves.homeOfficeSpace}
              onValueChange={(value) => {
                setPreferences(prev => ({
                  ...prev,
                  mustHaves: { ...prev.mustHaves, homeOfficeSpace: value },
                }));
              }}
              trackColor={{ false: '#ddd', true: '#6366f1' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Gated Community</Text>
            <Switch
              value={preferences.mustHaves.gatedCommunity}
              onValueChange={(value) => {
                setPreferences(prev => ({
                  ...prev,
                  mustHaves: { ...prev.mustHaves, gatedCommunity: value },
                }));
              }}
              trackColor={{ false: '#ddd', true: '#6366f1' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pet Friendly</Text>
            <Switch
              value={preferences.niceToHaves.petFriendly}
              onValueChange={(value) => {
                setPreferences(prev => ({
                  ...prev,
                  niceToHaves: { ...prev.niceToHaves, petFriendly: value },
                }));
              }}
              trackColor={{ false: '#ddd', true: '#6366f1' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Balcony Preferred</Text>
            <Switch
              value={preferences.niceToHaves.balconyPreference}
              onValueChange={(value) => {
                setPreferences(prev => ({
                  ...prev,
                  niceToHaves: { ...prev.niceToHaves, balconyPreference: value },
                }));
              }}
              trackColor={{ false: '#ddd', true: '#6366f1' }}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isOnboarding ? 'Get Started' : 'Save Preferences'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInput: {
    flex: 1,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  budgetSeparator: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  chipTextSelected: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PreferencesScreen;
