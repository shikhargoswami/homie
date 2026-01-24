# Chat Feature (Mobile)

## Overview
Handles the messaging user journey on mobile with real-time capabilities.

## User Journey Steps
1. User views conversation list → `ChatListScreen`
2. User opens a conversation → `ChatScreen`
3. User sends/receives messages in real-time
4. User can use quick reply templates

## Screens
| Screen | Description |
|--------|-------------|
| `ChatListScreen` | List of all conversations with unread badges |
| `ChatScreen` | Individual chat with real-time messaging |

## Key Components
- `ChatContext` - Global chat state management
- `useChat` hook - Chat functionality access

## State Management
Uses `ChatContext` for:
- WebSocket connection management
- Message state
- Typing indicators
- Unread counts

## Real-time Features
- Instant message delivery
- Typing indicators
- Online status
- Read receipts

## Testing
```bash
npm test -- --testPathPatterns="chat"
```

## Related Features
- [Matching](../matching/README.md) - Matches enable chat
- [Viewings](../viewings/README.md) - Schedule viewings via chat
