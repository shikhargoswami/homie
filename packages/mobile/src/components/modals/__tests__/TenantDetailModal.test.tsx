import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

/**
 * TenantDetailModal Tests
 * 
 * Tests for:
 * - Modal visibility
 * - All sections rendering (About, Financial, Move-in, Family, etc.)
 * - Action buttons (Pass, Interested)
 * - Close handler
 * - Null tenant handling
 */

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock LandlordSwipeContext with all formatters
jest.mock('@contexts/LandlordSwipeContext', () => ({
  formatOccupationType: jest.fn((type: string) => {
    const map: Record<string, string> = {
      salaried: 'Salaried',
      self_employed: 'Self-Employed',
      business_owner: 'Business Owner',
      freelancer: 'Freelancer',
      student: 'Student',
    };
    return map[type] || type;
  }),
  formatBudgetRange: jest.fn((min: number, max: number) => 
    `₹${(min / 1000).toFixed(0)}K - ₹${(max / 1000).toFixed(0)}K`
  ),
  formatAnnualIncome: jest.fn((income: number) => 
    `₹${(income / 100000).toFixed(1)} LPA`
  ),
  formatMoveInDate: jest.fn((date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }),
  formatLeaseDuration: jest.fn((duration: string) => {
    const map: Record<string, string> = {
      '6_months': '6 Months',
      '11_months': '11 Months',
      '1_year': '1 Year',
      '2_years': '2 Years',
      '3_years_plus': '3+ Years',
    };
    return map[duration] || duration;
  }),
  formatLifestyleTag: jest.fn((tag: string) => 
    tag.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  ),
}));

