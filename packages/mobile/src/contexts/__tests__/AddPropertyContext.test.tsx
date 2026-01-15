import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddPropertyProvider, useAddProperty } from '../AddPropertyContext';
import { apiClient } from '../../services/api';

// Mock API client
jest.mock('../../services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test component to access context
const TestComponent: React.FC<{ onContext?: (ctx: ReturnType<typeof useAddProperty>) => void }> = ({ onContext }) => {
  const context = useAddProperty();
  
  React.useEffect(() => {
    if (onContext) {
      onContext(context);
    }
  }, [context, onContext]);
  
  return null;
};

// Wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AddPropertyProvider>
          {children}
        </AddPropertyProvider>
      </NavigationContainer>
    </QueryClientProvider>
  );
};

describe('AddPropertyContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.currentStep).toBe(1);
      expect(capturedContext!.basicInfo.title).toBe('');
      expect(capturedContext!.basicInfo.address).toBe('');
      expect(capturedContext!.basicInfo.propertyType).toBe('apartment');
      expect(capturedContext!.basicInfo.configuration).toBe('2bhk');
      expect(capturedContext!.pricing.rent).toBe('');
      expect(capturedContext!.pricing.furnishing).toBe('semi-furnished');
      expect(capturedContext!.amenitiesData.amenities).toEqual([]);
      expect(capturedContext!.photosData.photos).toEqual([]);
      expect(capturedContext!.isEditMode).toBe(false);
      expect(capturedContext!.isSubmitting).toBe(false);
    });
  });

  describe('Basic Info Updates', () => {
    it('should update basic info correctly', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        capturedContext!.updateBasicInfo({
          title: 'Beautiful Villa',
          address: '123 Main Street',
          neighborhood: 'Koramangala',
          city: 'Bangalore',
          propertyType: 'villa',
          configuration: '3bhk',
          size: '2000',
        });
      });
      
      expect(capturedContext!.basicInfo.title).toBe('Beautiful Villa');
      expect(capturedContext!.basicInfo.address).toBe('123 Main Street');
      expect(capturedContext!.basicInfo.neighborhood).toBe('Koramangala');
      expect(capturedContext!.basicInfo.city).toBe('Bangalore');
      expect(capturedContext!.basicInfo.propertyType).toBe('villa');
      expect(capturedContext!.basicInfo.configuration).toBe('3bhk');
      expect(capturedContext!.basicInfo.size).toBe('2000');
    });
  });

  describe('Pricing Updates', () => {
    it('should update pricing correctly', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      const testDate = new Date('2026-03-01');
      
      await act(async () => {
        capturedContext!.updatePricing({
          rent: '35000',
          deposit: '100000',
          maintenanceCharge: '2000',
          furnishing: 'fully-furnished',
          availableFrom: testDate,
        });
      });
      
      expect(capturedContext!.pricing.rent).toBe('35000');
      expect(capturedContext!.pricing.deposit).toBe('100000');
      expect(capturedContext!.pricing.maintenanceCharge).toBe('2000');
      expect(capturedContext!.pricing.furnishing).toBe('fully-furnished');
      expect(capturedContext!.pricing.availableFrom).toEqual(testDate);
    });
  });

  describe('Amenities Management', () => {
    it('should toggle amenities correctly', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Add amenities
      await act(async () => {
        capturedContext!.toggleAmenity('parking');
        capturedContext!.toggleAmenity('gym');
      });
      
      expect(capturedContext!.amenitiesData.amenities).toContain('parking');
      expect(capturedContext!.amenitiesData.amenities).toContain('gym');
      
      // Remove amenity
      await act(async () => {
        capturedContext!.toggleAmenity('parking');
      });
      
      expect(capturedContext!.amenitiesData.amenities).not.toContain('parking');
      expect(capturedContext!.amenitiesData.amenities).toContain('gym');
    });

    it('should add custom amenities correctly', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        capturedContext!.addCustomAmenity('Rooftop Garden');
        capturedContext!.addCustomAmenity('Wine Cellar');
      });
      
      expect(capturedContext!.amenitiesData.customAmenities).toContain('Rooftop Garden');
      expect(capturedContext!.amenitiesData.customAmenities).toContain('Wine Cellar');
    });

    it('should update description correctly', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        capturedContext!.updateAmenities({
          description: 'Beautiful property with amazing views and modern amenities.',
        });
      });
      
      expect(capturedContext!.amenitiesData.description).toBe(
        'Beautiful property with amazing views and modern amenities.'
      );
    });
  });

  describe('Photo Management', () => {
    it('should add photos correctly', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        capturedContext!.addPhoto('file:///photo1.jpg');
        capturedContext!.addPhoto('file:///photo2.jpg');
      });
      
      expect(capturedContext!.photosData.photos).toHaveLength(2);
      expect(capturedContext!.photosData.photos).toContain('file:///photo1.jpg');
      expect(capturedContext!.photosData.photos).toContain('file:///photo2.jpg');
    });

    it('should remove photos correctly', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        capturedContext!.addPhoto('file:///photo1.jpg');
        capturedContext!.addPhoto('file:///photo2.jpg');
        capturedContext!.addPhoto('file:///photo3.jpg');
      });
      
      expect(capturedContext!.photosData.photos).toHaveLength(3);
      
      await act(async () => {
        capturedContext!.removePhoto(1); // Remove middle photo
      });
      
      expect(capturedContext!.photosData.photos).toHaveLength(2);
      expect(capturedContext!.photosData.photos).not.toContain('file:///photo2.jpg');
    });

    it('should limit photos to 15', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        for (let i = 0; i < 20; i++) {
          capturedContext!.addPhoto(`file:///photo${i}.jpg`);
        }
      });
      
      expect(capturedContext!.photosData.photos).toHaveLength(15);
    });

    it('should toggle VR tour request', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      expect(capturedContext!.photosData.vrTourRequested).toBe(false);
      
      await act(async () => {
        capturedContext!.setVRTourRequested(true);
      });
      
      expect(capturedContext!.photosData.vrTourRequested).toBe(true);
    });
  });

  describe('Step Navigation', () => {
    it('should navigate between steps', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      expect(capturedContext!.currentStep).toBe(1);
      
      // Fill required fields for step 1
      await act(async () => {
        capturedContext!.updateBasicInfo({
          title: 'Test Property',
          address: '123 Street',
          neighborhood: 'Area',
          city: 'City',
          size: '1000',
        });
      });
      
      // Go to step 2
      await act(async () => {
        capturedContext!.goToNextStep();
      });
      
      expect(capturedContext!.currentStep).toBe(2);
      
      // Go back to step 1
      await act(async () => {
        capturedContext!.goToPreviousStep();
      });
      
      expect(capturedContext!.currentStep).toBe(1);
    });

    it('should not go below step 1', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        capturedContext!.goToPreviousStep();
        capturedContext!.goToPreviousStep();
      });
      
      expect(capturedContext!.currentStep).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should validate step 1 - missing title', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      const result = capturedContext!.validateStep(1);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property title is required');
    });

    it('should validate step 1 - all fields valid', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        capturedContext!.updateBasicInfo({
          title: 'Test Property',
          address: '123 Street',
          neighborhood: 'Area',
          city: 'City',
          size: '1000',
        });
      });
      
      const result = capturedContext!.validateStep(1);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate step 2 - pricing', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Without pricing
      let result = capturedContext!.validateStep(2);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valid rent amount is required');
      
      // With valid pricing
      await act(async () => {
        capturedContext!.updatePricing({
          rent: '30000',
          deposit: '60000',
        });
      });
      
      result = capturedContext!.validateStep(2);
      expect(result.valid).toBe(true);
    });

    it('should validate step 3 - description', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Without description
      let result = capturedContext!.validateStep(3);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Property description is required');
      
      // With short description
      await act(async () => {
        capturedContext!.updateAmenities({ description: 'Short' });
      });
      
      result = capturedContext!.validateStep(3);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description should be at least 50 characters');
      
      // With valid description
      await act(async () => {
        capturedContext!.updateAmenities({
          description: 'This is a beautiful property with amazing views and modern amenities. Located in a prime area.',
        });
      });
      
      result = capturedContext!.validateStep(3);
      expect(result.valid).toBe(true);
    });

    it('should validate step 4 - photos', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Without photos
      let result = capturedContext!.validateStep(4);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least 5 photos are required');
      
      // With enough photos
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          capturedContext!.addPhoto(`file:///photo${i}.jpg`);
        }
      });
      
      result = capturedContext!.validateStep(4);
      expect(result.valid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should submit property successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'property-123', success: true },
      });

      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Fill all required fields
      await act(async () => {
        capturedContext!.updateBasicInfo({
          title: 'Test Property',
          address: '123 Street',
          neighborhood: 'Area',
          city: 'City',
          size: '1000',
        });
        capturedContext!.updatePricing({
          rent: '30000',
          deposit: '60000',
        });
        capturedContext!.updateAmenities({
          description: 'This is a beautiful property with amazing views and modern amenities. Located in a prime area.',
        });
        for (let i = 0; i < 5; i++) {
          capturedContext!.addPhoto(`file:///photo${i}.jpg`);
        }
      });
      
      let result: { success: boolean; propertyId?: string; error?: string } | null = null;
      
      await act(async () => {
        result = await capturedContext!.submitProperty();
      });
      
      expect(result!.success).toBe(true);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/landlord/properties',
        expect.objectContaining({
          title: 'Test Property',
          address: '123 Street',
          neighborhood: 'Area',
          city: 'City',
          rent: 30000,
          deposit: 60000,
        })
      );
    });

    it('should handle submission error', async () => {
      mockApiClient.post.mockRejectedValueOnce({
        response: {
          data: {
            error: { message: 'Server error' },
          },
        },
      });

      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Fill all required fields
      await act(async () => {
        capturedContext!.updateBasicInfo({
          title: 'Test Property',
          address: '123 Street',
          neighborhood: 'Area',
          city: 'City',
          size: '1000',
        });
        capturedContext!.updatePricing({
          rent: '30000',
          deposit: '60000',
        });
        capturedContext!.updateAmenities({
          description: 'This is a beautiful property with amazing views and modern amenities. Located in a prime area.',
        });
        for (let i = 0; i < 5; i++) {
          capturedContext!.addPhoto(`file:///photo${i}.jpg`);
        }
      });
      
      let result: { success: boolean; propertyId?: string; error?: string } | null = null;
      
      await act(async () => {
        result = await capturedContext!.submitProperty();
      });
      
      expect(result!.success).toBe(false);
      expect(result!.error).toBe('Server error');
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial state', async () => {
      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Make changes
      await act(async () => {
        capturedContext!.updateBasicInfo({
          title: 'Test Property',
          address: '123 Street',
        });
        capturedContext!.updatePricing({ rent: '30000' });
        capturedContext!.toggleAmenity('parking');
        capturedContext!.addPhoto('file:///photo.jpg');
        capturedContext!.setCurrentStep(3);
      });
      
      // Reset
      await act(async () => {
        capturedContext!.resetForm();
      });
      
      expect(capturedContext!.currentStep).toBe(1);
      expect(capturedContext!.basicInfo.title).toBe('');
      expect(capturedContext!.pricing.rent).toBe('');
      expect(capturedContext!.amenitiesData.amenities).toEqual([]);
      expect(capturedContext!.photosData.photos).toEqual([]);
    });
  });

  describe('Draft Management', () => {
    it('should save draft', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { id: 'draft-123' },
      });

      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      // Update state first
      await act(async () => {
        capturedContext!.updateBasicInfo({ title: 'Draft Property' });
      });
      
      // Then save draft in separate act
      await act(async () => {
        await capturedContext!.saveDraft();
      });
      
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/landlord/properties/draft',
        expect.objectContaining({
          basicInfo: expect.objectContaining({ title: 'Draft Property' }),
        })
      );
    });

    it('should load draft', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            basicInfo: {
              title: 'Loaded Draft',
              address: 'Draft Address',
              neighborhood: 'Area',
              city: 'City',
              propertyType: 'villa',
              configuration: '3bhk',
              size: '1500',
            },
            pricing: {
              rent: '40000',
              deposit: '80000',
              maintenanceCharge: '',
              furnishing: 'semi-furnished',
              availableFrom: '2026-03-01',
            },
            amenities: {
              amenities: ['parking'],
              description: 'Draft description',
              customAmenities: [],
            },
            photos: {
              photos: ['file:///draft-photo.jpg'],
              vrTourRequested: false,
            },
            currentStep: 2,
          },
        },
      });

      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        await capturedContext!.loadDraft('draft-123');
      });
      
      expect(capturedContext!.basicInfo.title).toBe('Loaded Draft');
      expect(capturedContext!.basicInfo.propertyType).toBe('villa');
      expect(capturedContext!.pricing.rent).toBe('40000');
      expect(capturedContext!.currentStep).toBe(2);
    });
  });

  describe('Edit Mode', () => {
    it('should load property for editing', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            title: 'Existing Property',
            address: 'Existing Address',
            neighborhood: 'Area',
            city: 'City',
            propertyType: 'apartment',
            configuration: '2bhk',
            area: 1200,
            floor: 3,
            totalFloors: 5,
            rent: 35000,
            deposit: 70000,
            maintenanceCharge: 2000,
            furnishing: 'semi-furnished',
            availableFrom: '2026-02-15',
            amenities: ['parking', 'gym'],
            description: 'Existing description',
            photos: ['photo1.jpg', 'photo2.jpg'],
          },
        },
      });

      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        await capturedContext!.loadPropertyForEdit('property-123');
      });
      
      expect(capturedContext!.isEditMode).toBe(true);
      expect(capturedContext!.editPropertyId).toBe('property-123');
      expect(capturedContext!.basicInfo.title).toBe('Existing Property');
      expect(capturedContext!.pricing.rent).toBe('35000');
      expect(capturedContext!.amenitiesData.amenities).toContain('parking');
    });

    it('should update existing property', async () => {
      // First load property with all required fields
      mockApiClient.get.mockResolvedValueOnce({
        data: {
          data: {
            title: 'Existing Property',
            address: '123 Street',
            neighborhood: 'Area',
            city: 'City',
            pincode: '560001',
            propertyType: 'apartment',
            configuration: '2bhk',
            area: 1000,
            floor: 2,
            totalFloors: 5,
            rent: 30000,
            deposit: 60000,
            maintenanceCharge: 1000,
            furnishing: 'semi-furnished',
            availableFrom: '2026-02-01',
            description: 'This is a great property with lots of space and natural light. Perfect for families.',
            amenities: ['parking', 'gym'],
            photos: ['p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg', 'p5.jpg'],
          },
        },
      });

      mockApiClient.put.mockResolvedValueOnce({
        data: { id: 'property-123', success: true },
      });

      let capturedContext: ReturnType<typeof useAddProperty> | null = null;
      
      render(
        <TestComponent onContext={(ctx) => { capturedContext = ctx; }} />,
        { wrapper: createWrapper() }
      );
      
      await act(async () => {
        await capturedContext!.loadPropertyForEdit('property-123');
      });
      
      // Update title
      await act(async () => {
        capturedContext!.updateBasicInfo({ title: 'Updated Property' });
      });
      
      let result: { success: boolean } | null = null;
      
      await act(async () => {
        result = await capturedContext!.submitProperty();
      });
      
      expect(result!.success).toBe(true);
      expect(mockApiClient.put).toHaveBeenCalledWith(
        '/api/landlord/properties/property-123',
        expect.objectContaining({
          title: 'Updated Property',
        })
      );
    });
  });
});
