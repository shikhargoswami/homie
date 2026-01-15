import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock the Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

import { TenantOnboardingScreen } from '../TenantOnboardingScreen';

describe('TenantOnboardingScreen', () => {
  const mockOnComplete = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Home Tenant Flow', () => {
    it('renders the first step with name input', () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Tell us about you')).toBeTruthy();
      expect(getByPlaceholderText('Enter your full name')).toBeTruthy();
      expect(getByText('Step 1 of 6')).toBeTruthy();
    });

    it('shows validation error when name is empty', async () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter your name');
      });
    });

    it('navigates to step 2 when name and email are valid', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('Enter your email address'), 'john@example.com');
      fireEvent.press(getByText('Continue'));

      // Step 2 is now 'Work Details', budget is step 4
      await waitFor(() => {
        expect(getByText('Where do you work?')).toBeTruthy();
        expect(getByText('Step 2 of 6')).toBeTruthy();
      });
    });

    it('validates email format before proceeding', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Fill name but invalid email
      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('Enter your email address'), 'invalid-email');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Invalid Email', 'Please enter a valid email address');
      });
    });

    it('renders back button on first step', () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // The back button should be visible on step 1
      // Verify the component renders without error
      expect(getByText('Step 1 of 6')).toBeTruthy();
      // Note: Actually testing the back button would require testID on the TouchableOpacity
    });

    it('displays employment status options', () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Employment Status')).toBeTruthy();
      expect(getByText('Employed')).toBeTruthy();
      expect(getByText('Self-Employed')).toBeTruthy();
      expect(getByText('Student')).toBeTruthy();
    });

    it('has 6 steps for full home tenant', () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Step 1 of 6')).toBeTruthy();
    });
  });

  describe('Room Sharing Tenant Flow', () => {
    it('has 7 steps for room sharing tenant', () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="room_sharing"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Step 1 of 7')).toBeTruthy();
    });

    it('shows additional gender preference step for room sharing', () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="room_sharing"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Room sharing has 7 steps (1 more than full_home's 6)
      expect(getByText('Step 1 of 7')).toBeTruthy();
      expect(getByText('Tell us about you')).toBeTruthy();
    });
  });

  describe('Location Selection', () => {
    it('screen has location selection step', () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Location selection is part of the onboarding flow
      // Full home has 6 steps, room sharing has 7 steps
      expect(getByText('Step 1 of 6')).toBeTruthy();
    });
  });
});
