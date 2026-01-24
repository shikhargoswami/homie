# API Integration Reference

This document provides detailed API specifications for all external services used in Homie.

---

## Google Maps Platform APIs

### 1. Geocoding API
Converts addresses to coordinates.

**Use Case:** When landlord enters property address

```javascript
// Request
GET https://maps.googleapis.com/maps/api/geocode/json
  ?address=123+Main+St,+Bangalore,+Karnataka
  &key=YOUR_API_KEY

// Response
{
  "results": [{
    "formatted_address": "123 Main St, Indiranagar, Bengaluru, Karnataka 560038",
    "geometry": {
      "location": {
        "lat": 12.9716,
        "lng": 77.6412
      }
    },
    "place_id": "ChIJLbZ-NFv9rjsRKLYF_hjkQB4"
  }]
}
```

**Cost:** $5 per 1,000 requests  
**Rate Limit:** 50 requests/second  
**Implementation:** `packages/api/src/features/properties/maps.service.ts`

---

### 2. Places Autocomplete API
Provides address suggestions as user types.

**Use Case:** Address input in property form

```javascript
// Request
GET https://maps.googleapis.com/maps/api/place/autocomplete/json
  ?input=Indiranagar+Bang
  &types=address
  &components=country:in
  &key=YOUR_API_KEY

// Response
{
  "predictions": [
    {
      "description": "Indiranagar, Bengaluru, Karnataka, India",
      "place_id": "ChIJbU60yXAWrjsR4E9-UejD3_g"
    }
  ]
}
```

**Cost:** $2.83 per 1,000 requests  
**Rate Limit:** No limit documented  
**Implementation:** `packages/mobile/src/core/services/places.service.ts`

---

### 3. Places Nearby Search API
Finds nearby points of interest.

**Use Case:** Fetch neighborhood amenities

```javascript
// Request
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
  ?location=12.9716,77.6412
  &radius=1000
  &type=subway_station
  &key=YOUR_API_KEY

// Response
{
  "results": [
    {
      "name": "Indiranagar Metro Station",
      "geometry": {
        "location": { "lat": 12.9784, "lng": 77.6408 }
      },
      "vicinity": "Indiranagar, Bengaluru"
    }
  ]
}
```

**Place Types Used:**
| Type | Radius | Field |
|------|--------|-------|
| `subway_station` | 2km | `metro_distance_m` |
| `bus_station` | 1km | `bus_stop_distance_m` |
| `cafe` | 500m | `cafes_500m` |
| `restaurant` | 500m | `restaurants_500m` |
| `park` | 1km | `parks_1km` |
| `gym` | 1km | `gyms_1km` |
| `hospital` | 2km | `hospitals_2km` |
| `school` | 1km | `schools_1km` |
| `supermarket` | 500m | `grocery_stores_500m` |
| `atm` | 500m | `atms_500m` |

**Cost:** $32 per 1,000 requests  
**Rate Limit:** 50 requests/second  
**Implementation:** `packages/api/src/features/properties/maps.service.ts`

---

### 4. Distance Matrix API
Calculates travel time between locations.

**Use Case:** Commute time calculation

```javascript
// Request
GET https://maps.googleapis.com/maps/api/distancematrix/json
  ?origins=12.9716,77.6412
  &destinations=Electronic+City,Bangalore|Whitefield,Bangalore
  &mode=driving
  &departure_time=now
  &key=YOUR_API_KEY

// Response
{
  "rows": [{
    "elements": [
      {
        "distance": { "text": "18.5 km", "value": 18500 },
        "duration": { "text": "45 mins", "value": 2700 },
        "duration_in_traffic": { "text": "55 mins", "value": 3300 }
      }
    ]
  }]
}
```

**Modes:**
- `driving` - Car commute
- `transit` - Public transport
- `walking` - Walking distance
- `bicycling` - Cycling distance

**Cost:** $5 per 1,000 elements (origin-destination pair)  
**Rate Limit:** 1,000 elements per request  
**Implementation:** `packages/api/src/features/properties/maps.service.ts`

---

## SMS/OTP Services

### Twilio SMS API
Sends OTP for phone verification.

**Use Case:** User authentication

```javascript
// Request (using Twilio SDK)
const message = await twilioClient.messages.create({
  body: 'Your Homie verification code is: 123456',
  from: '+1234567890',
  to: '+919876543210'
});

// Response
{
  "sid": "SM123...",
  "status": "sent",
  "to": "+919876543210"
}
```

**Cost:** ~$0.0075/SMS (US) or ₹0.20/SMS (India via local providers)  
**Rate Limit:** 1 message/second default  
**Implementation:** `packages/api/src/features/auth/sms.service.ts`

**Alternative: MSG91 (India)**
```javascript
// Request
POST https://api.msg91.com/api/v5/otp
{
  "mobile": "919876543210",
  "template_id": "YOUR_TEMPLATE_ID",
  "otp_length": 6
}
```

**Cost:** ₹0.15-0.20 per SMS  
**Better for India market**

---

## Verification APIs (Future Implementation)

### DigiLocker API
Government document verification.

**Use Case:** ID verification (Aadhaar, PAN)

```javascript
// Step 1: Redirect user to DigiLocker
GET https://api.digitallocker.gov.in/public/oauth2/1/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_CALLBACK_URL
  &state=random_state

// Step 2: Exchange code for token
POST https://api.digitallocker.gov.in/public/oauth2/1/token

// Step 3: Fetch document
GET https://api.digitallocker.gov.in/public/oauth2/1/file/{uri}
```

