/**
 * Chat Feature Module
 * 
 * Handles the messaging user journey:
 * - Chat list
 * - Individual conversations
 * - Quick replies
 * - Real-time messaging
 * - Anti-bypass protection
 */

export * from './chat.controller';
export { default as chatRoutes } from './chat.routes';
export * from './chat.service';
export * from './chat-antibypass.service';
