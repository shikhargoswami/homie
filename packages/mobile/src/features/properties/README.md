# Properties Feature (Mobile)

## Overview
Handles property management for landlords including adding, viewing, and managing listings.

## Screens
| Screen | Description |
|--------|-------------|
| `DashboardScreen` | Landlord stats and overview |
| `MyPropertiesScreen` | List of landlord's properties |
| `AddPropertyScreen` | Start adding property |
| `AddPropertyStep1Screen` | Address & location |
| `AddPropertyStep2Screen` | Configuration & rent |
| `AddPropertyStep3Screen` | Photos & amenities |
| `AddPropertyStep4Screen` | Description & publish |

## Add Property Flow
```
Dashboard → AddProperty → Step1 → Step2 → Step3 → Step4 → MyProperties
```

## Dashboard Stats
- Total views
- Active listings
- Total matches
- Pending viewings

## Testing
```bash
npm test -- --testPathPatterns="propert"
```

## Related Features
- [Discovery](../discovery/README.md) - Properties shown to tenants
