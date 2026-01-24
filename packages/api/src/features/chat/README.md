# Chat Feature

## Overview
Handles the messaging user journey including real-time chat, quick replies, and conversation management.

## User Journey Steps
1. User views conversation list
2. User opens a conversation
3. User sends/receives messages (real-time via WebSocket)
4. User can use quick reply templates
5. Messages are marked as read

## Files
- `chat.controller.ts` - Request handlers for chat endpoints
- `chat.routes.ts` - Route definitions
- `chat.service.ts` - Chat business logic
- `chat-antibypass.service.ts` - Prevents sharing contact info before premium

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List user's conversations |
| POST | `/api/chat/conversations` | Start new conversation |
| GET | `/api/chat/conversations/:id/messages` | Get messages |
| POST | `/api/chat/conversations/:id/messages` | Send message |
| POST | `/api/chat/conversations/:id/read` | Mark as read |
| GET | `/api/chat/unread` | Get unread count |
| GET | `/api/chat/quick-replies` | Get quick reply templates |

## WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `send_message` | Client → Server | Send a message |
| `new_message` | Server → Client | New message received |
| `typing` | Client → Server | User is typing |
| `user_typing` | Server → Client | Other user typing |
| `mark_read` | Client → Server | Mark messages read |

## Testing
```bash
npm test -- --testPathPatterns="chat"
```

## Related Features
- [Matching](../matching/README.md) - Matches enable chat
- [Viewings](../viewings/README.md) - Viewings can be scheduled via chat
