import { Request, Response, NextFunction } from 'express';
import {
  getOrCreateConversation,
  getConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
  getUnreadCount,
  getQuickReplyTemplates,
  archiveConversation,
  isUserOnline,
} from '../services/chat.service';
import { pool } from '../database/client';

/**
 * Start or get existing conversation with a landlord about a property
 * POST /api/chat/conversations
 */
export async function startConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { property_id } = req.body;
    if (!property_id) {
      res.status(400).json({ error: 'property_id is required' });
      return;
    }

    // Get property to find landlord
    const propertyResult = await pool.query(
      'SELECT landlord_id FROM properties WHERE id = $1',
      [property_id]
    );

    if (propertyResult.rows.length === 0) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const landlordId = propertyResult.rows[0].landlord_id;

    // Prevent landlord from starting conversation with themselves
    if (landlordId === userId) {
      res.status(400).json({ error: 'Cannot start conversation with yourself' });
      return;
    }

    const conversation = await getOrCreateConversation(property_id, userId, landlordId);

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all conversations for current user
 * GET /api/chat/conversations
 */
export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversations = await getUserConversations(userId);

    // Add online status for each conversation's other user
    const conversationsWithStatus = conversations.map((conv) => {
      const otherUserId = conv.tenant_id === userId ? conv.landlord_id : conv.tenant_id;
      return {
        ...conv,
        is_other_user_online: isUserOnline(otherUserId),
      };
    });

    res.status(200).json({
      success: true,
      conversations: conversationsWithStatus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific conversation by ID
 * GET /api/chat/conversations/:id
 */
export async function getConversationById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const conversation = await getConversation(id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Verify user is part of conversation
    if (conversation.tenant_id !== userId && conversation.landlord_id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const otherUserId = conversation.tenant_id === userId 
      ? conversation.landlord_id 
      : conversation.tenant_id;

    res.status(200).json({
      success: true,
      conversation: {
        ...conversation,
        is_other_user_online: isUserOnline(otherUserId),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages for a conversation
 * GET /api/chat/conversations/:id/messages
 */
export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { limit = '50', before } = req.query;

    // Verify user has access to conversation
    const conversation = await getConversation(id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.tenant_id !== userId && conversation.landlord_id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const messages = await getConversationMessages(
      id,
      parseInt(limit as string, 10),
      before ? new Date(before as string) : undefined
    );

    // Mark messages as read
    await markMessagesAsRead(id, userId);

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a message (REST fallback for non-WebSocket clients)
 * POST /api/chat/conversations/:id/messages
 */
export async function postMessage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { content, message_type = 'text', metadata } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    // Verify user has access to conversation
    const conversation = await getConversation(id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.tenant_id !== userId && conversation.landlord_id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (conversation.status !== 'active') {
      res.status(400).json({ error: 'Conversation is not active' });
      return;
    }

    const message = await sendMessage(id, userId, content, message_type, metadata);

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread message count
 * GET /api/chat/unread
 */
export async function getUnreadMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const count = await getUnreadCount(userId);

    res.status(200).json({
      success: true,
      unread_count: count,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get quick reply templates
 * GET /api/chat/quick-replies
 */
export async function getQuickReplies(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { role = 'tenant' } = req.query;

    const validRoles = ['tenant', 'landlord'];
    if (!validRoles.includes(role as string)) {
      res.status(400).json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
      return;
    }

    const templates = await getQuickReplyTemplates(
      role as 'tenant' | 'landlord'
    );

    res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Archive a conversation
 * POST /api/chat/conversations/:id/archive
 */
export async function archiveConversationController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Verify user has access to conversation
    const conversation = await getConversation(id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.tenant_id !== userId && conversation.landlord_id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await archiveConversation(id);

    res.status(200).json({
      success: true,
      message: 'Conversation archived',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark messages as read
 * POST /api/chat/conversations/:id/read
 */
export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Verify user has access to conversation
    const conversation = await getConversation(id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.tenant_id !== userId && conversation.landlord_id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await markMessagesAsRead(id, userId);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
}
