import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

/**
 * useChat Hook Tests
 * 
 * Tests for:
 * - Hook exports correct interface from ChatContext
 * - Backward compatibility with previous API
 * - Type exports
 */

// Mock ChatContext
const mockChatContext = {
  isConnected: true,
  conversations: [],
  messages: [],
  isTyping: false,
  typingUserId: null,
  unreadCount: 0,
  currentConversationId: null,
  isLoading: false,
  setCurrentConversationId: jest.fn(),
  fetchConversations: jest.fn(),
  fetchMessages: jest.fn(),
  startConversation: jest.fn(),
  sendMessage: jest.fn(),
  sendTyping: jest.fn(),
  markAsRead: jest.fn(),
  fetchUnreadCount: jest.fn(),
  archiveConversation: jest.fn(),
  addConversation: jest.fn(),
  updateConversation: jest.fn(),
};

jest.mock('../../contexts/ChatContext', () => ({
  useChatContext: jest.fn(() => mockChatContext),
  Message: {},
  Conversation: {},
}));

// Import after mocks
import { useChat, Message, Conversation } from '../useChat';

describe('useChat hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook interface', () => {
    it('should return all ChatContext properties and methods', () => {
      const { result } = renderHook(() => useChat());

      // Check all properties exist
      expect(result.current).toHaveProperty('isConnected');
      expect(result.current).toHaveProperty('conversations');
      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('isTyping');
      expect(result.current).toHaveProperty('typingUserId');
      expect(result.current).toHaveProperty('unreadCount');
      expect(result.current).toHaveProperty('currentConversationId');
      expect(result.current).toHaveProperty('isLoading');

      // Check all methods exist
      expect(result.current).toHaveProperty('setCurrentConversationId');
      expect(result.current).toHaveProperty('fetchConversations');
      expect(result.current).toHaveProperty('fetchMessages');
      expect(result.current).toHaveProperty('startConversation');
      expect(result.current).toHaveProperty('sendMessage');
      expect(result.current).toHaveProperty('sendTyping');
      expect(result.current).toHaveProperty('markAsRead');
      expect(result.current).toHaveProperty('fetchUnreadCount');
      expect(result.current).toHaveProperty('archiveConversation');
      expect(result.current).toHaveProperty('addConversation');
      expect(result.current).toHaveProperty('updateConversation');
    });

    it('should return correct initial values', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.conversations).toEqual([]);
      expect(result.current.messages).toEqual([]);
      expect(result.current.isTyping).toBe(false);
      expect(result.current.typingUserId).toBe(null);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.currentConversationId).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return functions that can be called', () => {
      const { result } = renderHook(() => useChat());

      expect(typeof result.current.setCurrentConversationId).toBe('function');
      expect(typeof result.current.fetchConversations).toBe('function');
      expect(typeof result.current.fetchMessages).toBe('function');
      expect(typeof result.current.startConversation).toBe('function');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.sendTyping).toBe('function');
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.fetchUnreadCount).toBe('function');
      expect(typeof result.current.archiveConversation).toBe('function');
      expect(typeof result.current.addConversation).toBe('function');
      expect(typeof result.current.updateConversation).toBe('function');
    });
  });

  describe('Type exports', () => {
    it('should export Message type', () => {
      // Type checking at compile time - this test ensures exports exist
      const messageType: Message | undefined = undefined;
      expect(messageType).toBeUndefined();
    });

    it('should export Conversation type', () => {
      // Type checking at compile time - this test ensures exports exist
      const conversationType: Conversation | undefined = undefined;
      expect(conversationType).toBeUndefined();
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain same API as previous useChat implementation', () => {
      const { result } = renderHook(() => useChat());

      // These were the main methods in the previous implementation
      // Verify they still exist for backward compatibility
      
      // Connection status
      expect('isConnected' in result.current).toBe(true);
      
      // Data
      expect('conversations' in result.current).toBe(true);
      expect('messages' in result.current).toBe(true);
      
      // Actions
      expect('startConversation' in result.current).toBe(true);
      expect('sendMessage' in result.current).toBe(true);
      expect('fetchConversations' in result.current).toBe(true);
      expect('fetchMessages' in result.current).toBe(true);
      expect('markAsRead' in result.current).toBe(true);
      
      // Typing indicators
      expect('isTyping' in result.current).toBe(true);
      expect('sendTyping' in result.current).toBe(true);
    });

    it('should be usable with destructuring pattern', () => {
      const { result } = renderHook(() => useChat());

      // Common destructuring patterns that should work
      const {
        conversations,
        messages,
        startConversation,
        sendMessage,
        fetchConversations,
        isLoading,
      } = result.current;

      expect(conversations).toEqual([]);
      expect(messages).toEqual([]);
      expect(typeof startConversation).toBe('function');
      expect(typeof sendMessage).toBe('function');
      expect(typeof fetchConversations).toBe('function');
      expect(isLoading).toBe(false);
    });
  });

  describe('Integration with components', () => {
    it('should provide consistent interface for ChatListScreen', () => {
      const { result } = renderHook(() => useChat());

      // ChatListScreen uses these
      const {
        conversations,
        fetchConversations,
        isLoading,
      } = result.current;

      expect(Array.isArray(conversations)).toBe(true);
      expect(typeof fetchConversations).toBe('function');
      expect(typeof isLoading).toBe('boolean');
    });

    it('should provide consistent interface for ChatScreen', () => {
      const { result } = renderHook(() => useChat());

      // ChatScreen uses these
      const {
        messages,
        isTyping,
        isConnected,
        fetchMessages,
        sendMessage,
        sendTyping,
        markAsRead,
        setCurrentConversationId,
      } = result.current;

      expect(Array.isArray(messages)).toBe(true);
      expect(typeof isTyping).toBe('boolean');
      expect(typeof isConnected).toBe('boolean');
      expect(typeof fetchMessages).toBe('function');
      expect(typeof sendMessage).toBe('function');
      expect(typeof sendTyping).toBe('function');
      expect(typeof markAsRead).toBe('function');
      expect(typeof setCurrentConversationId).toBe('function');
    });

    it('should provide consistent interface for MatchesScreen', () => {
      const { result } = renderHook(() => useChat());

      // MatchesScreen uses startConversation
      const { startConversation } = result.current;

      expect(typeof startConversation).toBe('function');
    });

    it('should provide consistent interface for DashboardScreen', () => {
      const { result } = renderHook(() => useChat());

      // DashboardScreen uses startConversation
      const { startConversation } = result.current;

      expect(typeof startConversation).toBe('function');
    });
  });
});

describe('useChat multiple instance behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return same context reference from multiple calls', () => {
    const { result: result1 } = renderHook(() => useChat());
    const { result: result2 } = renderHook(() => useChat());

    // Both should get the same mock context
    expect(result1.current.isConnected).toBe(result2.current.isConnected);
    expect(result1.current.conversations).toBe(result2.current.conversations);
    expect(result1.current.messages).toBe(result2.current.messages);
  });
});
