import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// Get API URL from environment or use fallback
const API_BASE_URL = ENV_API_BASE_URL || 'http://192.168.0.109:3000';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'viewing_request' | 'system';
  metadata?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  status: 'active' | 'archived' | 'blocked';
  last_message_at: string;
  created_at: string;
  property_title?: string;
  property_image?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  last_message?: string;
  unread_count?: number;
  is_other_user_online?: boolean;
}

// WebSocket URL - derive from API URL
const WS_URL = API_BASE_URL ? API_BASE_URL.replace(/^http/, 'ws') : 'ws://192.168.0.103:3000';

let socket: Socket | null = null;

export function useChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id;
      
      if (!token || !userId) return;

      socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        socket?.emit('authenticate', userId);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('new_message', (message: Message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });

      socket.on('message_notification', (data: { conversation_id: string; message: Message }) => {
        // Update unread count if not in current conversation
        if (data.conversation_id !== currentConversationId) {
          setUnreadCount(prev => prev + 1);
          // Update conversation list
          setConversations(prev => 
            prev.map(c => 
              c.id === data.conversation_id 
                ? { 
                    ...c, 
                    last_message: data.message.content,
                    unread_count: (c.unread_count || 0) + 1,
                  }
                : c
            )
          );
        }
      });

      socket.on('user_typing', (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === currentConversationId) {
          setTypingUserId(data.userId);
          setIsTyping(true);
        }
      });

      socket.on('user_stop_typing', (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === currentConversationId) {
          setIsTyping(false);
          setTypingUserId(null);
        }
      });

      socket.on('messages_read', () => {
        // Update UI to show messages were read
      });
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // Join conversation room when currentConversationId changes
  useEffect(() => {
    if (socket && currentConversationId) {
      socket.emit('join_conversation', currentConversationId);
    }

    return () => {
      if (socket && currentConversationId) {
        socket.emit('leave_conversation', currentConversationId);
      }
    };
  }, [currentConversationId]);

  // Fetch conversations via REST
  const fetchConversations = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('[useChat] Fetching conversations from:', `${API_BASE_URL}/api/chat/conversations`);
      console.log('[useChat] Token exists:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('[useChat] Response status:', response.status);
      const data = await response.json();
      console.log('[useChat] Response data:', JSON.stringify(data).substring(0, 200));
      
      if (data.success) {
        console.log('[useChat] Setting conversations:', data.conversations?.length || 0);
        setConversations(data.conversations);
      } else {
        console.error('[useChat] API returned error:', data.error);
      }
    } catch (error) {
      console.error('[useChat] Failed to fetch conversations:', error);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, []);

  // Start a conversation
  const startConversation = useCallback(async (propertyId: string): Promise<Conversation | null> => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ property_id: propertyId }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchConversations();
        return data.conversation;
      }
      return null;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      return null;
    }
  }, [fetchConversations]);

  // Send message via WebSocket (or REST fallback)
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'viewing_request' = 'text',
    metadata?: Record<string, unknown>
  ) => {
    if (socket?.connected) {
      socket.emit('send_message', {
        conversationId,
        content,
        messageType,
        metadata,
      });
    } else {
      // REST fallback
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content, message_type: messageType, metadata }),
        });
        const data = await response.json();
        if (data.success) {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((conversationId: string) => {
    if (socket?.connected) {
      socket.emit('typing', conversationId);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socket?.emit('stop_typing', conversationId);
      }, 2000);
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (socket?.connected) {
      socket.emit('mark_read', conversationId);
    }
    
    // Also call REST endpoint
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Update local state
      setConversations(prev => 
        prev.map(c => 
          c.id === conversationId 
            ? { ...c, unread_count: 0 }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/api/chat/unread`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Archive conversation
  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  }, []);

  return {
    isConnected,
    conversations,
    messages,
    isTyping,
    typingUserId,
    unreadCount,
    currentConversationId,
    setCurrentConversationId,
    fetchConversations,
    fetchMessages,
    startConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    fetchUnreadCount,
    archiveConversation,
  };
}
