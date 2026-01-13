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
    req.userId = 'test-user-id';
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

describe('Users API - Onboarding Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/users/profile/onboarding', () => {
    it('should update user to tenant role with search type', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE users
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT tenant_profiles

      const response = await request(app)
        .put('/api/users/profile/onboarding')
        .send({
          userType: 'tenant',
          searchType: 'full_home',
          name: 'John Doe',
          employmentStatus: 'employed',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('tenant');

      // Verify user role update query was called
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['test-user-id', 'tenant', 'John Doe'])
      );
    });

    it('should update user to landlord role', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE users
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // INSERT landlord_profiles

      const response = await request(app)
        .put('/api/users/profile/onboarding')
        .send({
          userType: 'landlord',
          name: 'Jane Landlord',
          email: 'jane@landlord.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('landlord');
    });

    it('should create tenant profile for full_home search type', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await request(app)
        .put('/api/users/profile/onboarding')
        .send({
          userType: 'tenant',
          searchType: 'full_home',
          name: 'Full Home Seeker',
          employmentStatus: 'employed',
        });

      // Verify tenant profile insert was called with full_home
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tenant_profiles'),
        expect.arrayContaining(['test-user-id', 'full_home', 'employed'])
      );
    });

    it('should create tenant profile for room_sharing search type', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await request(app)
        .put('/api/users/profile/onboarding')
        .send({
          userType: 'tenant',
          searchType: 'room_sharing',
          name: 'Room Seeker',
          employmentStatus: 'student',
        });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tenant_profiles'),
        expect.arrayContaining(['test-user-id', 'room_sharing', 'student'])
      );
    });
  });

  describe('PUT /api/users/profile/complete', () => {
    it('should mark profile as completed', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const response = await request(app)
        .put('/api/users/profile/complete')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile marked as completed');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['test-user-id'])
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('profile_completed = true'),
        expect.any(Array)
      );
    });
  });

  describe('PUT /api/users/preferences', () => {
    it('should update tenant preferences with locations and budget', async () => {
      // Mock getting user role
      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'tenant' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const response = await request(app)
        .put('/api/users/preferences')
        .send({
          preferred_locations: ['Koramangala', 'Indiranagar'],
          min_budget: 20000,
          max_budget: 40000,
          preferred_configuration: '2bhk',
          preferred_furnishing: 'semi-furnished',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should update landlord preferences', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'landlord' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const response = await request(app)
        .put('/api/users/preferences')
        .send({
          preferred_tenant_types: ['working_professional', 'family'],
          pets_allowed: true,
          smoking_allowed: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/users/preferences', () => {
    it('should return tenant preferences', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'tenant' }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{
            preferred_locations: ['Koramangala'],
            min_budget: 20000,
            max_budget: 40000,
          }],
          rowCount: 1,
        });

      const response = await request(app)
        .get('/api/users/preferences')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toBeDefined();
    });

    it('should return default preferences for new tenant', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'tenant' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const response = await request(app)
        .get('/api/users/preferences')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.data.preferences.min_budget).toBe(10000);
      expect(response.body.data.preferences.max_budget).toBe(50000);
    });
  });
});
