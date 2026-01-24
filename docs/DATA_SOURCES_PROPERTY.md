# Property Data Sources

This document outlines which property details are entered by landlords and which are automatically calculated/fetched from external APIs.

---

## Landlord Input Fields

These fields must be entered by the landlord during property listing:

### Basic Information
| Field | Description | Input Type |
|-------|-------------|------------|
| `title` | Property title/name | Text |
| `description` | Detailed property description | Text (multiline) |
| `property_type` | Apartment/Villa/Independent House | Dropdown |
| `bhk_config` | 1BHK/2BHK/3BHK/4BHK+ | Dropdown |
| `furnishing_status` | Unfurnished/Semi/Fully Furnished | Dropdown |

### Address & Location
| Field | Description | Input Type |
|-------|-------------|------------|
| `address_line_1` | Building name, flat number | Text |
| `address_line_2` | Street, area | Text |
| `city` | City name | Dropdown/Autocomplete |
| `state` | State | Dropdown |
| `pincode` | PIN code | Number |
| `landmark` | Nearby landmark | Text (optional) |
| `floor_number` | Which floor | Number |
| `total_floors` | Total building floors | Number |

### Pricing
| Field | Description | Input Type |
|-------|-------------|------------|
| `rent` | Monthly rent (₹) | Number |
| `security_deposit` | Deposit amount (₹) | Number |
| `maintenance_charge` | Monthly maintenance (₹) | Number |
| `maintenance_included` | Is maintenance in rent | Boolean |
| `negotiable` | Is rent negotiable | Boolean |

### Property Specifications
| Field | Description | Input Type |
|-------|-------------|------------|
| `size_sqft` | Carpet area in sq.ft | Number |
| `bedrooms` | Number of bedrooms | Number |
| `bathrooms` | Number of bathrooms | Number |
| `balconies` | Number of balconies | Number |
| `parking` | None/Covered/Open | Dropdown |
| `facing` | East/West/North/South | Dropdown |
| `age_of_property` | Years since construction | Number |

### Amenities
| Field | Description | Input Type |
|-------|-------------|------------|
| `amenities` | List of amenities | Multi-select checkboxes |

Available options:
- AC
- WiFi
- Power Backup
- Lift
- Security
- CCTV
- Gym
- Swimming Pool
- Clubhouse
- Garden
- Children's Play Area
- Visitor Parking
- Water Supply 24x7
- Gas Pipeline
- Intercom
- Fire Safety
- Gated Community

### Photos & Media
| Field | Description | Input Type |
|-------|-------------|------------|
| `photos` | Property images (min 3, max 10) | Image upload |
| `video_tour_url` | YouTube/video link | URL (optional) |
| `floor_plan` | Floor plan image | Image upload (optional) |

### Rules & Preferences
| Field | Description | Input Type |
|-------|-------------|------------|
| `available_from` | Move-in date | Date picker |
| `preferred_tenant` | Family/Bachelor/Any | Dropdown |
| `pets_allowed` | Dogs/Cats allowed | Boolean each |
| `smoking_allowed` | Smoking permitted | Boolean |
| `non_veg_allowed` | Non-veg cooking allowed | Boolean |
| `lease_duration` | Minimum lease (months) | Number |

### Pet Details (if pets_allowed)
| Field | Description | Input Type |
|-------|-------------|------------|
| `dogs_allowed` | Dogs permitted | Boolean |
| `cats_allowed` | Cats permitted | Boolean |
| `pet_deposit` | Additional pet deposit | Number |
| `garden_access` | Garden for pets | Boolean |

---

## Auto-Calculated/API Fields

These fields are automatically populated using external APIs:

### Location Data (Google Maps APIs)

| Field | API Used | Description |
|-------|----------|-------------|
| `latitude` | Google Geocoding API | Latitude from address |
| `longitude` | Google Geocoding API | Longitude from address |
| `formatted_address` | Google Geocoding API | Standardized address |
| `place_id` | Google Places API | Unique place identifier |

**API Details:**
```
API: Google Geocoding API
Endpoint: https://maps.googleapis.com/maps/api/geocode/json
Trigger: After landlord enters address
Cost: $5 per 1000 requests
```

### Neighborhood Points of Interest (Google Places API)

| Field | API Used | Description |
|-------|----------|-------------|
| `metro_distance_m` | Google Places Nearby | Distance to nearest metro |
| `metro_station_name` | Google Places Nearby | Name of nearest metro |
| `bus_stop_distance_m` | Google Places Nearby | Distance to bus stop |
| `cafes_500m` | Google Places Nearby | Count of cafes within 500m |
| `restaurants_500m` | Google Places Nearby | Count of restaurants within 500m |
| `parks_1km` | Google Places Nearby | Count of parks within 1km |
| `gyms_1km` | Google Places Nearby | Count of gyms within 1km |
| `hospitals_2km` | Google Places Nearby | Count of hospitals within 2km |
| `schools_1km` | Google Places Nearby | Count of schools within 1km |
| `grocery_stores_500m` | Google Places Nearby | Count of grocery stores |
| `atms_500m` | Google Places Nearby | Count of ATMs |

