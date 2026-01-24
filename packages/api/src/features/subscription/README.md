# Subscription Feature

## Overview
Handles the premium subscription user journey including plan selection, billing, and feature gating.

## User Journey Steps
1. User views subscription plans
2. User selects a plan
3. Payment processed
4. Premium features unlocked
5. User manages subscription

## Files
- `subscription.controller.ts` - Request handlers for subscriptions
- `subscription.routes.ts` - Route definitions
- `subscription.service.ts` - Subscription business logic

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription/plans` | List available plans |
| GET | `/api/subscription/current` | Get user's subscription |
| POST | `/api/subscription/subscribe` | Subscribe to plan |
| POST | `/api/subscription/cancel` | Cancel subscription |
| GET | `/api/subscription/features` | Get unlocked features |

## Subscription Plans
| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0 | Basic swiping, limited matches |
| Premium | ₹499/mo | Unlimited swipes, see who liked you, share contact |
| Pro | ₹999/mo | Priority listing, analytics, verified badge |

## Feature Gating
The subscription middleware checks if users have access to premium features:
- Contact sharing in chat
- Unlimited swipes
- Advanced filters
- Analytics dashboard

## Testing
```bash
npm test -- --testPathPatterns="subscription"
```

## Related Features
- [Chat](../chat/README.md) - Premium unlocks contact sharing
- [Discovery](../discovery/README.md) - Premium unlocks unlimited swipes
