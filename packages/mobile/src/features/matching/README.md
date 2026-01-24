# Matching Feature (Mobile)

## Overview
Handles viewing and managing matches for both tenants and landlords.

## Screens
| Screen | Description |
|--------|-------------|
| `MatchesScreen` | List of matches for tenants |
| `LandlordMatchesScreen` | List of matches for landlords |

## Match Card Information
- Property/Tenant photo
- Name/Title
- Match date
- Last message preview
- Chat button

## Testing
```bash
npm test -- --testPathPatterns="match"
```

## Related Features
- [Discovery](../discovery/README.md) - Matches come from swipes
- [Chat](../chat/README.md) - Chat with matches
