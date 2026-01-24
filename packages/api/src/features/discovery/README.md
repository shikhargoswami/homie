# Discovery Feature

## Overview
Handles the discovery/swiping user journey including property browsing for tenants and tenant browsing for landlords.

## User Journey Steps

### Tenant Discovery
1. View property cards
2. See property details
3. Swipe right (like) or left (pass)
4. Get match notification if mutual

### Landlord Discovery
1. View interested tenants
2. See tenant profiles
3. Swipe right (like) or left (pass)
4. Match created → Chat enabled

## Files
- `lifestyle.matching.service.ts` - Lifestyle compatibility scoring

## Lifestyle Matching Algorithm
Calculates compatibility score based on:
- Budget alignment
- Location preferences
- Lifestyle habits (pets, smoking, etc.)
- Work schedule compatibility
- Cleanliness standards

## Discovery Feed Algorithm
1. Filter by user preferences
2. Score by lifestyle compatibility
3. Sort by match potential
4. Exclude already swiped
5. Return paginated results

## Testing
```bash
npm test -- --testPathPatterns="discovery|lifestyle"
```

## Related Features
- [Properties](../properties/README.md) - Properties appear in discovery
- [Matching](../matching/README.md) - Swipes create matches
- [Onboarding](../onboarding/README.md) - Preferences set during onboarding
