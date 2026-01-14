import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the LandlordContext
const mockRefreshAll = jest.fn();
const mockLandlordContext = {
  stats: {
    activeListings: 4,
    rentedProperties: 1,
    totalMatches: 2,
    interestedTenants: 8,
    totalTenantLikes: 10,
    pendingViewings: 3,
    confirmedViewings: 1,
    responseRate: 84,
  },
  interestedTenants: [
    {
      id: '1',
      matchId: 'match-1',
      tenant: { id: 't1', name: 'John Doe' },
      property: { id: 'p1', address: '123 Main St', neighborhood: 'Downtown' },
      matchedAt: '2026-01-10T10:00:00Z',
    },
  ],
  mutualMatches: [
    {
      id: 'match-2',
      tenant: { id: 't2', name: 'Jane Smith' },
      property: { id: 'p2', address: '456 Oak Ave', neighborhood: 'Uptown' },
      matchedAt: '2026-01-12T14:00:00Z',
      hasConversation: true,
    },
  ],
  viewingRequests: [
    {
      id: 'viewing-1',
      date: '2026-01-20',
      time: '14:00',
      status: 'proposed',
      property: { id: 'p1', address: '123 Main St', neighborhood: 'Downtown' },
      tenant: { id: 't3', name: 'Bob Wilson' },
    },
  ],
  isLoadingStats: false,
  refreshAll: mockRefreshAll,
};

jest.mock('../../../contexts/LandlordContext', () => ({
  useLandlord: () => mockLandlordContext,
}));

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => callback(),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGetParent = jest.fn(() => ({ navigate: mockNavigate }));
const mockNavigation = {
  navigate: mockNavigate,
  getParent: mockGetParent,
  goBack: jest.fn(),
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the dashboard header', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      expect(getByText('Welcome back!')).toBeTruthy();
      expect(getByText('Landlord Dashboard')).toBeTruthy();
    });

    it('displays stats cards with correct labels', () => {
      const { getAllByText, getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      expect(getByText('Active Listings')).toBeTruthy();
      expect(getByText('Interested Tenants')).toBeTruthy();
      expect(getByText('Mutual Matches')).toBeTruthy();
      // Viewing Requests appears in both stat card and section header
      expect(getAllByText('Viewing Requests').length).toBeGreaterThanOrEqual(1);
    });

    it('displays response rate', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      expect(getByText('Response Rate')).toBeTruthy();
      expect(getByText('84%')).toBeTruthy();
    });

    it('displays quick action buttons', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      expect(getByText('Add Property')).toBeTruthy();
      expect(getByText('My Properties')).toBeTruthy();
      expect(getByText('Viewings')).toBeTruthy();
    });

    it('displays viewing requests section with tenant name', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      expect(getByText('Bob Wilson')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
    });

    it('displays See All button with correct count', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      expect(getByText('See All (1)')).toBeTruthy();
    });
  });

  describe('Navigation - Quick Actions', () => {
    it('navigates to AddProperty when Add Property is pressed', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      const addPropertyButton = getByText('Add Property');
      fireEvent.press(addPropertyButton);
      expect(mockNavigate).toHaveBeenCalledWith('AddProperty');
    });

    it('navigates to Viewings when Viewings button is pressed', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      const viewingsButton = getByText('Viewings');
      fireEvent.press(viewingsButton);
      expect(mockNavigate).toHaveBeenCalledWith('Viewings', { userRole: 'landlord' });
    });
  });

  describe('Navigation - Viewing Requests Section', () => {
    it('navigates to Viewings when See All is pressed', () => {
      const { getByText } = render(
        <DashboardScreen navigation={mockNavigation} />
      );

      const seeAllButton = getByText('See All (1)');
      fireEvent.press(seeAllButton);
      expect(mockNavigate).toHaveBeenCalledWith('Viewings', { userRole: 'landlord' });
    });
  });

  describe('Data Loading', () => {
    it('calls refreshAll on screen focus', () => {
      render(<DashboardScreen navigation={mockNavigation} />);
      expect(mockRefreshAll).toHaveBeenCalled();
    });
  });
});

describe('Viewing Status Display', () => {
  it('displays Pending status for proposed viewing', () => {
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    expect(getByText('Pending')).toBeTruthy();
  });
});
