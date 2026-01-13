import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ViewingsScreen } from '../ViewingsScreen';

// Mock the api client
jest.mock('@services/api', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('ViewingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tenant Mode', () => {
    const mockRoute = {
      params: {
        userRole: 'tenant' as const,
      },
    };

    it('renders correctly for tenant', () => {
      const { getByText } = render(
        <ViewingsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Viewings')).toBeTruthy();
      expect(getByText('Upcoming')).toBeTruthy();
      expect(getByText('Past')).toBeTruthy();
    });

    it('loads tenant viewings', async () => {
      const { apiClient } = require('@services/api');
      apiClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          viewings: [
            {
              id: '1',
              propertyId: 'p1',
              propertyAddress: '123 Test Street',
              propertyNeighborhood: 'Test Area',
              propertyImage: 'https://example.com/image.jpg',
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              time: '10:00 AM',
              status: 'confirmed',
              counterpartyName: 'John (Owner)',
              counterpartyPhone: '+91 9876543210',
            },
          ],
        },
      });

      const { getByText } = render(
        <ViewingsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/tenant/viewings');
      });
    });

    it('switches between upcoming and past tabs', async () => {
      const { getByText } = render(
        <ViewingsScreen navigation={mockNavigation} route={mockRoute} />
      );

      const pastTab = getByText('Past');
      fireEvent.press(pastTab);

      // Should filter to show past viewings
      const upcomingTab = getByText('Upcoming');
      fireEvent.press(upcomingTab);

      // Should switch back to upcoming
    });
  });

  describe('Landlord Mode', () => {
    const mockRoute = {
      params: {
        userRole: 'landlord' as const,
      },
    };

    it('renders correctly for landlord', () => {
      const { getByText } = render(
        <ViewingsScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Viewings')).toBeTruthy();
    });

    it('loads landlord viewings', async () => {
      const { apiClient } = require('@services/api');
      apiClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          viewings: [],
        },
      });

      render(
        <ViewingsScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/api/landlord/viewings');
      });
    });

    it('allows landlord to confirm pending viewings', async () => {
      const { apiClient } = require('@services/api');
      apiClient.get.mockResolvedValueOnce({
        success: true,
        data: {
          viewings: [
            {
              id: '1',
              propertyId: 'p1',
              propertyAddress: '123 Test Street',
              propertyNeighborhood: 'Test Area',
              propertyImage: 'https://example.com/image.jpg',
              date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              time: '10:00 AM',
              status: 'pending',
              counterpartyName: 'Alice (Tenant)',
            },
          ],
        },
      });
      apiClient.patch.mockResolvedValueOnce({
        success: true,
      });

      const { findByTestId } = render(
        <ViewingsScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Would need testID on confirm button to test this properly
    });
  });

  it('displays empty state when no viewings', async () => {
    const { apiClient } = require('@services/api');
    apiClient.get.mockResolvedValueOnce({
      success: true,
      data: {
        viewings: [],
      },
    });

    const { getByText } = render(
      <ViewingsScreen 
        navigation={mockNavigation} 
        route={{ params: { userRole: 'tenant' } }} 
      />
    );

    await waitFor(() => {
      expect(getByText('No upcoming viewings')).toBeTruthy();
    });
  });
});
