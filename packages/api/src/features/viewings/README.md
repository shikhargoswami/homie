# Viewings Feature

## Overview
Handles the property viewing user journey including scheduling, confirming, and completing viewings.

## User Journey Steps
1. Tenant requests viewing via chat
2. Landlord receives notification
3. Landlord approves/reschedules/declines
4. If approved → Viewing confirmed
5. Both parties attend viewing
6. Viewing marked as complete

## Files
- `viewing.controller.ts` - Request handlers for viewings
- `viewings.routes.ts` - Route definitions

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/viewings` | Request a viewing |
| GET | `/api/viewings` | List user's viewings |
| GET | `/api/viewings/:id` | Get viewing details |
| PATCH | `/api/viewings/:id/status` | Update viewing status |
| POST | `/api/viewings/:id/reschedule` | Propose new time |
| POST | `/api/viewings/:id/complete` | Mark as complete |

## Viewing Statuses
- `pending` - Awaiting landlord response
- `confirmed` - Viewing confirmed
- `rescheduled` - New time proposed
- `completed` - Viewing attended
- `cancelled` - Viewing cancelled
- `no_show` - One party didn't attend

## Testing
```bash
npm test -- --testPathPatterns="viewing"
```

## Related Features
- [Chat](../chat/README.md) - Viewings requested via chat
- [Matching](../matching/README.md) - Only matched users can schedule viewings
