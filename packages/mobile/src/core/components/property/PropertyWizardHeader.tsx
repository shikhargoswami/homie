import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Property Wizard Header
 * 
 * Displays:
 * - Cancel/Back button
 * - Step indicator (1/4, 2/4, etc.)
 * - Save Draft button
 * - Progress bar
 */

interface Props {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  onBack: () => void;
  onSaveDraft: () => void;
  isFirstStep: boolean;
  isSavingDraft?: boolean;
}

export const PropertyWizardHeader: React.FC<Props> = ({
  currentStep,
  totalSteps,
  stepTitle,
  onBack,
  onSaveDraft,
  isFirstStep,
  isSavingDraft,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <TouchableOpacity 
          style={styles.leftButton} 
          onPress={onBack}
          accessibilityLabel={isFirstStep ? 'Cancel' : 'Go back'}
        >
          {isFirstStep ? (
            <>
              <Ionicons name="close" size={20} color="#6366f1" />
              <Text style={styles.leftButtonText}>Cancel</Text>
            </>
          ) : (
            <>
              <Ionicons name="arrow-back" size={20} color="#6366f1" />
              <Text style={styles.leftButtonText}>Back</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepNumber}>{currentStep}/{totalSteps}</Text>
          <Text style={styles.stepTitle}>{stepTitle}</Text>
        </View>

        <TouchableOpacity 
          style={styles.saveDraftButton} 
          onPress={onSaveDraft}
          disabled={isSavingDraft}
          accessibilityLabel="Save draft"
        >
          <Ionicons 
            name={isSavingDraft ? 'cloud-upload' : 'cloud-outline'} 
            size={18} 
            color="#6366f1" 
          />
          <Text style={styles.saveDraftText}>
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index < currentStep && styles.progressSegmentActive,
              index === 0 && styles.progressSegmentFirst,
              index === totalSteps - 1 && styles.progressSegmentLast,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },
  leftButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 2,
  },
  saveDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
  },
  saveDraftText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#6366f1',
  },
  progressSegmentFirst: {
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  progressSegmentLast: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});

export default PropertyWizardHeader;