**Documents Available:**
- Aadhaar Card
- PAN Card
- Driving License
- Vehicle Registration
- CBSE Marksheets

**Cost:** Free for basic, ₹5-10 for verified pull  
**Approval:** Requires MeitY approval  
**Status:** Not implemented (requires government approval)

---

### Account Aggregator API (Finvu/OneMoney)
Bank statement and income verification.

**Use Case:** Income verification

```javascript
// Step 1: Create consent request
POST https://api.finvu.in/Consent
{
  "consentDetail": {
    "consentTypes": ["TRANSACTIONS", "SUMMARY"],
    "fiTypes": ["DEPOSIT"],
    "dataLife": { "unit": "MONTH", "value": 6 }
  }
}

// Step 2: User approves on their bank app

// Step 3: Fetch data
GET https://api.finvu.in/FI/fetch/{sessionId}
```

**Data Available:**
- Bank account summary
- 6 months transaction history
- Salary credits detection
- Average monthly balance

**Cost:** ₹10-20 per data pull  
**Implementation:** Not implemented  
**Compliance:** RBI regulated

---

## Environmental Data APIs

### OpenWeatherMap Air Pollution API
Real-time air quality data.

**Use Case:** Property air quality display

```javascript
// Request
GET https://api.openweathermap.org/data/2.5/air_pollution
  ?lat=12.9716
  &lon=77.6412
  &appid=YOUR_API_KEY

// Response
{
  "list": [{
    "main": {
      "aqi": 3  // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    },
    "components": {
      "pm2_5": 42.5,
      "pm10": 65.2,
      "no2": 28.4
    }
  }]
}
```

**AQI Scale:**
| Value | Category | Color |
|-------|----------|-------|
| 1 | Good | Green |
| 2 | Fair | Yellow |
| 3 | Moderate | Orange |
| 4 | Poor | Red |
| 5 | Very Poor | Purple |

**Cost:** Free (60 calls/minute)  
**Rate Limit:** 1,000 calls/day (free tier)  
**Implementation:** Not implemented

---

### Walk Score API (Optional)
Walkability ratings.

**Use Case:** Property walkability score

```javascript
// Request
GET https://api.walkscore.com/score
  ?format=json
  &lat=12.9716
  &lon=77.6412
  &wsapikey=YOUR_API_KEY

// Response
{
  "walkscore": 75,
  "description": "Very Walkable",
  "transit": {
    "score": 62,
    "description": "Excellent Transit"
  }
}
```

**Score Ranges:**
| Score | Description |
|-------|-------------|
| 90-100 | Walker's Paradise |
| 70-89 | Very Walkable |
| 50-69 | Somewhat Walkable |
| 25-49 | Car-Dependent |
| 0-24 | Almost All Errands Require a Car |

**Cost:** Free up to 5,000/day  
**Implementation:** Not implemented

---

## Local Libraries (No API Cost)

### SunCalc
Calculate sun position and daylight hours.

**Use Case:** Sunlight analysis for properties

```javascript
import SunCalc from 'suncalc';

// Get sun times
const times = SunCalc.getTimes(new Date(), 12.9716, 77.6412);
// { sunrise: Date, sunset: Date, ... }

// Get sun position at specific time
const position = SunCalc.getPosition(new Date(), 12.9716, 77.6412);
// { altitude: 0.7, azimuth: 1.2 }

// Calculate hours of direct sunlight based on facing
function calculateSunlight(lat, lng, facing, floor) {
  // Custom algorithm using SunCalc data
  // Factors: building orientation, floor height, season
}
```

**Cost:** Free (npm package)  
**Implementation:** Partially in maps.service.ts

---

## API Key Management

```bash
# Environment Variables Required

# Google Maps Platform
GOOGLE_MAPS_API_KEY=AIza...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# MSG91 (Alternative SMS)
MSG91_AUTH_KEY=...
MSG91_TEMPLATE_ID=...

# OpenWeatherMap
OPENWEATHER_API_KEY=...

# Walk Score (Optional)
WALKSCORE_API_KEY=...

# DigiLocker (Future)
DIGILOCKER_CLIENT_ID=...
DIGILOCKER_CLIENT_SECRET=...

# Account Aggregator (Future)
AA_CLIENT_ID=...
AA_CLIENT_SECRET=...
```

---

## Error Handling

All API calls should handle:

```javascript
try {
  const response = await fetchWithRetry(url, {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - exponential backoff
      await delay(Math.pow(2, attempt) * 1000);
    }
    throw new APIError(response.status, await response.text());
  }
  
  return response.json();
} catch (error) {
  // Log to monitoring
  logger.error('API call failed', { url, error });
  
  // Return cached data if available
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  // Return default/fallback
  return getDefaultValue();
}
```

---

## Caching Strategy

| API | Cache Duration | Cache Key Pattern |
|-----|----------------|-------------------|
| Geocoding | Forever | `geo:${address_hash}` |
| Places Nearby | 7 days | `pois:${lat},${lng}:${type}` |
| Distance Matrix | 24 hours | `dm:${origin}:${dest}:${mode}` |
| Air Quality | 1 hour | `aqi:${lat},${lng}` |
| Walk Score | 30 days | `ws:${lat},${lng}` |
