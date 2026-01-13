import { pool } from '../database/client';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'viewing_request' | 'system';
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: Date;
}

export interface Conversation {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  status: 'active' | 'archived' | 'blocked';
  last_message_at: Date;
  created_at: Date;
}

export interface ConversationWithDetails extends Conversation {
  property_title?: string;
  property_image?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  last_message?: string;
  unread_count?: number;
}

// Store active socket connections by user ID
const activeConnections = new Map<string, Socket>();

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server for real-time chat
 */
export function initializeSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    // Handle user authentication
    socket.on('authenticate', (userId: string) => {
      console.log(`User ${userId} authenticated on socket ${socket.id}`);
      activeConnections.set(userId, socket);
      socket.data.userId = userId;

      // Join user to their personal room
      socket.join(`user:${userId}`);
    });

    // Handle joining a conversation room
    socket.on('join_conversation', (conversationId: string) => {
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      socket.join(`conversation:${conversationId}`);
    });

    // Handle leaving a conversation room
    socket.on('leave_conversation', (conversationId: string) => {
      console.log(`Socket ${socket.id} left conversation ${conversationId}`);
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle sending a message
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      messageType?: 'text' | 'image' | 'viewing_request' | 'system';
      metadata?: Record<string, unknown>;
    }) => {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      try {
        const message = await sendMessage(
          data.conversationId,
          userId,
          data.content,
          data.messageType || 'text',
          data.metadata
        );

        // Emit to all users in the conversation
        io?.to(`conversation:${data.conversationId}`).emit('new_message', message);

        // Also emit to the conversation participants' personal rooms for notification
        const conversation = await getConversation(data.conversationId);
        if (conversation) {
          const otherUserId = conversation.tenant_id === userId 
            ? conversation.landlord_id 
            : conversation.tenant_id;
          io?.to(`user:${otherUserId}`).emit('message_notification', {
            conversation_id: data.conversationId,
            message,
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (conversationId: string) => {
      const userId = socket.data.userId;
      if (userId) {
        socket.to(`conversation:${conversationId}`).emit('user_typing', {
          conversationId,
          userId,
        });
      }
    });

    // Handle stop typing
    socket.on('stop_typing', (conversationId: string) => {
      const userId = socket.data.userId;
      if (userId) {
        socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
          conversationId,
          userId,
        });
      }
    });

    // Handle marking messages as read
    socket.on('mark_read', async (conversationId: string) => {
      const userId = socket.data.userId;
      if (!userId) return;

      try {
        await markMessagesAsRead(conversationId, userId);
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      if (userId) {
        activeConnections.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Check if a user is online
 */
export function isUserOnline(userId: string): boolean {
  return activeConnections.has(userId);
}

/**
 * Get or create a conversation between tenant and landlord for a property
 */
export async function getOrCreateConversation(
  propertyId: string,
  tenantId: string,
  landlordId: string
): Promise<Conversation> {
  // Check if conversation already exists
  const existingResult = await pool.query<Conversation>(
    `SELECT * FROM conversations 
     WHERE property_id = $1 AND tenant_id = $2 AND landlord_id = $3`,
    [propertyId, tenantId, landlordId]
  );

  if (existingResult.rows.length > 0) {
    return existingResult.rows[0];
  }

  // First, ensure there's a match record (create if doesn't exist)
  let matchId: string;
  const existingMatch = await pool.query(
    `SELECT id FROM matches WHERE property_id = $1 AND tenant_id = $2`,
    [propertyId, tenantId]
  );

  if (existingMatch.rows.length > 0) {
    matchId = existingMatch.rows[0].id;
  } else {
    // Create a match record
    const matchResult = await pool.query(
      `INSERT INTO matches (property_id, tenant_id, landlord_id, tenant_swiped, tenant_swipe_direction, tenant_swiped_at, match_score)
       VALUES ($1, $2, $3, true, 'right', CURRENT_TIMESTAMP, 80)
       RETURNING id`,
      [propertyId, tenantId, landlordId]
    );
    matchId = matchResult.rows[0].id;
  }

  // Create new conversation with match_id
  const result = await pool.query<Conversation>(
    `INSERT INTO conversations (match_id, property_id, tenant_id, landlord_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [matchId, propertyId, tenantId, landlordId]
  );

  // Send system message about conversation start
  await sendMessage(
    result.rows[0].id,
    landlordId, // System messages attributed to landlord
    'Conversation started. Feel free to ask questions about the property!',
    'system'
  );

  return result.rows[0];
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const result = await pool.query<Conversation>(
    'SELECT * FROM conversations WHERE id = $1',
    [conversationId]
  );
  return result.rows[0] || null;
}

/**
 * Get all conversations for a user with details
 */
export async function getUserConversations(userId: string): Promise<ConversationWithDetails[]> {
  const result = await pool.query<ConversationWithDetails>(
    `SELECT 
      c.*,
      p.address || ', ' || p.neighborhood as property_title,
      p.photos->0->>'url' as property_image,
      CASE 
        WHEN c.tenant_id = $1 THEN u_landlord.name
        ELSE u_tenant.name
      END as other_user_name,
      CASE 
        WHEN c.tenant_id = $1 THEN NULL
        ELSE NULL
      END as other_user_avatar,
      m.content as last_message,
      (
        SELECT COUNT(*)::int 
        FROM messages 
        WHERE conversation_id = c.id 
          AND sender_id != $1 
          AND is_read = false
      ) as unread_count
    FROM conversations c
    JOIN properties p ON c.property_id = p.id
    JOIN users u_tenant ON c.tenant_id = u_tenant.id
    JOIN users u_landlord ON c.landlord_id = u_landlord.id
    LEFT JOIN tenant_profiles tp ON c.tenant_id = tp.user_id
    LEFT JOIN landlord_profiles lp ON c.landlord_id = lp.user_id
    LEFT JOIN LATERAL (
      SELECT content FROM messages 
      WHERE conversation_id = c.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) m ON true
    WHERE (c.tenant_id = $1 OR c.landlord_id = $1)
      AND c.status = 'active'
    ORDER BY c.last_message_at DESC NULLS LAST`,
    [userId]
  );

  return result.rows;
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: 'text' | 'image' | 'viewing_request' | 'system' = 'text',
  metadata?: Record<string, unknown>
): Promise<Message> {
  const result = await pool.query<Message>(
    `INSERT INTO messages (conversation_id, sender_id, content, message_type, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [conversationId, senderId, content, messageType, metadata ? JSON.stringify(metadata) : null]
  );

  return result.rows[0];
}

/**
 * Get messages for a conversation with pagination
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  before?: Date
): Promise<Message[]> {
  let query = `
    SELECT * FROM messages 
    WHERE conversation_id = $1
  `;
  const params: (string | number | Date)[] = [conversationId];

  if (before) {
    query += ` AND created_at < $2`;
    params.push(before);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query<Message>(query, params);

  // Return in chronological order
  return result.rows.reverse();
}

/**
 * Mark all messages as read for a user in a conversation
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  await pool.query(
    `UPDATE messages 
     SET is_read = true 
     WHERE conversation_id = $1 
       AND sender_id != $2 
       AND is_read = false`,
    [conversationId, userId]
  );
}

/**
 * Get unread message count for a user across all conversations
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::int as count
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.tenant_id = $1 OR c.landlord_id = $1)
       AND m.sender_id != $1
       AND m.is_read = false`,
    [userId]
  );

  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Get quick reply templates
 */
export async function getQuickReplyTemplates(
  category: 'greeting' | 'viewing' | 'negotiation' | 'general'
): Promise<{ id: string; template: string; category: string }[]> {
  const result = await pool.query(
    `SELECT id, template, category 
     FROM quick_reply_templates 
     WHERE category = $1 AND is_active = true
     ORDER BY template`,
    [category]
  );

  return result.rows;
}

/**
 * Archive a conversation
 */
export async function archiveConversation(conversationId: string): Promise<void> {
  await pool.query(
    `UPDATE conversations SET status = 'archived' WHERE id = $1`,
    [conversationId]
  );
}

/**
 * Block a conversation (for reporting)
 */
export async function blockConversation(conversationId: string): Promise<void> {
  await pool.query(
    `UPDATE conversations SET status = 'blocked' WHERE id = $1`,
    [conversationId]
  );
}

// Export for testing
export { activeConnections };
