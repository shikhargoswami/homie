# Tenant Data Sources

This document outlines which tenant details are entered by tenants and which are automatically calculated/fetched, plus what landlords see.

---

## Tenant Input Fields

These fields must be entered by the tenant during registration and onboarding:

### Basic Information
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `full_name` | Full legal name | Text | ✅ Yes |
| `phone` | Mobile number | Phone (verified) | ✅ After match |
| `email` | Email address | Email | ✅ After match |
| `profile_photo` | Profile picture | Image upload | ✅ Yes |
| `date_of_birth` | Birth date | Date picker | ❌ Age only |
| `gender` | Male/Female/Other | Dropdown | ✅ Yes |

### Professional Information
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `occupation_type` | Employed/Self-employed/Student | Dropdown | ✅ Yes |
| `company_name` | Current employer | Text | ✅ Yes |
| `job_title` | Designation | Text | ✅ Yes |
| `work_email` | Official email (for verification) | Email | ❌ No |
| `monthly_income` | Salary range | Range dropdown | ✅ Yes (range) |
| `years_employed` | Tenure at current job | Number | ✅ Yes |

**Income Ranges:**
- Below ₹25,000
- ₹25,000 - ₹50,000
- ₹50,000 - ₹75,000
- ₹75,000 - ₹1,00,000
- ₹1,00,000 - ₹1,50,000
- ₹1,50,000 - ₹2,00,000
- Above ₹2,00,000

### Work Location (for Commute Calculation)
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `work_address` | Office address | Autocomplete | ❌ No |
| `work_latitude` | Auto-calculated | Hidden | ❌ No |
| `work_longitude` | Auto-calculated | Hidden | ❌ No |
| `work_days` | Which days in office | Multi-select | ❌ No |
| `preferred_commute` | Max acceptable commute (mins) | Slider | ❌ No |

### Search Preferences
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `budget_min` | Minimum rent budget | Number | ✅ Yes |
| `budget_max` | Maximum rent budget | Number | ✅ Yes |
| `preferred_locations` | Preferred areas | Multi-select | ✅ Yes |
| `preferred_bhk` | 1BHK/2BHK/3BHK etc | Multi-select | ✅ Yes |
| `furnishing_preference` | Furnishing type needed | Dropdown | ✅ Yes |
| `move_in_date` | When looking to move | Date picker | ✅ Yes |

### Household Composition
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `tenant_type` | Family/Bachelor/Couple | Dropdown | ✅ Yes |
| `total_occupants` | Number of people | Number | ✅ Yes |
| `family_members` | Adults/Children breakdown | Object | ✅ Yes |
| `has_pets` | Do they have pets | Boolean | ✅ Yes |
| `pet_type` | Dog/Cat/Other | Dropdown | ✅ Yes (if has_pets) |
| `pet_breed` | Breed of pet | Text | ✅ Optional |

### Lifestyle Preferences
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `is_vegetarian` | Food preference | Boolean | ✅ Yes |
| `smoking_habit` | Smoker/Non-smoker | Boolean | ✅ Yes |
| `drinking_habit` | Occasional/Regular/Never | Dropdown | ❌ No |
| `work_from_home` | WFH frequency | Dropdown | ✅ Yes |
| `sleep_schedule` | Early bird/Night owl | Dropdown | ❌ No |
| `noise_tolerance` | Quiet/Moderate/Doesn't mind | Dropdown | ❌ No |
| `guest_frequency` | How often guests visit | Dropdown | ❌ No |
| `cleanliness_level` | Self-rated 1-5 | Slider | ❌ No |

**WFH Options:**
- Always in office
- 1-2 days WFH
- 3-4 days WFH
- Fully remote
- Hybrid (varies)

### Verification Documents (Uploaded but not shown)
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `id_proof` | Aadhaar/PAN/Passport | Image upload | ❌ Verification status only |
| `address_proof` | Current address proof | Image upload | ❌ Verification status only |
| `income_proof` | Salary slip/ITR | Image upload | ❌ Verification status only |
| `company_id` | Employment ID card | Image upload | ❌ Verification status only |

### About Me (Optional)
| Field | Description | Input Type | Shown to Landlord |
|-------|-------------|------------|-------------------|
| `bio` | Short introduction | Text (500 chars) | ✅ Yes |
| `hobbies` | Interests/hobbies | Multi-select tags | ✅ Yes |
| `languages` | Languages spoken | Multi-select | ✅ Yes |
| `hometown` | Native place | Text | ✅ Optional |

---

## Auto-Calculated/API Fields

These fields are automatically populated:

### Verification Status (Internal Processing)

| Field | Source | Description | Shown to Landlord |
|-------|--------|-------------|-------------------|
| `phone_verified` | OTP verification | Phone is verified | ✅ Yes (badge) |
| `email_verified` | Email link click | Email is verified | ✅ Yes (badge) |
| `id_verified` | DigiLocker/Manual | ID proof validated | ✅ Yes (badge) |
| `income_verified` | ITR/Bank statement | Income validated | ✅ Yes (badge) |
| `employment_verified` | Company email/LinkedIn | Job verified | ✅ Yes (badge) |
| `verification_score` | Calculated | Overall trust score | ✅ Yes (meter) |

