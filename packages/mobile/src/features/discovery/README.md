# Discovery Feature (Mobile)

## Overview
Handles the discovery/swiping user journey for both tenants and landlords.

## User Journey Steps

### Tenant Flow
1. View property cards → `SwipeScreen`
2. See property details → `PropertyDetailScreen`
3. Swipe right (like) or left (pass)
4. Get match notification if mutual

### Landlord Flow
1. View interested tenants → `LandlordExploreScreen`
2. See tenant profiles
3. Swipe right (like) or left (pass)

## Screens
| Screen | Description |
|--------|-------------|
| `SwipeScreen` | Tinder-like property cards for tenants |
| `PropertyDetailScreen` | Full property details with photos |
| `LandlordExploreScreen` | Tenant cards for landlords |

## Swipe Gestures
- Swipe Right → Like
- Swipe Left → Pass
- Swipe Up → Super Like (Premium)
- Tap → View Details

## Testing
```bash
npm test -- --testPathPatterns="discovery|swipe"
```

## Related Features
- [Matching](../matching/README.md) - Swipes create matches
- [Properties](../properties/README.md) - Properties shown in discovery
