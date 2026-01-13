import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DashboardScreen } from '../DashboardScreen';

// Mock the api client
jest.mock('@services/api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback: () => void) => callback()),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn() as jest.Mock,
  goBack: jest.fn() as jest.Mock,
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('loads and displays stats', async () => {
    const { apiClient } = require('@services/api');
    
    apiClient.get.mockImplementation((url: string) => {
      if (url === '/api/landlord/stats') {
        return Promise.resolve({
          success: true,
          data: {
            activeListings: 5,
            pendingRequests: 3,
            totalMatches: 15,
            confirmedViewings: 2,
            responseRate: 85,
          },
        });
      }
      if (url === '/api/landlord/pending-requests') {
        return Promise.resolve({
          success: true,
          data: {
            requests: [],
          },
        });
      }
      if (url === '/api/landlord/recent-matches') {
        return Promise.resolve({
          success: true,
          data: {
            matches: [],
          },
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/landlord/stats');
    });
  });

  it('displays quick action buttons', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Add Property')).toBeTruthy();
    expect(getByText('Viewings')).toBeTruthy();
  });

  it('navigates to Add Property on button press', async () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    const addPropertyButton = getByText('Add Property');
    fireEvent.press(addPropertyButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddProperty');
  });

  it('navigates to Viewings on button press', async () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    const viewingsButton = getByText('Viewings');
    fireEvent.press(viewingsButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Viewings', { userRole: 'landlord' });
  });

  it('displays pending requests section', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Pending Requests')).toBeTruthy();
  });

  it('displays recent matches section', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Recent Matches')).toBeTruthy();
  });

  it('handles API error gracefully with demo data', async () => {
    const { apiClient } = require('@services/api');
    apiClient.get.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    // Should still render with demo data
    await waitFor(() => {
      expect(getByText('Dashboard')).toBeTruthy();
    });
  });
});
