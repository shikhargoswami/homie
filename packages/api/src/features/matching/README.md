# Matching Feature

## Overview
Handles the matching user journey including tenant-property matching and landlord-tenant matching.

## User Journey Steps
1. Tenant swipes on properties (or Landlord swipes on tenants)
2. Swipe action is recorded (like/dislike)
3. If mutual interest → Match created
4. Both parties notified
5. Chat becomes available

## Files
- `matching.controller.ts` - Request handlers for matching
- `landlord-swipe.controller.ts` - Landlord swipe handlers
- `matching.routes.ts` - Tenant matching routes
- `matches.routes.ts` - Match list routes
- `matching.service.ts` - Matching business logic
- `landlord-swipe.service.ts` - Landlord swipe logic

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/matching/swipe` | Record a swipe action |
| GET | `/api/matching/candidates` | Get swipe candidates |
| GET | `/api/matches` | Get user's matches |
| GET | `/api/matches/:id` | Get match details |

## Match Algorithm
1. Check if property/tenant already swiped
2. Record swipe in database
3. Check for mutual interest
4. If match: create match record, notify both parties
5. Return match status

## Testing
```bash
npm test -- --testPathPatterns="matching"
```

## Related Features
- [Discovery](../discovery/README.md) - Discovery provides candidates
- [Chat](../chat/README.md) - Matches enable chat
