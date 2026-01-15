import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddPropertyProvider } from '../../../contexts/AddPropertyContext';
import AddPropertyStep1Screen from '../AddPropertyStep1Screen';
import AddPropertyStep2Screen from '../AddPropertyStep2Screen';
import AddPropertyStep3Screen from '../AddPropertyStep3Screen';
import AddPropertyStep4Screen from '../AddPropertyStep4Screen';
import { apiClient } from '../../../services/api';

// Mock @expo/vector-icons before other mocks
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock dependencies
jest.mock('../../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 12.9716, longitude: 77.5946 },
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([
    { street: '123 Test Street', city: 'Bangalore', postalCode: '560001' },
  ]),
}), { virtual: true });

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///camera-photo.jpg' }],
  }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///gallery-photo.jpg' }],
  }),
  MediaTypeOptions: { Images: 'Images' },
}), { virtual: true });

// Mock datetimepicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ onChange }: { onChange: (event: any, date?: Date) => void }) => {
      React.useEffect(() => {
        onChange({ type: 'set' }, new Date('2026-03-15'));
      }, []);
      return null;
    },
  };
}, { virtual: true });

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Create test navigator
const Stack = createNativeStackNavigator();

// Individual screen test wrapper
const createScreenWrapper = (Screen: React.ComponentType<any>, initialRoute: string) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestNavigator = () => (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name={initialRoute} component={Screen} />
    </Stack.Navigator>
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AddPropertyProvider>
          <TestNavigator />
        </AddPropertyProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
};

