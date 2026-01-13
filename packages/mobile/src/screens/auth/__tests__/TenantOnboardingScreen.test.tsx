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

      expect(getByText("What's your name?")).toBeTruthy();
      expect(getByPlaceholderText('Enter your full name')).toBeTruthy();
      expect(getByText('Step 1 of 4')).toBeTruthy();
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

    it('navigates to step 2 when name is valid', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText("What's your budget?")).toBeTruthy();
        expect(getByText('Step 2 of 4')).toBeTruthy();
      });
    });

    it('shows budget validation error for low minimum', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Complete step 1
      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText("What's your budget?")).toBeTruthy();
      });

      // Enter invalid budget
      fireEvent.changeText(getByPlaceholderText('5,000'), '1000');
      fireEvent.changeText(getByPlaceholderText('50,000'), '50000');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Invalid Budget', 'Minimum budget should be at least ₹5,000');
      });
    });

    it('calls onBack when back button is pressed on first step', () => {
      const { UNSAFE_root } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Find and press back button (first touchable in header)
      const backButton = UNSAFE_root.findAllByType('TouchableOpacity')[0];
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
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

    it('has 4 steps for full home tenant', () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Step 1 of 4')).toBeTruthy();
    });
  });

  describe('Room Sharing Tenant Flow', () => {
    it('has 5 steps for room sharing tenant', () => {
      const { getByText } = render(
        <TenantOnboardingScreen
          searchType="room_sharing"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      expect(getByText('Step 1 of 5')).toBeTruthy();
    });

    it('shows gender preference on step 4 for room sharing', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="room_sharing"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Complete steps 1-3
      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Jane Doe');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => getByText("What's your budget?"));
      fireEvent.changeText(getByPlaceholderText('5,000'), '8000');
      fireEvent.changeText(getByPlaceholderText('50,000'), '15000');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => getByText('Preferred Locations'));
      fireEvent.press(getByText('Koramangala'));
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Flatmate Preferences')).toBeTruthy();
        expect(getByText('Preferred Gender')).toBeTruthy();
        expect(getByText('Any')).toBeTruthy();
        expect(getByText('Male')).toBeTruthy();
        expect(getByText('Female')).toBeTruthy();
      });
    });
  });

  describe('Location Selection', () => {
    it('displays location options on step 3', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Navigate to step 3
      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => getByText("What's your budget?"));
      fireEvent.changeText(getByPlaceholderText('5,000'), '10000');
      fireEvent.changeText(getByPlaceholderText('50,000'), '30000');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Preferred Locations')).toBeTruthy();
        expect(getByText('Koramangala')).toBeTruthy();
        expect(getByText('Indiranagar')).toBeTruthy();
        expect(getByText('HSR Layout')).toBeTruthy();
      });
    });

    it('allows selecting multiple locations', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
        <TenantOnboardingScreen
          searchType="full_home"
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      // Navigate to step 3
      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => getByText("What's your budget?"));
      fireEvent.changeText(getByPlaceholderText('5,000'), '10000');
      fireEvent.changeText(getByPlaceholderText('50,000'), '30000');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => getByText('Preferred Locations'));

      // Select multiple locations
      fireEvent.press(getByText('Koramangala'));
      fireEvent.press(getByText('Indiranagar'));

      expect(queryByText('2 locations selected')).toBeTruthy();
    });
  });
});
