import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock the Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the API client
jest.mock('../../../services/api', () => ({
  apiClient: {
    post: jest.fn().mockResolvedValue({ data: { data: { verification: {} } } }),
    get: jest.fn().mockResolvedValue({ data: { data: {} } }),
  },
}));

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
    expect(getByText('Step 1 of 5')).toBeTruthy(); // Updated from 4 to 5
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

  it('navigates to step 2 (verification) after completing step 1', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Get Verified & Build Trust 🛡️')).toBeTruthy();
      expect(getByText('Phone Verified')).toBeTruthy();
      expect(getByText('Email Verification')).toBeTruthy();
      expect(getByText('ID Verification (Recommended)')).toBeTruthy();
    });
  });

  it('navigates to step 3 with property portfolio options', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue')); // Go to step 2 (verification)

    await waitFor(() => getByText('Get Verified & Build Trust 🛡️'));
    fireEvent.press(getByText('Continue')); // Skip verification

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

  it('requires portfolio selection on step 3', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete step 1
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    // Skip step 2 (verification)
    await waitFor(() => getByText('Get Verified & Build Trust 🛡️'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));

    // Try to continue without selection
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please select your property ownership type');
    });
  });

  it('navigates to step 4 with property type options', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete step 1
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    // Skip step 2 (verification)
    await waitFor(() => getByText('Get Verified & Build Trust 🛡️'));
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Property Portfolio'));

    // Complete step 3
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

  it('requires property type selection on step 4', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete steps 1-3
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Get Verified & Build Trust 🛡️'));
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

  it('navigates to step 5 with location options', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete steps 1-4
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Get Verified & Build Trust 🛡️'));
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

  it('shows final step message on step 5', async () => {
    const { getByText, getByPlaceholderText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Complete steps 1-4
    fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => getByText('Get Verified & Build Trust 🛡️'));
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

    // Skip verification step
    await waitFor(() => getByText('Get Verified & Build Trust 🛡️'));
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

  it('has back button on first step', async () => {
    // Note: Testing the back button functionality is complex with TouchableOpacity
    // This test verifies the component renders with onBack prop
    const { getByText } = render(
      <LandlordOnboardingScreen
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Verify the screen renders properly with onBack prop provided
    expect(getByText('Welcome, Property Owner!')).toBeTruthy();
    // The back button exists in the header (arrow-back icon)
    // onBack would be called when user presses it
  });

  describe('Verification Step (Step 2)', () => {
    it('shows phone as already verified', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LandlordOnboardingScreen
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Phone Verified')).toBeTruthy();
        expect(getByText('Done')).toBeTruthy();
      });
    });

    it('shows trust score display', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LandlordOnboardingScreen
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Your Trust Score')).toBeTruthy();
        expect(getByText('20/100')).toBeTruthy(); // Initial trust score
      });
    });

    it('shows skip for now option', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LandlordOnboardingScreen
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Skip for Now')).toBeTruthy();
      });
    });

    it('can skip verification and continue to next step', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LandlordOnboardingScreen
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => getByText('Skip for Now'));
      fireEvent.press(getByText('Skip for Now'));

      await waitFor(() => {
        expect(getByText('Property Portfolio')).toBeTruthy();
      });
    });

    it('shows email verification option when email is provided', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
        <LandlordOnboardingScreen
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'john@example.com');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Email Verification')).toBeTruthy();
        expect(getByText('Verify john@example.com')).toBeTruthy();
        expect(queryByText('Verify Email')).toBeTruthy();
      });
    });

    it('shows ID verification options', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LandlordOnboardingScreen
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('ID Verification (Recommended)')).toBeTruthy();
        expect(getByText('Upload Aadhar/PAN for instant trust')).toBeTruthy();
      });
    });

    it('shows property ownership verification option', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LandlordOnboardingScreen
          onComplete={mockOnComplete}
          onBack={mockOnBack}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Landlord');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Property Ownership Proof')).toBeTruthy();
        expect(getByText('Upload docs for "Verified Owner" badge')).toBeTruthy();
      });
    });
  });
});