**API Details:**
```
API: Google Places Nearby Search
Endpoint: https://maps.googleapis.com/maps/api/place/nearbysearch/json
Trigger: After geocoding completes
Cost: $32 per 1000 requests
Rate Limit: 50 requests/second
```

### Commute Times (Google Distance Matrix API)

| Field | API Used | Description |
|-------|----------|-------------|
| `commute_matrix` | Distance Matrix API | Commute time to key tech parks |
| `commute_to_[location]` | Distance Matrix API | Minutes to specific destination |

**Pre-configured Destinations (Bangalore example):**
- Electronic City
- Whitefield
- Manyata Tech Park
- Outer Ring Road
- Koramangala

**API Details:**
```
API: Google Distance Matrix API
Endpoint: https://maps.googleapis.com/maps/api/distancematrix/json
Trigger: After geocoding completes
Modes: driving, transit
Cost: $5 per 1000 elements
```

### Sunlight Analysis (SunCalc Library + Custom Calculation)

| Field | Source | Description |
|-------|--------|-------------|
| `sunlight_hours.living` | SunCalc + facing | Sunlight in living room |
| `sunlight_hours.bedroom1` | SunCalc + facing | Sunlight in bedroom |
| `sunlight_hours.average` | Calculated | Average daily sunlight |
| `morning_sun` | SunCalc | Gets morning sun (East) |
| `evening_sun` | SunCalc | Gets evening sun (West) |

**Calculation Details:**
```
Library: SunCalc (npm package)
Input: Latitude, Longitude, Floor, Facing direction
Algorithm: Calculate sun position throughout day
Adjustments: Floor height, surrounding buildings (estimated)
No API cost - calculated locally
```

### Noise Levels (Estimated/Crowdsourced)

| Field | Source | Description |
|-------|--------|-------------|
| `noise_levels.morning` | Estimated | 6 AM - 10 AM average dB |
| `noise_levels.evening` | Estimated | 6 PM - 10 PM average dB |
| `noise_levels.night` | Estimated | 10 PM - 6 AM average dB |
| `traffic_noise` | Estimated | Based on road proximity |

**Estimation Method:**
```
Currently: Rule-based estimation
Factors:
- Distance to main road (from Places API)
- Floor number (higher = less noise)
- Nearby places type (bars, schools, etc.)

Future Enhancement: 
- API: Environmental Sound Classification API
- Or: Crowdsourced data from existing tenants
```

### Walk Score & Transit Score (Walk Score API - Optional)

| Field | API Used | Description |
|-------|----------|-------------|
| `walk_score` | Walk Score API | Walkability score (0-100) |
| `transit_score` | Walk Score API | Transit accessibility (0-100) |
| `bike_score` | Walk Score API | Bikeability score (0-100) |

**API Details:**
```
API: Walk Score API
Endpoint: https://api.walkscore.com/score
Cost: Free for up to 5000/day
Alternative: Calculate using Places API data
```

### Air Quality (OpenWeatherMap or AQICN)

| Field | API Used | Description |
|-------|----------|-------------|
| `aqi` | Air Quality API | Air Quality Index |
| `aqi_category` | Calculated | Good/Moderate/Poor |
| `pm25` | Air Quality API | PM 2.5 levels |

**API Details:**
```
API: OpenWeatherMap Air Pollution API
Endpoint: https://api.openweathermap.org/data/2.5/air_pollution
Cost: Free tier available
Alternative: AQICN API (https://aqicn.org/api/)
```

---

## API Cost Summary

| API | Cost | Monthly Est. (1000 properties) |
|-----|------|-------------------------------|
| Google Geocoding | $5/1000 | $5 |
| Google Places Nearby | $32/1000 | $320 (10 searches/property) |
| Google Distance Matrix | $5/1000 | $25 (5 destinations/property) |
| Walk Score | Free/5000 day | $0 |
| Air Quality | Free tier | $0 |
| **Total** | | **~$350/month** |

---

## Data Refresh Schedule

| Data Type | Refresh Frequency | Trigger |
|-----------|-------------------|---------|
| Location/Geocoding | Once | Property creation |
| Neighborhood POIs | Weekly | Cron job |
| Commute times | Daily (peak hours) | Cron job |
| Sunlight hours | Seasonal (quarterly) | Cron job |
| Noise levels | Monthly | Crowdsource/Cron |
| Air Quality | Daily | Cron job |
| Walk/Transit Score | Monthly | Cron job |

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landlord Input Fields | ✅ Implemented | AddPropertyStep 1-4 |
| Google Geocoding | ✅ Implemented | maps.service.ts |
| Google Places Nearby | ✅ Implemented | maps.service.ts |
| Google Distance Matrix | ✅ Implemented | maps.service.ts |
| Sunlight Calculation | ⚠️ Basic | Needs floor/facing integration |
| Noise Estimation | ⚠️ Basic | Rule-based only |
| Walk Score | ❌ Not implemented | Optional enhancement |
| Air Quality | ❌ Not implemented | Optional enhancement |
