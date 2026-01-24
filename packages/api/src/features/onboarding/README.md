# Onboarding Feature

## Overview
Handles the user onboarding journey after authentication, including profile setup and landlord verification.

## User Journey Steps

### Tenant Onboarding
1. Enter name and email
2. Set budget range
3. Select preferred locations
4. Choose configuration (BHK)
5. Select required amenities
6. Profile complete → Discovery

### Landlord Onboarding
1. Enter name and email
2. Upload verification documents
3. Enter property count
4. Years of experience
5. Profile complete → Dashboard

## Files
- `landlord-verification.controller.ts` - Verification handlers
- `users.routes.ts` - User profile routes
- `landlord-verification.service.ts` - Verification logic

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile |
| POST | `/api/users/preferences` | Set preferences |
| POST | `/api/users/verify-landlord` | Submit verification |
| GET | `/api/users/verification-status` | Check verification |

## Verification Process
1. Landlord uploads ID proof
2. System validates document
3. Manual review if needed
4. Verification status updated
5. Badge shown on profile

## Testing
```bash
npm test -- --testPathPatterns="onboarding|verification|users"
```

## Related Features
- [Auth](../auth/README.md) - Onboarding follows authentication
- [Discovery](../discovery/README.md) - After onboarding, users enter discovery