**Verification APIs:**
```
Phone Verification:
- Service: Twilio / MSG91
- Method: OTP via SMS
- Cost: ~₹0.20 per SMS

Email Verification:
- Service: Internal (send link)
- Method: Click verification link
- Cost: Free

ID Verification (Future):
- API: DigiLocker API / Aadhaar e-KYC
- Method: Government database check
- Cost: ₹5-10 per verification
- Alternative: Manual review

Income Verification (Future):
- API: Account Aggregator (Finvu, OneMoney)
- Method: Bank statement analysis
- Cost: ₹10-20 per verification
- Alternative: Manual salary slip review

Employment Verification:
- API: LinkedIn API (limited)
- Method: Work email verification
- Alternative: Company domain email OTP
```

### Profile Completeness Score

| Field | Source | Description | Shown to Landlord |
|-------|--------|-------------|-------------------|
| `profile_completeness` | Calculated | % of fields filled | ✅ Yes |
| `profile_strength` | Calculated | Weak/Medium/Strong | ✅ Yes |

**Calculation:**
```javascript
const weights = {
  basic_info: 20,      // name, photo, contact
  professional: 25,    // job, company, income
  preferences: 15,     // budget, location, bhk
  verification: 30,    // all verification badges
  lifestyle: 10,       // optional lifestyle info
};
```

### Commute Time to Properties (Google Distance Matrix API)

| Field | API Used | Description | Shown to Landlord |
|-------|----------|-------------|-------------------|
| `commute_to_property` | Distance Matrix | Minutes to property | ❌ No (tenant sees) |
| `commute_mode` | Distance Matrix | Best transport mode | ❌ No (tenant sees) |

**API Details:**
```
API: Google Distance Matrix API
Endpoint: https://maps.googleapis.com/maps/api/distancematrix/json
Trigger: When viewing property cards
Cache: 24 hours
Modes: driving, transit, walking
Cost: $5 per 1000 requests
```

### Lifestyle Compatibility Score (Internal Algorithm)

| Field | Source | Description | Shown to Landlord |
|-------|--------|-------------|-------------------|
| `lifestyle_match_score` | Algorithm | Compatibility with property | ✅ Yes (%) |
| `match_factors` | Algorithm | Why they're a good match | ✅ Yes (tags) |

**Algorithm Factors:**
```javascript
const compatibilityFactors = {
  budget_fit: 25,           // rent vs budget range
  location_preference: 20,  // area match
  tenant_type_match: 15,    // family/bachelor alignment
  pet_compatibility: 10,    // pet policy match
  lifestyle_alignment: 15,  // veg/smoking/etc
  commute_convenience: 15,  // commute time acceptable
};
```

### Activity Metrics (Internal Analytics)

| Field | Source | Description | Shown to Landlord |
|-------|--------|-------------|-------------------|
| `last_active` | App tracking | Last app usage | ✅ Yes (relative) |
| `response_rate` | Chat analytics | % of messages replied | ✅ Yes |
| `avg_response_time` | Chat analytics | Typical reply time | ✅ Yes |
| `properties_viewed` | Analytics | Total properties seen | ❌ No |
| `matches_count` | DB query | Total matches made | ❌ No |

**Display Format:**
```
"Active today" / "Active 2 days ago" / "Active this week"
"Usually responds within 2 hours"
"90% response rate"
```

---

## What Landlords See - Tenant Profile Card

### Before Match (Discovery View)
```
┌─────────────────────────────────────┐
│  [Profile Photo]                    │
│                                     │
│  Rahul Sharma, 28                   │
│  ✓ Verified                         │
│                                     │
│  💼 Software Engineer at Google     │
│  💰 Budget: ₹25k - ₹35k            │
│  👨‍👩‍👧 Family (3 members)              │
│  🌱 Vegetarian • Non-smoker        │
│  🐕 Has a pet (Labrador)           │
│                                     │
│  📍 Prefers: Indiranagar, HSR      │
│  🏠 Looking for: 2BHK, Furnished   │
│  📅 Move-in: Feb 2026              │
│                                     │
│  "Looking for a quiet, pet-friendly│
│   apartment for my family..."      │
│                                     │
│  ⭐ 95% Match Score                 │
│                                     │
│     [PASS]        [LIKE]           │
└─────────────────────────────────────┘
```

### After Match (Full Profile)
```
Additional Info Revealed:
- Phone number
- Email address
- Detailed bio
- Income range
- Employment duration
- Response rate & time
- All verification badges detail
```

---

## API Cost Summary (Tenant Side)

| API | Cost | Monthly Est. (10,000 tenants) |
|-----|------|------------------------------|
| SMS OTP (Twilio) | ₹0.20/SMS | ₹4,000 |
| Distance Matrix | $5/1000 | $500 (10 properties/tenant) |
| DigiLocker (future) | ₹10/verify | ₹1,00,000 (if all verify) |
| Account Aggregator (future) | ₹15/verify | ₹1,50,000 (if all verify) |
| **Current Total** | | **~$500 + ₹4,000** |

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Basic Info Collection | ✅ Implemented | TenantOnboardingScreen |
| Search Preferences | ✅ Implemented | PreferencesScreen |
| Lifestyle Preferences | ✅ Implemented | PreferencesScreen |
| Phone Verification | ✅ Implemented | OTP flow |
| Email Verification | ⚠️ Basic | Link sent, no tracking |
| ID Verification | ❌ Not implemented | Manual review only |
| Income Verification | ❌ Not implemented | Self-declared |
| Profile Completeness | ⚠️ Basic | Simple % calculation |
| Lifestyle Match Score | ✅ Implemented | lifestyle.matching.service.ts |
| Commute Calculation | ✅ Implemented | Per property |
| Activity Tracking | ⚠️ Basic | Last active only |
