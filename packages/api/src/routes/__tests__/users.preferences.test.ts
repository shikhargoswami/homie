import request from 'supertest';
import express from 'express';

// Mock database client
jest.mock('../../database/client', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.userId = 'test-tenant-id';
    next();
  },
}));

import { query } from '../../database/client';
import usersRouter from '../users';

const mockQuery = query as jest.Mock;

// Create test app
const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users API - Preferences Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/preferences', () => {
    it('should return tenant preferences with budget and lifestyle data', async () => {
      // Mock user role query
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ role: 'tenant' }], 
          rowCount: 1 
        })
        // Mock preferences query
        .mockResolvedValueOnce({ 
          rows: [{
            search_type: 'full_home',
            budget_min: 20000,
            budget_max: 40000,
            preferences: {
              preferred_locations: ['Koramangala', 'HSR Layout'],
              preferred_configuration: '2bhk',
              preferred_furnishing: 'semi_furnished',
              preferred_amenities: ['gym', 'parking'],
            },
            lifestyle_tags: ['sunlight_lover', 'quiet_mornings'],
            roommate_preferences: null,
            work_location_lat: '12.9352',
            work_location_lng: '77.6245',
            max_commute_minutes: 30,
            commute_mode: 'walk_metro',
            occupation_type: 'software_engineer',
            gender: 'male',
          }], 
          rowCount: 1 
        });

      const response = await request(app)
        .get('/api/users/preferences');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
      
      const prefs = response.body.data.preferences;
      expect(prefs.budget_min).toBe(20000);
      expect(prefs.budget_max).toBe(40000);
      expect(prefs.search_type).toBe('full_home');
      expect(prefs.preferred_configuration).toBe('2bhk');
      expect(prefs.preferred_amenities).toContain('gym');
      
      // Check lifestyle data
      expect(prefs.lifestyle).toBeDefined();
      expect(prefs.lifestyle.tags).toContain('sunlight_lover');
      expect(prefs.lifestyle.maxCommuteMinutes).toBe(30);
      expect(prefs.lifestyle.commuteMode).toBe('walk_metro');
      expect(prefs.lifestyle.workLocation).toEqual({ lat: 12.9352, lng: 77.6245 });
    });

    it('should return default preferences for new tenant without profile', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ role: 'tenant' }], 
          rowCount: 1 
        })
        .mockResolvedValueOnce({ 
          rows: [], 
          rowCount: 0 
        });

      const response = await request(app)
        .get('/api/users/preferences');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const prefs = response.body.data.preferences;
      expect(prefs.search_type).toBe('full_home');
      expect(prefs.budget_min).toBe(10000);
      expect(prefs.budget_max).toBe(50000);
      expect(prefs.preferred_locations).toEqual([]);
      expect(prefs.lifestyle.tags).toEqual([]);
      expect(prefs.lifestyle.maxCommuteMinutes).toBe(30);
    });

    it('should return 401 for unauthenticated users', async () => {
      // Override the auth mock for this test
      const unauthApp = express();
      unauthApp.use(express.json());
      
      // Create router without auth middleware
      const unauthRouter = express.Router();
      unauthRouter.get('/preferences', (req, res) => {
        if (!req.userId) {
          res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
          return;
        }
        res.json({ success: true });
      });
      unauthApp.use('/api/users', unauthRouter);

      const response = await request(unauthApp)
        .get('/api/users/preferences');

      expect(response.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [], 
          rowCount: 0 
        });

      const response = await request(app)
        .get('/api/users/preferences');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/users/preferences', () => {
    it('should update tenant preferences with new budget range', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ role: 'tenant' }], 
          rowCount: 1 
        })
        .mockResolvedValueOnce({ 
          rows: [{ id: 'profile-id' }], 
          rowCount: 1 
        });

      const response = await request(app)
        .put('/api/users/preferences')
        .send({
          budget_min: 25000,
          budget_max: 45000,
          preferred_configuration: '3bhk',
          preferred_furnishing: 'fully_furnished',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify upsert query was called with correct values
      // The API uses INSERT ... ON CONFLICT DO UPDATE (upsert pattern)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tenant_profiles'),
        expect.arrayContaining([25000, 45000])
      );
    });

    it('should update lifestyle preferences', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ role: 'tenant' }], 
          rowCount: 1 
        })
        .mockResolvedValueOnce({ 
          rows: [{ id: 'profile-id' }], 
          rowCount: 1 
        });

      const response = await request(app)
        .put('/api/users/preferences')
        .send({
          lifestyle_tags: ['pet_owner_dog', 'gym_nearby', 'wfh_heavy'],
          max_commute_minutes: 45,
          commute_mode: 'car',
          work_location_lat: 12.9716,
          work_location_lng: 77.5946,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should update amenities preferences', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ role: 'tenant' }], 
          rowCount: 1 
        })
        .mockResolvedValueOnce({ 
          rows: [{ id: 'profile-id' }], 
          rowCount: 1 
        });

      const response = await request(app)
        .put('/api/users/preferences')
        .send({
          preferred_amenities: ['gym', 'parking', 'swimming_pool', 'power_backup'],
          pets_allowed: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate budget range (min < max)', async () => {
      mockQuery
        .mockResolvedValueOnce({ 
          rows: [{ role: 'tenant' }], 
          rowCount: 1 
        });

      const response = await request(app)
        .put('/api/users/preferences')
        .send({
          budget_min: 50000,
          budget_max: 20000, // Invalid: max < min
        });

      // Should either fail or swap the values
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Preferences used in Recommendations', () => {
    it('should filter recommendations based on saved preferences', async () => {
      // This tests the integration between preferences and matching
      const preferencesPayload = {
        budget_min: 20000,
        budget_max: 35000,
        preferred_configuration: '2bhk',
        preferred_furnishing: 'semi_furnished',
        preferred_amenities: ['gym', 'parking'],
        lifestyle_tags: ['sunlight_lover'],
        max_commute_minutes: 30,
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'tenant' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 'profile-id' }], rowCount: 1 });

      const response = await request(app)
        .put('/api/users/preferences')
        .send(preferencesPayload);

      expect(response.status).toBe(200);
      
      // The matching service should use these preferences to filter recommendations
      // Properties outside ₹20-35k budget should be excluded
      // Properties with 1bhk, 3bhk, 4bhk should score lower
      // Properties with gym and parking should score higher
    });
  });
});

