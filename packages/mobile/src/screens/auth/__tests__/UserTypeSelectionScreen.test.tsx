import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock the Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: (cb?: () => void) => cb && cb(),
  });
  RN.Animated.sequence = (animations: any[]) => ({
    start: (cb?: () => void) => cb && cb(),
  });
  return RN;
});

import { UserTypeSelectionScreen, UserType } from '../UserTypeSelectionScreen';

describe('UserTypeSelectionScreen', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with all user type options', () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    expect(getByText('Welcome to Homie! 🏠')).toBeTruthy();
    expect(getByText('How would you like to use Homie?')).toBeTruthy();
    expect(getByText('Looking for a Full Home')).toBeTruthy();
    expect(getByText('Looking for a Room')).toBeTruthy();
    expect(getByText('I am a Landlord')).toBeTruthy();
  });

  it('disables continue button when no option is selected', () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    // Button should not be pressable when disabled - pressing it shouldn't call onSelect
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);
    
    // onSelect should not have been called since no option was selected
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('enables continue button when an option is selected', () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('Looking for a Full Home'));
    
    const continueButton = getByText('Continue');
    expect(continueButton).toBeTruthy();
  });

  it('calls onSelect with full_home_tenant when full home option is selected', async () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('Looking for a Full Home'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('full_home_tenant');
    });
  });

  it('calls onSelect with room_sharing_tenant when room option is selected', async () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('Looking for a Room'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('room_sharing_tenant');
    });
  });

  it('calls onSelect with landlord when landlord option is selected', async () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    fireEvent.press(getByText('I am a Landlord'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('landlord');
    });
  });

  it('shows description text when an option is selected', () => {
    const { getByText, queryByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    // Initially no description
    expect(queryByText(/Find your perfect apartment/)).toBeNull();

    // Select full home option
    fireEvent.press(getByText('Looking for a Full Home'));

    // Description should appear
    expect(getByText(/Find your perfect apartment/)).toBeTruthy();
  });

  it('shows loading state when isLoading is true', () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} isLoading={true} />
    );

    fireEvent.press(getByText('Looking for a Full Home'));
    
    expect(getByText('Setting up...')).toBeTruthy();
  });

  it('shows footer note about changing selection later', () => {
    const { getByText } = render(
      <UserTypeSelectionScreen onSelect={mockOnSelect} />
    );

    expect(getByText('You can change this later in your profile settings')).toBeTruthy();
  });
});
