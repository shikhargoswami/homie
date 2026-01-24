import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type UserType = 'full_home_tenant' | 'room_sharing_tenant' | 'landlord';

interface UserTypeOption {
  id: UserType;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const userTypes: UserTypeOption[] = [
  {
    id: 'full_home_tenant',
    title: 'Looking for a Full Home',
    subtitle: 'Entire apartment or house',
    description: "Find your perfect apartment, house, or villa. Browse complete homes and connect directly with landlords.",
    icon: 'home',
    color: '#6366f1',
  },
  {
    id: 'room_sharing_tenant',
    title: 'Looking for a Room',
    subtitle: 'Shared accommodation',
    description: "Find a room in an occupied home. Perfect for flat sharing, co-living, and meeting like-minded flatmates.",
    icon: 'people',
    color: '#14b8a6',
  },
  {
    id: 'landlord',
    title: 'I am a Landlord',
    subtitle: 'List your property',
    description: "List your property and find verified tenants. Manage listings, schedule viewings, and receive rent on time.",
    icon: 'business',
    color: '#f59e0b',
  },
];

interface Props {
  onSelect: (userType: UserType) => void;
  isLoading?: boolean;
}

export const UserTypeSelectionScreen: React.FC<Props> = ({ onSelect, isLoading }) => {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [scaleValues] = useState(
    userTypes.map(() => new Animated.Value(1))
  );

  const handleSelect = (type: UserType, index: number) => {
    setSelectedType(type);
    
    // Animate selection
    Animated.sequence([
      Animated.timing(scaleValues[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValues[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Homie! 🏠</Text>
        <Text style={styles.subtitle}>How would you like to use Homie?</Text>
      </View>

      <View style={styles.optionsContainer}>
        {userTypes.map((option, index) => (
          <Animated.View
            key={option.id}
            style={[
              { transform: [{ scale: scaleValues[index] }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedType === option.id && styles.optionCardSelected,
                selectedType === option.id && { borderColor: option.color },
              ]}
              onPress={() => handleSelect(option.id, index)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={32} color={option.color} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedType === option.id && { borderColor: option.color },
                  ]}
                >
                  {selectedType === option.id && (
                    <View style={[styles.radioInner, { backgroundColor: option.color }]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {selectedType && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {userTypes.find(t => t.id === selectedType)?.description}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedType && styles.continueButtonDisabled,
            selectedType && {
              backgroundColor: userTypes.find(t => t.id === selectedType)?.color,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedType || isLoading}
        >
          {isLoading ? (
            <Text style={styles.continueButtonText}>Setting up...</Text>
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          You can change this later in your profile settings
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderWidth: 2,
    backgroundColor: '#fafafa',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default UserTypeSelectionScreen;
