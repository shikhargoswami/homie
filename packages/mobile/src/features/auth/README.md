# Auth Feature (Mobile)

## Overview
Handles the authentication user journey on mobile.

## User Journey Steps
1. User enters phone number → `PhoneInputScreen`
2. OTP is sent via SMS
3. User verifies OTP → `OTPVerificationScreen`
4. User selects their type → `UserTypeSelectionScreen`

## Screens
| Screen | Description |
|--------|-------------|
| `PhoneInputScreen` | Phone number entry with country code |
| `OTPVerificationScreen` | OTP entry with auto-submit |
| `UserTypeSelectionScreen` | Tenant/Landlord selection |

## Navigation Flow
```
PhoneInput → OTPVerification → UserTypeSelection → (Onboarding)
```

## Testing
```bash
npm test -- --testPathPatterns="auth"
```

## Related Features
- [Onboarding](../onboarding/README.md) - Next step after auth
