# Auth Feature

## Overview
Handles the authentication user journey including phone verification, OTP, and user type selection.

## User Journey Steps
1. User enters phone number
2. OTP is sent via SMS
3. User verifies OTP
4. User selects their type (Tenant/Landlord)
5. JWT tokens are issued

## Files
- `auth.controller.ts` - Request handlers for auth endpoints
- `auth.routes.ts` - Route definitions
- `sms.service.ts` - SMS sending via Twilio/MSG91
- `token.service.ts` - JWT token generation and validation

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to phone number |
| POST | `/api/auth/verify-otp` | Verify OTP and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Invalidate tokens |

## Dependencies
- `twilio` - SMS provider
- `jsonwebtoken` - JWT handling

## Testing
```bash
npm test -- --testPathPatterns="auth"
```

## Related Features
- [Onboarding](../onboarding/README.md) - After auth, users go through onboarding
