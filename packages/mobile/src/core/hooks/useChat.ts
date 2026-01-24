/**
 * useChat Hook
 * 
 * This hook provides access to the shared chat state via ChatContext.
 * It's a thin wrapper around useChatContext for backward compatibility.
 * 
 * All chat state (conversations, messages, etc.) is now shared globally
 * through the ChatProvider, ensuring all components see the same data.
 */

import { useChatContext, Message, Conversation } from '../contexts/ChatContext';

// Re-export types for backward compatibility
export type { Message, Conversation };

/**
 * useChat hook - provides access to shared chat functionality
 * 
 * Usage:
 * ```tsx
 * const { 
 *   conversations, 
 *   startConversation, 
 *   sendMessage 
 * } = useChat();
 * ```
 * 
 * Note: The ChatProvider must be present in the component tree.
 */
export function useChat() {
  return useChatContext();
}

// Default export for convenience
export default useChat;
