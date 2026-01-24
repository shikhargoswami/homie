/**
 * Chat Feature Module
 * 
 * Handles the messaging user journey:
 * - Conversation list
 * - Individual chat
 * - Real-time messaging
 */

// Screens
export { default as ChatListScreen } from './screens/ChatListScreen';
export { default as ChatScreen } from './screens/ChatScreen';

// Context
export { ChatProvider, useChatContext, type Message, type Conversation } from './contexts/ChatContext';

// Hooks
export { useChat } from './hooks/useChat';
