import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  startConversation,
  getConversations,
  getConversationById,
  getMessages,
  postMessage,
  getUnreadMessages,
  getQuickReplies,
  archiveConversationController,
  markAsRead,
} from '../controllers/chat.controller';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get('/conversations', getConversations);

/**
 * @route   POST /api/chat/conversations
 * @desc    Start or get existing conversation with landlord
 * @access  Private
 * @body    { property_id: string }
 */
router.post('/conversations', startConversation);

/**
 * @route   GET /api/chat/conversations/:id
 * @desc    Get a specific conversation
 * @access  Private
 */
router.get('/conversations/:id', getConversationById);

/**
 * @route   GET /api/chat/conversations/:id/messages
 * @desc    Get messages for a conversation
 * @access  Private
 * @query   limit (default 50), before (ISO date for pagination)
 */
router.get('/conversations/:id/messages', getMessages);

/**
 * @route   POST /api/chat/conversations/:id/messages
 * @desc    Send a message (REST fallback)
 * @access  Private
 * @body    { content: string, message_type?: string, metadata?: object }
 */
router.post('/conversations/:id/messages', postMessage);

/**
 * @route   POST /api/chat/conversations/:id/read
 * @desc    Mark all messages as read in conversation
 * @access  Private
 */
router.post('/conversations/:id/read', markAsRead);

/**
 * @route   POST /api/chat/conversations/:id/archive
 * @desc    Archive a conversation
 * @access  Private
 */
router.post('/conversations/:id/archive', archiveConversationController);

/**
 * @route   GET /api/chat/unread
 * @desc    Get total unread message count
 * @access  Private
 */
router.get('/unread', getUnreadMessages);

/**
 * @route   GET /api/chat/quick-replies
 * @desc    Get quick reply templates
 * @access  Private
 * @query   category (greeting, viewing, negotiation, general)
 */
router.get('/quick-replies', getQuickReplies);

export default router;
