import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';
import { appEvents, AppEventTypes } from '../utils/appEvents';

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

interface ChatContextType {
  isConnected: boolean;
  conversations: Conversation[];
  messages: Message[];
  isTyping: boolean;
  typingUserId: string | null;
  unreadCount: number;
  currentConversationId: string | null;
  isLoading: boolean;
  setCurrentConversationId: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  startConversation: (propertyId: string, tenantId?: string) => Promise<Conversation | null>;
  sendMessage: (
    conversationId: string,
    content: string,
    messageType?: 'text' | 'image' | 'viewing_request',
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  sendTyping: (conversationId: string) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// WebSocket URL - derive from API URL
const WS_URL = API_BASE_URL ? API_BASE_URL.replace(/^http/, 'ws') : 'ws://192.168.0.103:3000';

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      const userJson = await AsyncStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id;
      
      if (!token || !userId) return;

      socketRef.current = io(WS_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      socketRef.current.on('connect', () => {
        console.log('[ChatContext] Socket connected');
        setIsConnected(true);
        socketRef.current?.emit('authenticate', userId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('[ChatContext] Socket disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('new_message', (message: Message & { tempId?: string }) => {
        console.log('[ChatContext] Received new_message:', message.id, 'tempId:', message.tempId);
        setMessages(prev => {
          // If we have a tempId, replace the optimistic message
          if (message.tempId) {
            const hasTemp = prev.find(m => m.id === message.tempId);
            if (hasTemp) {
              console.log('[ChatContext] Replacing optimistic message:', message.tempId, 'with:', message.id);
              return prev.map(m => m.id === message.tempId ? message : m);
            }
          }
          // Avoid duplicates
          if (prev.find(m => m.id === message.id)) {
            console.log('[ChatContext] Duplicate message, skipping:', message.id);
            return prev;
          }
          return [...prev, message];
        });
        
        // Update conversation's last message
        setConversations(prev => 
          prev.map(c => 
            c.id === message.conversation_id
              ? { ...c, last_message: message.content, last_message_at: message.created_at }
              : c
          )
        );
      });

      socketRef.current.on('message_notification', (data: { conversation_id: string; message: Message }) => {
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
          
          // Emit event for tab bar badge animation
          appEvents.emit(AppEventTypes.NEW_MESSAGE, {
            conversationId: data.conversation_id,
            message: data.message,
          });
        }
      });

      socketRef.current.on('user_typing', (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === currentConversationId) {
          setTypingUserId(data.userId);
          setIsTyping(true);
        }
      });

      socketRef.current.on('user_stop_typing', (data: { conversationId: string; userId: string }) => {
        if (data.conversationId === currentConversationId) {
          setIsTyping(false);
          setTypingUserId(null);
        }
      });

      socketRef.current.on('messages_read', () => {
        // Update UI to show messages were read
      });
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentConversationId]);

  // Join conversation room when currentConversationId changes
  useEffect(() => {
    if (socketRef.current && currentConversationId) {
      socketRef.current.emit('join_conversation', currentConversationId);
    }

    return () => {
      if (socketRef.current && currentConversationId) {
        socketRef.current.emit('leave_conversation', currentConversationId);
      }
    };
  }, [currentConversationId]);

  // Fetch conversations via REST
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      console.log('[ChatContext] Fetching conversations...');
      
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('[ChatContext] Loaded conversations:', data.conversations?.length || 0);
        setConversations(data.conversations || []);
      } else {
        console.error('[ChatContext] API returned error:', data.error);
      }
    } catch (error) {
      console.error('[ChatContext] Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
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
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('[ChatContext] Failed to fetch messages:', error);
    }
  }, []);

  // Start a conversation
  const startConversation = useCallback(async (propertyId: string, tenantId?: string): Promise<Conversation | null> => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const body: Record<string, string> = { property_id: propertyId };
      
      // Include tenant_id for landlords
      if (tenantId) {
        body.tenant_id = tenantId;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success && data.conversation) {
        // Add new conversation to state immediately
        setConversations(prev => {
          const exists = prev.find(c => c.id === data.conversation.id);
          if (exists) {
            return prev;
          }
          return [data.conversation, ...prev];
        });
        return data.conversation;
      }
      console.error('[ChatContext] startConversation failed:', data.error);
      return null;
    } catch (error) {
      console.error('[ChatContext] Failed to start conversation:', error);
      return null;
    }
  }, []);

  // Send message via WebSocket (or REST fallback)
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'viewing_request' = 'text',
    metadata?: Record<string, unknown>
  ) => {
    // Get current user ID for optimistic update
    const userJson = await AsyncStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id;

    // Create optimistic message for immediate UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: userId || '',
      content,
      message_type: messageType,
      metadata,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    // Add message optimistically (immediate UI update)
    console.log('[ChatContext] Adding optimistic message:', optimisticMessage.id);
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Update conversation's last message immediately
    setConversations(prev => 
      prev.map(c => 
        c.id === conversationId
          ? { ...c, last_message: content, last_message_at: new Date().toISOString() }
          : c
      )
    );

    if (socketRef.current?.connected) {
      console.log('[ChatContext] Sending message via WebSocket');
      socketRef.current.emit('send_message', {
        conversationId,
        content,
        messageType,
        metadata,
        tempId, // Send temp ID so we can match on response
      });
    } else {
      // REST fallback
      console.log('[ChatContext] Socket not connected, using REST fallback');
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
        if (data.success && data.message) {
          // Replace optimistic message with real one
          console.log('[ChatContext] REST message sent, replacing optimistic message');
          setMessages(prev => prev.map(m => 
            m.id === tempId ? data.message : m
          ));
        } else {
          // Remove optimistic message on failure
          console.error('[ChatContext] REST send failed:', data.error);
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
      } catch (error) {
        console.error('[ChatContext] Failed to send message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', conversationId);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stop_typing', conversationId);
      }, 2000);
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_read', conversationId);
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
      console.error('[ChatContext] Failed to mark as read:', error);
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
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('[ChatContext] Failed to fetch unread count:', error);
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
      console.error('[ChatContext] Failed to archive conversation:', error);
    }
  }, []);

  // Add a new conversation to state
  const addConversation = useCallback((conversation: Conversation) => {
    setConversations(prev => {
      const exists = prev.find(c => c.id === conversation.id);
      if (exists) {
        return prev;
      }
      return [conversation, ...prev];
    });
  }, []);

  // Update an existing conversation
  const updateConversation = useCallback((conversationId: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(c => 
        c.id === conversationId 
          ? { ...c, ...updates }
          : c
      )
    );
  }, []);

  const value: ChatContextType = {
    isConnected,
    conversations,
    messages,
    isTyping,
    typingUserId,
    unreadCount,
    currentConversationId,
    isLoading,
    setCurrentConversationId,
    fetchConversations,
    fetchMessages,
    startConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    fetchUnreadCount,
    archiveConversation,
    addConversation,
    updateConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

// Export for backwards compatibility
export { ChatContext };