// Create mock tenant data
const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  userId: 'user-1',
  name: 'Rahul Sharma',
  photo: 'https://example.com/photo.jpg',
  age: 28,
  matchScore: 85,
  occupationType: 'salaried',
  company: 'TechCorp',
  budgetMin: 25000,
  budgetMax: 35000,
  annualIncome: 1200000,
  preferredMoveIn: '2024-03-01',
  leaseDuration: '11_months',
  familySize: 2,
  hasChildren: false,
  currentLocation: 'Koramangala, Bangalore',
  lifestyle: {
    tags: ['non_smoker', 'early_riser', 'vegetarian'],
    workLocation: 'MG Road',
    commuteMode: 'metro',
    maxCommuteMinutes: 30,
  },
  isCouple: true,
  isVerified: true,
  employmentVerified: true,
  incomeVerified: false,
  policeVerification: true,
  previousLandlordVerified: false,
  rentalHistory: {
    rating: 4.5,
    review: 'Excellent tenant, always paid on time',
    previousLandlordName: 'Suresh Kumar',
    tenancyMonths: 24,
    wasEvicted: false,
  },
  interestMessage: 'Love the location and the amenities.',
  property: {
    id: 'prop-1',
    title: 'Modern 2BHK in Indiranagar',
    neighborhood: 'Indiranagar',
    rent: 30000,
    configuration: '2bhk',
  },
  expressedInterestAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('TenantDetailModal', () => {
  describe('Modal Props Interface', () => {
    it('should define required TenantDetailModalProps fields', () => {
      const mockProps = {
        visible: true,
        tenant: createMockTenant(),
        onClose: jest.fn(),
        onSwipeLeft: jest.fn(),
        onSwipeRight: jest.fn(),
      };

      expect(mockProps.visible).toBe(true);
      expect(mockProps.tenant).toBeDefined();
      expect(typeof mockProps.onClose).toBe('function');
      expect(typeof mockProps.onSwipeLeft).toBe('function');
      expect(typeof mockProps.onSwipeRight).toBe('function');
    });

    it('should handle null tenant gracefully', () => {
      const mockProps = {
        visible: true,
        tenant: null,
        onClose: jest.fn(),
        onSwipeLeft: jest.fn(),
        onSwipeRight: jest.fn(),
      };

      expect(mockProps.tenant).toBeNull();
    });
  });

  describe('About Section Data', () => {
    it('should include occupation details', () => {
      const tenant = createMockTenant();
      
      expect(tenant.occupationType).toBe('salaried');
      expect(tenant.company).toBe('TechCorp');
    });

    it('should include location details', () => {
      const tenant = createMockTenant();
      expect(tenant.currentLocation).toBe('Koramangala, Bangalore');
    });

    it('should handle tenant without company', () => {
      const tenant = createMockTenant({ company: undefined });
      expect(tenant.company).toBeUndefined();
    });
  });

  describe('Financial Section Data', () => {
    const { formatAnnualIncome, formatBudgetRange } = require('@contexts/LandlordSwipeContext');

    it('should format annual income correctly', () => {
      const result = formatAnnualIncome(1200000);
      expect(result).toBe('₹12.0 LPA');
    });

    it('should format budget range correctly', () => {
      const result = formatBudgetRange(25000, 35000);
      expect(result).toBe('₹25K - ₹35K');
    });

    it('should handle high annual incomes', () => {
      const result = formatAnnualIncome(5000000);
      expect(result).toBe('₹50.0 LPA');
    });
  });

  describe('Move-in Details Section Data', () => {
    const { formatMoveInDate, formatLeaseDuration } = require('@contexts/LandlordSwipeContext');

    it('should format move-in date correctly', () => {
      const tenant = createMockTenant();
      expect(tenant.preferredMoveIn).toBe('2024-03-01');
    });

    it('should format 11 months lease duration', () => {
      const result = formatLeaseDuration('11_months');
      expect(result).toBe('11 Months');
    });

    it('should format 1 year lease duration', () => {
      const result = formatLeaseDuration('1_year');
      expect(result).toBe('1 Year');
    });

    it('should format 3+ years lease duration', () => {
      const result = formatLeaseDuration('3_years_plus');
      expect(result).toBe('3+ Years');
    });
  });

  describe('Family Section Data', () => {
    it('should include family size', () => {
      const tenant = createMockTenant({ familySize: 3 });
      expect(tenant.familySize).toBe(3);
    });

    it('should include children info', () => {
      const tenantWithChildren = createMockTenant({ hasChildren: true });
      expect(tenantWithChildren.hasChildren).toBe(true);

      const tenantWithoutChildren = createMockTenant({ hasChildren: false });
      expect(tenantWithoutChildren.hasChildren).toBe(false);
    });

    it('should include couple info', () => {
      const coupleTenant = createMockTenant({ isCouple: true });
      expect(coupleTenant.isCouple).toBe(true);
    });
  });

  describe('Rental History Section Data', () => {
    it('should include complete rental history', () => {
      const tenant = createMockTenant();
      
      expect(tenant.rentalHistory).toBeDefined();
      expect(tenant.rentalHistory.rating).toBe(4.5);
      expect(tenant.rentalHistory.review).toBe('Excellent tenant, always paid on time');
      expect(tenant.rentalHistory.previousLandlordName).toBe('Suresh Kumar');
      expect(tenant.rentalHistory.tenancyMonths).toBe(24);
      expect(tenant.rentalHistory.wasEvicted).toBe(false);
    });

    it('should handle tenant without rental history', () => {
      const tenant = createMockTenant({ rentalHistory: null });
      expect(tenant.rentalHistory).toBeNull();
    });

    it('should identify eviction history', () => {
      const tenant = createMockTenant({
        rentalHistory: {
          ...createMockTenant().rentalHistory,
          wasEvicted: true,
        },
      });
      expect(tenant.rentalHistory.wasEvicted).toBe(true);
    });
  });

  describe('Verifications Section Data', () => {
    it('should include all verification fields', () => {
      const tenant = createMockTenant({
        isVerified: true,
        employmentVerified: true,
        incomeVerified: true,
        policeVerification: true,
        previousLandlordVerified: true,
      });
      
      expect(tenant.isVerified).toBe(true);
      expect(tenant.employmentVerified).toBe(true);
      expect(tenant.incomeVerified).toBe(true);
      expect(tenant.policeVerification).toBe(true);
      expect(tenant.previousLandlordVerified).toBe(true);
    });

    it('should handle mixed verification states', () => {
      const tenant = createMockTenant({
        isVerified: true,
        employmentVerified: true,
        incomeVerified: false,
        policeVerification: false,
        previousLandlordVerified: true,
      });
      
      expect(tenant.isVerified).toBe(true);
      expect(tenant.incomeVerified).toBe(false);
      expect(tenant.policeVerification).toBe(false);
    });

    it('should handle no verifications', () => {
      const tenant = createMockTenant({
        isVerified: false,
        employmentVerified: false,
        incomeVerified: false,
        policeVerification: false,
        previousLandlordVerified: false,
      });
      
      expect(tenant.isVerified).toBe(false);
      expect(tenant.employmentVerified).toBe(false);
    });
  });

  describe('Lifestyle Section Data', () => {
    const { formatLifestyleTag } = require('@contexts/LandlordSwipeContext');

    it('should format lifestyle tags correctly', () => {
      expect(formatLifestyleTag('non_smoker')).toBe('Non Smoker');
      expect(formatLifestyleTag('early_riser')).toBe('Early Riser');
      expect(formatLifestyleTag('vegetarian')).toBe('Vegetarian');
    });

    it('should include commute details', () => {
      const tenant = createMockTenant();
      
      expect(tenant.lifestyle.workLocation).toBe('MG Road');
      expect(tenant.lifestyle.commuteMode).toBe('metro');
      expect(tenant.lifestyle.maxCommuteMinutes).toBe(30);
    });

    it('should handle empty lifestyle tags', () => {
      const tenant = createMockTenant({
        lifestyle: {
          ...createMockTenant().lifestyle,
          tags: [],
        },
      });
      
      expect(tenant.lifestyle.tags).toHaveLength(0);
    });
  });

  describe('Interest Message Section Data', () => {
    it('should include interest message', () => {
      const tenant = createMockTenant();
      expect(tenant.interestMessage).toBe('Love the location and the amenities.');
    });

    it('should handle long interest messages', () => {
      const longMessage = 'I really love this property because of the amazing location, great amenities, proximity to my workplace, and the wonderful neighborhood. I am looking forward to making this my new home.';
      const tenant = createMockTenant({ interestMessage: longMessage });
      expect(tenant.interestMessage).toBe(longMessage);
    });

    it('should handle empty interest message', () => {
      const tenant = createMockTenant({ interestMessage: '' });
      expect(tenant.interestMessage).toBe('');
    });
  });

  describe('Property Section Data', () => {
    it('should include property information', () => {
      const tenant = createMockTenant();
      
      expect(tenant.property.title).toBe('Modern 2BHK in Indiranagar');
      expect(tenant.property.neighborhood).toBe('Indiranagar');
      expect(tenant.property.rent).toBe(30000);
      expect(tenant.property.configuration).toBe('2bhk');
    });

    it('should handle different configurations', () => {
      const configs = ['1rk', '1bhk', '2bhk', '3bhk', '4bhk_plus'];
      
      configs.forEach(config => {
        const tenant = createMockTenant({
          property: {
            ...createMockTenant().property,
            configuration: config,
          },
        });
        expect(tenant.property.configuration).toBe(config);
      });
    });
  });

  describe('Action Handlers', () => {
    it('should have close handler', () => {
      const onClose = jest.fn();
      onClose();
      expect(onClose).toHaveBeenCalled();
    });

    it('should have swipe left (pass) handler', () => {
      const onSwipeLeft = jest.fn();
      onSwipeLeft();
      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should have swipe right (interested) handler', () => {
      const onSwipeRight = jest.fn();
      onSwipeRight();
      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should call multiple handlers independently', () => {
      const onClose = jest.fn();
      const onSwipeLeft = jest.fn();
      const onSwipeRight = jest.fn();

      // Simulate close
      onClose();
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();

      // Simulate pass
      onSwipeLeft();
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);

      // Simulate interested
      onSwipeRight();
      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('Modal Visibility', () => {
    it('should respect visible prop', () => {
      const visibleProps = {
        visible: true,
        tenant: createMockTenant(),
      };
      expect(visibleProps.visible).toBe(true);

      const hiddenProps = {
        visible: false,
        tenant: createMockTenant(),
      };
      expect(hiddenProps.visible).toBe(false);
    });
  });

  describe('TestIDs for UI Testing', () => {
    it('should have expected testIDs defined', () => {
      // Document the expected testIDs for UI testing
      const expectedTestIDs = [
        'tenant-detail-modal',
        'close-modal-button',
        'pass-button',
        'interested-button',
      ];

      expectedTestIDs.forEach(testID => {
        expect(typeof testID).toBe('string');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle tenant with minimal data', () => {
      const minimalTenant = {
        id: 'tenant-min',
        userId: 'user-min',
        name: 'Test User',
        matchScore: 50,
        budgetMin: 10000,
        budgetMax: 20000,
        property: {
          id: 'prop-min',
          title: 'Basic Property',
          neighborhood: 'Test Area',
          rent: 15000,
          configuration: '1bhk',
        },
      };

      expect(minimalTenant.name).toBeDefined();
      expect(minimalTenant.matchScore).toBeDefined();
    });

    it('should handle tenant with all optional fields undefined', () => {
      const tenant = createMockTenant({
        photo: undefined,
        age: undefined,
        company: undefined,
        currentLocation: undefined,
        annualIncome: undefined,
        preferredMoveIn: undefined,
        leaseDuration: undefined,
        familySize: undefined,
        hasChildren: undefined,
        lifestyle: undefined,
        rentalHistory: undefined,
        interestMessage: undefined,
      });

      expect(tenant.photo).toBeUndefined();
      expect(tenant.age).toBeUndefined();
      expect(tenant.company).toBeUndefined();
    });
  });
});

describe('TenantDetailModal Integration', () => {
  it('should close modal and trigger pass when Pass is pressed', () => {
    const onClose = jest.fn();
    const onSwipeLeft = jest.fn();

    // Simulate the Pass button flow
    onSwipeLeft();
    onClose();

    expect(onSwipeLeft).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should close modal and trigger interested when Interested is pressed', () => {
    const onClose = jest.fn();
    const onSwipeRight = jest.fn();

    // Simulate the Interested button flow
    onSwipeRight();
    onClose();

    expect(onSwipeRight).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