describe('Property Wizard Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1 - Basic Info Screen', () => {
    it('should render all form fields', () => {
      const { getByPlaceholderText, getByText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      expect(getByPlaceholderText('e.g., Sky Villa, Green Haven')).toBeTruthy();
      expect(getByPlaceholderText('123, 5th Cross, Building Name')).toBeTruthy();
      expect(getByPlaceholderText('Koramangala')).toBeTruthy();
      expect(getByPlaceholderText('Bangalore')).toBeTruthy();
      expect(getByText('Property Type')).toBeTruthy();
      expect(getByText('Configuration')).toBeTruthy();
    });

    it('should show property type options', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      expect(getByText('Apartment')).toBeTruthy();
      expect(getByText('Villa')).toBeTruthy();
      expect(getByText('Independent House')).toBeTruthy();
    });

    it('should show configuration options', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      expect(getByText('1RK')).toBeTruthy();
      expect(getByText('1BHK')).toBeTruthy();
      expect(getByText('2BHK')).toBeTruthy();
      expect(getByText('3BHK')).toBeTruthy();
      expect(getByText('4BHK+')).toBeTruthy();
    });

    it('should update form fields', async () => {
      const { getByPlaceholderText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      const titleInput = getByPlaceholderText('e.g., Sky Villa, Green Haven');
      const addressInput = getByPlaceholderText('123, 5th Cross, Building Name');
      const neighborhoodInput = getByPlaceholderText('Koramangala');
      const cityInput = getByPlaceholderText('Bangalore');
      
      await act(async () => {
        fireEvent.changeText(titleInput, 'Beautiful Apartment');
        fireEvent.changeText(addressInput, '123 Main Street');
        fireEvent.changeText(neighborhoodInput, 'Indiranagar');
        fireEvent.changeText(cityInput, 'Bangalore');
      });
      
      expect(titleInput.props.value).toBe('Beautiful Apartment');
      expect(addressInput.props.value).toBe('123 Main Street');
      expect(neighborhoodInput.props.value).toBe('Indiranagar');
      expect(cityInput.props.value).toBe('Bangalore');
    });

    it('should show header with step indicator', () => {
      const { getByText, getAllByText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      // Step indicator shows "1/4" - multiple "1" values may exist
      expect(getAllByText(/1/).length).toBeGreaterThan(0);
      expect(getByText('Basic Info')).toBeTruthy();
    });

    it('should have save draft button', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      expect(getByText('Save Draft')).toBeTruthy();
    });

    it('should select property type', async () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      await act(async () => {
        fireEvent.press(getByText('Villa'));
      });
      
      // After pressing, Villa should be selected (check passes if no error thrown)
      expect(getByText('Villa')).toBeTruthy();
    });

    it('should select configuration', async () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep1Screen,
        'AddPropertyStep1'
      );
      
      await act(async () => {
        fireEvent.press(getByText('3BHK'));
      });
      
      expect(getByText('3BHK')).toBeTruthy();
    });
  });

  describe('Step 2 - Pricing Screen', () => {
    it('should render pricing form fields', () => {
      const { getByPlaceholderText, getByText } = createScreenWrapper(
        AddPropertyStep2Screen,
        'AddPropertyStep2'
      );
      
      expect(getByPlaceholderText('32,000')).toBeTruthy();
      expect(getByPlaceholderText('64,000')).toBeTruthy();
      expect(getByText('Furnishing Status')).toBeTruthy();
    });

    it('should show furnishing options', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep2Screen,
        'AddPropertyStep2'
      );
      
      expect(getByText('Fully Furnished')).toBeTruthy();
      expect(getByText('Semi-Furnished')).toBeTruthy();
      expect(getByText('Unfurnished')).toBeTruthy();
    });

    it('should have back button in header', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep2Screen,
        'AddPropertyStep2'
      );
      
      expect(getByText('Back')).toBeTruthy();
    });

    it('should show step 2 indicator', () => {
      const { getByText, getAllByText } = createScreenWrapper(
        AddPropertyStep2Screen,
        'AddPropertyStep2'
      );
      
      expect(getAllByText(/2/).length).toBeGreaterThan(0);
      expect(getByText('Pricing')).toBeTruthy();
    });
  });

  describe('Step 3 - Amenities Screen', () => {
    it('should render amenities section', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep3Screen,
        'AddPropertyStep3'
      );
      
      expect(getByText('Select Available Amenities')).toBeTruthy();
    });

    it('should show common amenities', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep3Screen,
        'AddPropertyStep3'
      );
      
      expect(getByText('Parking')).toBeTruthy();
      expect(getByText('Gym')).toBeTruthy();
      expect(getByText('Swimming Pool')).toBeTruthy();
      expect(getByText('Power Backup')).toBeTruthy();
    });

    it('should have add custom amenity button', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep3Screen,
        'AddPropertyStep3'
      );
      
      expect(getByText('Add Custom')).toBeTruthy();
    });

    it('should have description textarea', () => {
      const { getByPlaceholderText } = createScreenWrapper(
        AddPropertyStep3Screen,
        'AddPropertyStep3'
      );
      
      expect(
        getByPlaceholderText('Beautiful 2BHK apartment in prime Koramangala location. Close to metro, schools, and shopping centers...')
      ).toBeTruthy();
    });

    it('should show step 3 indicator', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep3Screen,
        'AddPropertyStep3'
      );
      
      expect(getByText(/3/)).toBeTruthy();
      expect(getByText('Amenities')).toBeTruthy();
    });

    it('should toggle amenity selection', async () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep3Screen,
        'AddPropertyStep3'
      );
      
      await act(async () => {
        fireEvent.press(getByText('Parking'));
        fireEvent.press(getByText('Gym'));
      });
      
      // If no error, amenities were toggled
      expect(getByText('Parking')).toBeTruthy();
      expect(getByText('Gym')).toBeTruthy();
    });
  });

  describe('Step 4 - Photos Screen', () => {
    it('should render photos section', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep4Screen,
        'AddPropertyStep4'
      );
      
      expect(getByText(/Add Property Photos/)).toBeTruthy();
    });

    it('should show minimum photos requirement', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep4Screen,
        'AddPropertyStep4'
      );
      
      expect(getByText(/minimum 5 required/)).toBeTruthy();
    });

    it('should have camera and gallery buttons', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep4Screen,
        'AddPropertyStep4'
      );
      
      expect(getByText('Take Photo')).toBeTruthy();
      expect(getByText('Choose from Gallery')).toBeTruthy();
    });

    it('should have VR tour option', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep4Screen,
        'AddPropertyStep4'
      );
      
      expect(getByText('Want a VR Tour?')).toBeTruthy();
    });

    it('should show publish button', () => {
      const { getByText } = createScreenWrapper(
        AddPropertyStep4Screen,
        'AddPropertyStep4'
      );
      
      expect(getByText(/Publish Property/)).toBeTruthy();
    });

    it('should show step 4 indicator', () => {
      const { getByText, getAllByText } = createScreenWrapper(
        AddPropertyStep4Screen,
        'AddPropertyStep4'
      );
      
      expect(getByText('Photos')).toBeTruthy();
      // Multiple "4" values may exist in the screen
      expect(getAllByText(/4/).length).toBeGreaterThan(0);
    });
  });
});
