# Onboarding Feature (Mobile)

## Overview
Handles user onboarding after authentication.

## Screens
| Screen | Description |
|--------|-------------|
| `TenantOnboardingScreen` | Tenant profile setup |
| `LandlordOnboardingScreen` | Landlord profile & verification |
| `PreferencesScreen` | Budget, location, amenity preferences |

## Tenant Onboarding Flow
1. Basic info (name, email)
2. Budget range
3. Preferred locations
4. Configuration (BHK)
5. Amenities

## Landlord Onboarding Flow
1. Basic info (name, email)
2. Verification documents
3. Property count
4. Experience years

## Testing
```bash
npm test -- --testPathPatterns="onboarding"
```

## Related Features
- [Auth](../auth/README.md) - Precedes onboarding
- [Discovery](../discovery/README.md) - After onboarding
