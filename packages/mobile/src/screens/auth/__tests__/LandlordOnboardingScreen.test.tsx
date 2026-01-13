import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock the Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

import { LandlordOnboardingScreen } from '../LandlordOnboardingScreen';

describe('LandlordOnboardingScreen', () => {
  const mockOnComplete = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the first step with profile setup', () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    expect(getByText('Welcome, Property Owner!')).toBeTruthy();
    expect(getByText("Let's set up your landlord profile")).toBeTruthy();
    expect(getByPlaceholderText('Enter your full name')).toBeTruthy();
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(getByText('Step 1 of 4')).toBeTruthy();
  });

  it('shows validation error when name is empty', async () => {
    const { getByText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter your name');
    });
  });

  it('validates email format when provided', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'invalid-email');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Invalid Email', 'Please enter a valid email address');
    });
  });

  it('navigates to step 2 with property portfolio options', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Property Portfolio')).toBeTruthy();
      expect(getByText('Single Property')).toBeTruthy();
      expect(getByText('Multiple Properties')).toBeTruthy();
      expect(getByText('Property Agency')).toBeTruthy();
    });
  });

  it('shows experience options on step 1', () => {
    const { getByText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    expect(getByText('Landlord Experience')).toBeTruthy();
    expect(getByText('New to Renting')).toBeTruthy();
    expect(getByText('Experienced')).toBeTruthy();
    expect(getByText('Property Manager')).toBeTruthy();
  });

  it('requires portfolio selection on step 2', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete step 1
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));

    // Try to continue without selection
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please select your property ownership type');
    });
  });

  it('navigates to step 3 with property type options', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete step 1
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));

    // Complete step 2
    fireEvent.press(getByText('Single Property'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Property Types')).toBeTruthy();
      expect(getByText('Apartment')).toBeTruthy();
      expect(getByText('House')).toBeTruthy();
      expect(getByText('Villa')).toBeTruthy();
      expect(getByText('PG/Hostel')).toBeTruthy();
    });
  });

  it('requires property type selection on step 3', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete steps 1-2
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));
    fireEvent.press(getByText('Single Property'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Types'));

    // Try to continue without selection
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please select at least one property type');
    });
  });

  it('navigates to step 4 with location options', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete steps 1-3
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));
    fireEvent.press(getByText('Single Property'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Types'));
    fireEvent.press(getByText('Apartment'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Property Locations')).toBeTruthy();
      expect(getByText('Koramangala')).toBeTruthy();
      expect(getByText('Indiranagar')).toBeTruthy();
    });
  });

  it('shows final step message on step 4', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete steps 1-3
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));
    fireEvent.press(getByText('Single Property'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Types'));
    fireEvent.press(getByText('Apartment'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Almost Ready!')).toBeTruthy();
      expect(getByText(/add your first property/)).toBeTruthy();
    });
  });

  it('calls onComplete with all data when setup is finished', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete all steps
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'john@landlord.com');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));
    fireEvent.press(getByText('Single Property'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Types'));
    fireEvent.press(getByText('Apartment'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Locations'));
    fireEvent.press(getByText('Koramangala'));
    fireEvent.press(getByText('Complete Setup'));

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Landlord',
          email: 'john@landlord.com',
          propertiesCount: 'single',
          propertyTypes: ['apartment'],
          locations: ['Koramangala'],
          experience: 'experienced',
        })
      );
    });
  });

  it('calls onBack when back button is pressed on first step', () => {
    const { UNSAFE_root } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Find and press back button
    const backButton = UNSAFE_root.findAllByType('TouchableOpacity')[0];
    fireEvent.press(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });
});