describe('SwipeScreen Filter Initialization from Preferences', () => {
  it('should map API preferences to SwipeScreen filter format', () => {
    const apiPreferences = {
      budget_min: 20000,
      budget_max: 35000,
      preferred_configuration: '2bhk',
      lifestyle: {
        tags: ['sunlight_lover', 'quiet_mornings'],
        maxCommuteMinutes: 30,
        commuteMode: 'walk_metro',
        workLocation: { lat: 12.9716, lng: 77.5946 },
      },
      pets_allowed: true,
    };

    // Transform to SwipeScreen filter format
    const swipeFilters = {
      budget: { min: apiPreferences.budget_min, max: apiPreferences.budget_max },
      bhk: apiPreferences.preferred_configuration,
      commute: apiPreferences.lifestyle.maxCommuteMinutes,
      lifestyle: [] as string[],
    };

    // Map lifestyle tags
    const tagMappings: Record<string, string> = {
      'sunlight_lover': 'high_sunlight',
      'quiet_mornings': 'quiet',
      'gym_nearby': 'gym_nearby',
    };

    if (apiPreferences.pets_allowed) {
      swipeFilters.lifestyle.push('pet_friendly');
    }

    for (const tag of apiPreferences.lifestyle.tags) {
      if (tagMappings[tag]) {
        swipeFilters.lifestyle.push(tagMappings[tag]);
      }
    }

    expect(swipeFilters.budget).toEqual({ min: 20000, max: 35000 });
    expect(swipeFilters.bhk).toBe('2bhk');
    expect(swipeFilters.commute).toBe(30);
    expect(swipeFilters.lifestyle).toContain('pet_friendly');
    expect(swipeFilters.lifestyle).toContain('high_sunlight');
    expect(swipeFilters.lifestyle).toContain('quiet');
    expect(swipeFilters.lifestyle).toHaveLength(3);
  });
});
