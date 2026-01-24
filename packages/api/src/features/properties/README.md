# Properties Feature

## Overview
Handles the property management user journey for landlords including adding, editing, and managing property listings.

## User Journey Steps
1. Landlord accesses dashboard
2. Landlord adds new property (multi-step form)
3. Property goes live
4. Landlord views statistics
5. Landlord edits/removes properties

## Files
- `property.controller.ts` - Request handlers for properties
- `properties.routes.ts` - Property CRUD routes
- `places.routes.ts` - Location search routes
- `maps.service.ts` - Google Maps integration

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | List properties |
| POST | `/api/properties` | Create property |
| GET | `/api/properties/:id` | Get property details |
| PATCH | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |
| GET | `/api/places/search` | Search locations |
| GET | `/api/places/details` | Get place details |

## Property Schema
- Address & location
- Configuration (BHK)
- Rent amount
- Photos
- Amenities
- Description
- Status (draft/active/rented)

## Testing
```bash
npm test -- --testPathPatterns="propert"
```

## Related Features
- [Discovery](../discovery/README.md) - Properties appear in tenant discovery
- [Matching](../matching/README.md) - Properties can be matched with tenants
