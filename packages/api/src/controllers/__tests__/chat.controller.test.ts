import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../../index';
import { pool } from '../../database/client';
import jwt from 'jsonwebtoken';

describe('Chat Controller', () => {
  let tenantToken: string;
  let landlordToken: string;
  let tenantId: string;
  let landlordId: string;
  let propertyId: string;
  let conversationId: string;
  const tenantPhone = `${9000000000 + Math.floor(Math.random() * 999999999)}`;
  const landlordPhone = `${9000000000 + Math.floor(Math.random() * 999999999)}`;

  beforeAll(async () => {
    // Create test tenant user
    const tenantResult = await pool.query(
      `INSERT INTO users (name, phone, role) 
       VALUES ('Test Tenant Chat', $1, 'tenant') 
       RETURNING id`,
      [tenantPhone]
    );
    tenantId = tenantResult.rows[0].id;

    // Create test landlord user
    const landlordResult = await pool.query(
      `INSERT INTO users (name, phone, role) 
       VALUES ('Test Landlord Chat', $1, 'landlord') 
       RETURNING id`,
      [landlordPhone]
    );
    landlordId = landlordResult.rows[0].id;

    // Create landlord profile
    await pool.query(
      `INSERT INTO landlord_profiles (user_id) VALUES ($1)`,
      [landlordId]
    );

    // Create test property (using actual schema)
    const propertyResult = await pool.query(
      `INSERT INTO properties (
        landlord_id, address, latitude, longitude, city, neighborhood,
        property_type, configuration, size_sqft, furnishing,
        rent, security_deposit, status, amenities, available_from
      ) VALUES (
        $1, '123 Test St, Mumbai', 19.1136, 72.8697, 'Mumbai', 'Andheri',
        'apartment', '2bhk', 1000, 'semi_furnished',
        25000, 50000, 'available', '["wifi", "parking"]'::jsonb, '2025-01-01'
      ) RETURNING id`,
      [landlordId]
    );
    propertyId = propertyResult.rows[0].id;

    // Generate JWT tokens
    const secret = process.env.JWT_SECRET || 'test-secret';
    tenantToken = jwt.sign({ userId: tenantId, role: 'tenant' }, secret, { expiresIn: '1h' });
    landlordToken = jwt.sign({ userId: landlordId, role: 'landlord' }, secret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE tenant_id = $1)', [tenantId]);
    await pool.query('DELETE FROM conversations WHERE tenant_id = $1', [tenantId]);
    await pool.query('DELETE FROM properties WHERE landlord_id = $1', [landlordId]);
    await pool.query('DELETE FROM landlord_profiles WHERE user_id = $1', [landlordId]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [tenantId, landlordId]);
  });

  describe('POST /api/chat/conversations', () => {
    it('should start a new conversation', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ property_id: propertyId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.conversation).toBeDefined();
      expect(response.body.conversation.property_id).toBe(propertyId);
      expect(response.body.conversation.tenant_id).toBe(tenantId);
      expect(response.body.conversation.landlord_id).toBe(landlordId);

      conversationId = response.body.conversation.id;
    });

    it('should return existing conversation if already exists', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ property_id: propertyId });

      expect(response.status).toBe(200);
      expect(response.body.conversation.id).toBe(conversationId);
    });

    it('should fail without property_id', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('property_id is required');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .send({ property_id: propertyId });

      expect(response.status).toBe(401);
    });

    it('should prevent landlord from starting conversation with themselves', async () => {
      const response = await request(app)
        .post('/api/chat/conversations')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ property_id: propertyId });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot start conversation with yourself');
    });
  });

  describe('GET /api/chat/conversations', () => {
    it('should get all conversations for tenant', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.conversations)).toBe(true);
      expect(response.body.conversations.length).toBeGreaterThan(0);
    });

    it('should get all conversations for landlord', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.conversations)).toBe(true);
    });
  });

  describe('GET /api/chat/conversations/:id', () => {
    it('should get a specific conversation', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.conversation.id).toBe(conversationId);
    });

    it('should fail for non-existent conversation', async () => {
      const response = await request(app)
        .get('/api/chat/conversations/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/chat/conversations/:id/messages', () => {
    it('should send a message', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ content: 'Hello, I am interested in this property!' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.content).toBe('Hello, I am interested in this property!');
      expect(response.body.message.sender_id).toBe(tenantId);
    });

    it('should fail without content', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('content is required');
    });
  });

  describe('GET /api/chat/conversations/:id/messages', () => {
    it('should get messages for a conversation', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.messages)).toBe(true);
      // Should have at least the system message + our test message
      expect(response.body.messages.length).toBeGreaterThan(0);
    });

    it('should support pagination with limit', async () => {
      const response = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages?limit=1`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.messages.length).toBeLessThanOrEqual(1);
    });
  });

  describe('POST /api/chat/conversations/:id/read', () => {
    it('should mark messages as read', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/chat/unread', () => {
    it('should get unread message count', async () => {
      const response = await request(app)
        .get('/api/chat/unread')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.unread_count).toBe('number');
    });
  });

  describe('GET /api/chat/quick-replies', () => {
    it('should get quick reply templates', async () => {
      const response = await request(app)
        .get('/api/chat/quick-replies?category=greeting')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should fail with invalid category', async () => {
      const response = await request(app)
        .get('/api/chat/quick-replies?category=invalid')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/chat/conversations/:id/archive', () => {
    it('should archive a conversation', async () => {
      const response = await request(app)
        .post(`/api/chat/conversations/${conversationId}/archive`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Conversation archived');
    });

    it('should not show archived conversation in list', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(response.status).toBe(200);
      const archivedConv = response.body.conversations.find((c: any) => c.id === conversationId);
      expect(archivedConv).toBeUndefined();
    });
  });
});
