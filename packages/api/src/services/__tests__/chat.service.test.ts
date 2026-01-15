import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Mock } from 'jest-mock';

/**
 * Chat Service Tests
 * 
 * Tests for chat/messaging functionality
 * Note: Socket.IO functionality is tested separately
 */

// Mock database pool
jest.mock('../../database/client', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock anti-bypass service
jest.mock('../chat-antibypass.service', () => ({
  chatAntiBypassService: {
    canUserSendMessages: jest.fn(),
    checkContentForPhoneNumbers: jest.fn(),
  },
}));

import { pool } from '../../database/client';
import {
  getConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
  getUnreadCount,
  archiveConversation,
  blockConversation,
  isUserOnline,
  getOrCreateConversation,
} from '../chat.service';

describe('Chat Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConversation', () => {
    it('should return conversation by ID', async () => {
      const mockConversation = {
        id: 'conv-1',
        property_id: 'prop-1',
        tenant_id: 'tenant-1',
        landlord_id: 'landlord-1',
        status: 'active',
        last_message_at: new Date(),
        created_at: new Date(),
      };

      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [mockConversation],
      });

      const result = await getConversation('conv-1');

      expect(result).toEqual(mockConversation);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['conv-1']
      );
    });

    it('should return null when conversation not found', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      const result = await getConversation('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserConversations', () => {
    it('should return all conversations for user', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          property_id: 'prop-1',
          tenant_id: 'tenant-1',
          landlord_id: 'landlord-1',
          status: 'active',
          property_title: '123 MG Road, Koramangala',
          other_user_name: 'John Landlord',
          last_message: 'Hello!',
          unread_count: 2,
        },
        {
          id: 'conv-2',
          property_id: 'prop-2',
          tenant_id: 'tenant-1',
          landlord_id: 'landlord-2',
          status: 'active',
          property_title: '456 HSR Layout',
          other_user_name: 'Jane Landlord',
          last_message: 'When can you visit?',
          unread_count: 0,
        },
      ];

      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: mockConversations,
      });

      const result = await getUserConversations('tenant-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('conv-1');
      expect(result[0].unread_count).toBe(2);
    });

    it('should return empty array when no conversations', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      const result = await getUserConversations('new-user');

      expect(result).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('should create and return a new message', async () => {
      const mockMessage = {
        id: 'msg-1',
        conversation_id: 'conv-1',
        sender_id: 'tenant-1',
        content: 'Hello, I am interested in the property',
        message_type: 'text',
        metadata: null,
        read_at: null,
        created_at: new Date(),
      };

      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [mockMessage],
      });

      const result = await sendMessage('conv-1', 'tenant-1', 'Hello, I am interested in the property');

      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello, I am interested in the property');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO messages'),
        ['conv-1', 'tenant-1', 'Hello, I am interested in the property', 'text', null]
      );
    });

    it('should support different message types', async () => {
      const mockMessage = {
        id: 'msg-2',
        conversation_id: 'conv-1',
        sender_id: 'landlord-1',
        content: 'Property viewing request',
        message_type: 'viewing_request',
        metadata: { viewing_date: '2024-01-15' },
        read_at: null,
        created_at: new Date(),
      };

      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [mockMessage],
      });

      const result = await sendMessage(
        'conv-1',
        'landlord-1',
        'Property viewing request',
        'viewing_request',
        { viewing_date: '2024-01-15' }
      );

      expect(result.message_type).toBe('viewing_request');
    });
  });

  describe('getConversationMessages', () => {
    it('should return paginated messages', async () => {
      const mockMessages = [
        { id: 'msg-2', content: 'Second message', created_at: new Date() },
        { id: 'msg-1', content: 'First message', created_at: new Date() },
      ];

      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: mockMessages,
      });

      const result = await getConversationMessages('conv-1');

      expect(result).toHaveLength(2);
    });

    it('should support pagination with before parameter', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      await getConversationMessages('conv-1', 50, new Date('2024-01-15'));

      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark messages as read', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      await markMessagesAsRead('conv-1', 'tenant-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE messages'),
        expect.arrayContaining(['conv-1', 'tenant-1'])
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [{ count: '5' }],
      });

      const result = await getUnreadCount('tenant-1');

      expect(result).toBe(5);
    });

    it('should return 0 when no unread messages', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [{ count: '0' }],
      });

      const result = await getUnreadCount('tenant-1');

      expect(result).toBe(0);
    });
  });

  describe('archiveConversation', () => {
    it('should archive a conversation', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      await archiveConversation('conv-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversations'),
        expect.arrayContaining(['conv-1'])
      );
    });
  });

  describe('blockConversation', () => {
    it('should block a conversation', async () => {
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });

      await blockConversation('conv-1');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE conversations'),
        expect.arrayContaining(['conv-1'])
      );
    });
  });

  describe('isUserOnline', () => {
    it('should return false when user not connected', () => {
      const result = isUserOnline('offline-user');

      expect(result).toBe(false);
    });
  });

  describe('getOrCreateConversation', () => {
    it('should return existing conversation if found', async () => {
      const mockConversation = {
        id: 'conv-existing',
        property_id: 'prop-1',
        tenant_id: 'tenant-1',
        landlord_id: 'landlord-1',
        status: 'active',
      };

      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [mockConversation],
      });

      const result = await getOrCreateConversation('prop-1', 'tenant-1', 'landlord-1');

      expect(result.id).toBe('conv-existing');
    });

    it('should create new conversation if not found', async () => {
      const newConversation = {
        id: 'conv-new',
        property_id: 'prop-1',
        tenant_id: 'tenant-1',
        landlord_id: 'landlord-1',
        status: 'active',
      };

      // First query - check existing conversation (returns empty)
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });
      
      // Second query - check existing match (returns empty)
      (pool.query as Mock<any>).mockResolvedValueOnce({ rows: [] });
      
      // Third query - create match
      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [{ id: 'match-new' }],
      });
      
      // Fourth query - create conversation
      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [newConversation],
      });
      
      // Fifth query - send system message
      (pool.query as Mock<any>).mockResolvedValueOnce({
        rows: [{ id: 'msg-1', content: 'Conversation started' }],
      });

      const result = await getOrCreateConversation('prop-1', 'tenant-1', 'landlord-1');

      expect(result.id).toBe('conv-new');
      expect(pool.query).toHaveBeenCalledTimes(5);
    });
  });
});
