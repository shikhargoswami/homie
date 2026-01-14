# 🏠 HOMIE: COMPLETE USER FLOW \& WIREFRAMES

## Executive Summary

Homie reimagines rental search by combining **Tinder's swipe mechanics** with **VR property tours** and **AI-powered matching**. This document details every screen, interaction, and user journey from first launch to signed lease.[^35_1][^35_2]

***

## 🎯 CORE USER PERSONAS

### Persona 1: Riya (Tenant)

- **Age:** 26, Software Engineer
- **Location:** Bangalore (new to city)
- **Pain:** Spent 2 weeks visiting 15 properties, wasted ₹3,000 on brokers
- **Goal:** Find 2BHK near office in <7 days, no broker fees
- **Tech Comfort:** High (uses Swiggy, Uber daily)


### Persona 2: Arjun (Landlord)

- **Age:** 42, Property Owner
- **Location:** Mumbai (owns 3 rental properties)
- **Pain:** Gets 50 calls/day, 80% unqualified, wastes time showing property
- **Goal:** Find quality tenant quickly, minimize vacancy
- **Tech Comfort:** Medium (uses WhatsApp for business)

***

## 📱 APP STRUCTURE OVERVIEW

```
Homie App Architecture
│
├── 🔐 Authentication Flow
│   ├── Splash Screen
│   ├── Onboarding (3 slides)
│   ├── Phone Number Entry
│   ├── OTP Verification
│   └── Profile Setup
│
├── 🏠 Tenant Journey (87% of users)
│   ├── Home (Swipe Feed)
│   ├── Property Detail
│   ├── VR Tour Viewer
│   ├── Matches (Mutual likes)
│   ├── Messages (Chat)
│   ├── Profile & Settings
│   └── Saved Properties
│
├── 🏢 Landlord Journey (13% of users)
│   ├── Dashboard (Properties overview)
│   ├── Add Property
│   ├── Property Management
│   ├── Tenant Requests (Likes)
│   ├── Messages (Chat)
│   └── Analytics
│
└── ⚙️ Shared Components
    ├── Bottom Navigation
    ├── Notifications
    ├── Search & Filters
    └── Support Chat
```


***

## 🎬 DETAILED USER FLOWS

### FLOW 1: TENANT ONBOARDING (First Time User)

**Objective:** Get user swiping in <2 minutes[^35_3]

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: SPLASH SCREEN (2 seconds)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    [Homie Logo]                         │
│                                                         │
│              Find Your Perfect Home                     │
│              AI-Powered • VR Tours • No Brokers         │
│                                                         │
│                   [Loading spinner]                     │
│                                                         │
│  Auto-advance to Onboarding or Home (if logged in)     │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 2: ONBOARDING SLIDE 1/3                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Illustration: Swipe gesture]              │
│                                                         │
│         Swipe Through Your Dream Homes                  │
│         Like Tinder, but for apartments                 │
│                                                         │
│                                                         │
│              ○ ● ○          [Skip] [Next →]            │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 2: ONBOARDING SLIDE 2/3                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Illustration: VR headset]                 │
│                                                         │
│            Tour Properties from Your Couch              │
│            360° VR tours of every property              │
│                                                         │
│                                                         │
│              ○ ○ ●          [Skip] [Next →]            │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 2: ONBOARDING SLIDE 3/3                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Illustration: AI brain + house]           │
│                                                         │
│             AI Matches Your Perfect Home                │
│             Smart matching based on preferences         │
│                                                         │
│                                                         │
│              ○ ○ ○       [Get Started →]               │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 3: PHONE NUMBER ENTRY                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]                                              │
│                                                         │
│         Welcome to Homie! 👋                            │
│         Enter your phone number to continue             │
│                                                         │
│   ┌───────────────────────────────────────┐           │
│   │  +91  │  9 8 7 6 5 4 3 2 1 0         │  (input)  │
│   └───────────────────────────────────────┘           │
│                                                         │
│   ✓ I agree to Terms & Privacy Policy                  │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Send OTP                         │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
│         Or continue with                                │
│    [Google] [Facebook] [Apple]                         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 4: OTP VERIFICATION                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]                                              │
│                                                         │
│         Enter OTP                                       │
│         Sent to +91 9876543210 [Edit]                  │
│                                                         │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│   │  1  │ │  2  │ │  3  │ │  4  │ │  5  │ │  6  │   │
│   └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
│                                                         │
│         Didn't receive? Resend in 0:45                  │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Verify & Continue                │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 5: ROLE SELECTION                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Skip for now]                                         │
│                                                         │
│         I'm looking to...                               │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │           🏠 Find a Home                │  (card) │
│   │                                         │         │
│   │   Browse properties & find perfect match │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │           🏢 List My Property           │  (card) │
│   │                                         │         │
│   │   Find quality tenants for your property│         │
│   └─────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓ (Tenant selected)

┌─────────────────────────────────────────────────────────┐
│ STEP 6: TENANT PREFERENCES (Page 1/3)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]                1/3              [Skip →]     │
│                                                         │
│         Let's find your perfect home 🏡                 │
│         Where do you want to live?                      │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  🔍 Search City                         │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   Popular Cities:                                       │
│   [Bangalore] [Mumbai] [Delhi] [Pune]                  │
│   [Hyderabad] [Chennai] [+ More]                       │
│                                                         │
│   Selected: Bangalore ✓                                 │
│                                                         │
│   Preferred Neighborhoods: (optional)                   │
│   [Koramangala] [Indiranagar] [HSR Layout]             │
│   [Whitefield] [Marathahalli] [+ More]                 │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Continue                         │  (btn)  │
│   └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 7: TENANT PREFERENCES (Page 2/3)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]                2/3              [Skip →]     │
│                                                         │
│         What's your budget?                             │
│                                                         │
│   ₹15,000 ━━━━━●━━━━━ ₹50,000          (slider)       │
│                                                         │
│   Monthly Rent: ₹20,000 - ₹40,000                     │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│         Property Type                                   │
│                                                         │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│   │ 1RK  │ │ 1BHK │ │ 2BHK │ │ 3BHK │  (toggle btns) │
│   └──────┘ └──────┘ └──────┘ └──────┘               │
│   [4BHK+]                                              │
│                                                         │
│   Selected: 2BHK, 3BHK ✓                               │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│         Furnishing                                      │
│   ○ Unfurnished  ● Semi-Furnished  ○ Fully Furnished  │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Continue                         │  (btn)  │
│   └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ STEP 8: TENANT PREFERENCES (Page 3/3)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [← Back]                3/3                           │
│                                                         │
│         Must-have amenities                             │
│                                                         │
│   [✓ Parking] [✓ Gym] [  Swimming Pool]                │
│   [✓ Security] [  Power Backup] [  Lift]               │
│   [  Pet Friendly] [  Balcony] [+ More]                │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│         When do you want to move in?                    │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  📅  Select Date: 15 Feb 2026           │  (date) │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│         Work Location (optional)                        │
│         Helps us calculate commute time                 │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  📍 Search location                     │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Start Swiping! 🎉                │  (btn)  │
│   └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘

                         ↓

                  [Preferences Saved!]
            [AI matching in progress...]
                   (2 second loader)
                         
                         ↓

              [Welcome to Homie Feed!]
```

**Time to First Swipe:** 90 seconds (industry benchmark: 2-3 minutes)

***

### FLOW 2: TENANT SWIPING \& MATCHING

**Objective:** Addictive discovery loop inspired by Tinder[^35_2][^35_1]

```
┌─────────────────────────────────────────────────────────┐
│ HOME SCREEN: SWIPE FEED                                │
├─────────────────────────────────────────────────────────┤
│ [☰] Homie              🔍 [Filter]      🔔 [Notif: 3]  │
│─────────────────────────────────────────────────────────│
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │                                         │  (card 1)│
│   │     [Property Photo - Full screen]      │         │
│   │                                         │         │
│   │     ₹32,000/month                      │         │
│   │     2BHK • Koramangala                  │         │
│   │     15 min to your office               │         │
│   │                                         │         │
│   │     [❌ Nope]  [ℹ️ Info]  [❤️ Like]    │  (btns) │
│   │                                         │         │
│   │     • • • ○ ○    (5 photos)            │  (dots) │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   49 properties remaining today                         │
│   [Upgrade to Homie Plus for unlimited swipes]          │
│                                                         │
│─────────────────────────────────────────────────────────│
│   [🏠 Home] [💬 Matches] [❤️ Saved] [👤 Profile]      │
└─────────────────────────────────────────────────────────┘

INTERACTIONS:
- Swipe Right → Like property
- Swipe Left → Pass property
- Swipe Up → Super Like (3/day free, costs ₹50 after)
- Tap Photo → View more photos (swipe horizontally)
- Tap ℹ️ → Open Property Detail screen
- Pull Down → Refresh recommendations
- Double Tap → Quick like

                         ↓ (User swipes right)

┌─────────────────────────────────────────────────────────┐
│ ANIMATION: CARD FLIES RIGHT                            │
│ [Heart icon appears briefly]                            │
│ Haptic feedback (vibration)                             │
│ Next card slides in from below                          │
└─────────────────────────────────────────────────────────┘

                         ↓ (If landlord already liked)

┌─────────────────────────────────────────────────────────┐
│ MODAL: IT'S A MATCH! 🎉                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Confetti animation]                       │
│                                                         │
│   ┌────────────┐               ┌────────────┐         │
│   │   [Your    │               │ [Landlord  │         │
│   │    Photo]  │      ❤️       │   Photo]   │         │
│   └────────────┘               └────────────┘         │
│                                                         │
│         It's a Match!                                   │
│         You and Priya both liked this property          │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Send Message                     │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Keep Swiping                     │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓ (User taps "Send Message")

┌─────────────────────────────────────────────────────────┐
│ CHAT SCREEN OPENS WITH PRE-FILLED ICEBREAKERS         │
├─────────────────────────────────────────────────────────┤
│ [← Back]         Priya Sharma                  [📞][•••]│
│─────────────────────────────────────────────────────────│
│                                                         │
│  Property: Sky Villa, Koramangala                       │
│  ₹32,000/month • 2BHK • Available: 15 Feb              │
│                                                         │
│  ────────────────────────────────────────              │
│                                                         │
│  Quick Message Suggestions:                             │
│                                                         │
│  ┌───────────────────────────────────┐                │
│  │ Hi! Can we schedule a viewing?    │  (tap to send) │
│  └───────────────────────────────────┘                │
│                                                         │
│  ┌───────────────────────────────────┐                │
│  │ Is this property still available?  │                │
│  └───────────────────────────────────┘                │
│                                                         │
│  ┌───────────────────────────────────┐                │
│  │ Can you share more details?       │                │
│  └───────────────────────────────────┘                │
│                                                         │
│  ────────────────────────────────────────              │
│                                                         │
│  [Type a message...]            [📎] [😊] [Send]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Psychology:**[^35_1][^35_2]

- **Dopamine Loop:** Each swipe = anticipation, match = reward
- **Intermittent Rewards:** Matches are unpredictable (like slot machines)
- **Low Friction:** Gesture-based, no typing required
- **Instant Feedback:** Visual confirmation on every action

***

### FLOW 3: PROPERTY DETAIL VIEW

**Objective:** Provide all info needed to make decision

```
┌─────────────────────────────────────────────────────────┐
│ PROPERTY DETAIL SCREEN                                 │
├─────────────────────────────────────────────────────────┤
│ [← Back]                                    [❤️] [⋮]   │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │                                         │         │
│   │     [Photo Gallery - Swipeable]         │  (hero) │
│   │                                         │         │
│   │     [🎥 VR Tour]         1/12           │  (badge)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ₹32,000/month                         ★ 4.5 (12)     │
│   Sky Villa, Koramangala                                │
│                                                         │
│   2BHK • 1200 sqft • Semi-Furnished • 3rd Floor        │
│                                                         │
│   📍 15 min commute to your office                      │
│   🚇 5 min walk to Sony Signal Metro                    │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   ✨ 92% Match Score                                    │
│   Great fit based on your preferences!                  │
│                                                         │
│   ✓ Parking  ✓ Gym  ✓ Security  ✓ Power Backup        │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   About This Property                     [Read more ↓] │
│   Beautiful 2BHK apartment in prime                     │
│   Koramangala location. Close to...                     │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   Landlord: Priya Sharma              [View Profile →] │
│   ★★★★★ 5.0 (24 reviews)                               │
│   "Responsive and helpful"                              │
│   Responds in < 2 hours                                 │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   What's Nearby                            [See All →] │
│   🍽️ Koramangala Social (0.5 km)                       │
│   🏥 Apollo Hospital (2 km)                             │
│   🏬 Forum Mall (1 km)                                  │
│   🏫 DPS School (1.5 km)                                │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   Similar Properties                      [See All →]  │
│   [Card 1] [Card 2] [Card 3] (horizontal scroll)       │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   ⚠️ Report Property                                    │
│                                                         │
│─────────────────────────────────────────────────────────│
│  [❌ Not Interested]        [❤️ I'm Interested]        │
└─────────────────────────────────────────────────────────┘

                         ↓ (User taps VR Tour button)

┌─────────────────────────────────────────────────────────┐
│ VR TOUR VIEWER (Full Screen)                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│              [360° Panoramic View]                      │
│                                                         │
│     [Drag to look around or use device gyroscope]      │
│                                                         │
│                                                         │
│   Room:  [Living Room ▼]                               │
│   🏠 [Bedroom 1] [Bedroom 2] [Kitchen] [Bathroom]      │
│                                                         │
│   📐 Room Size: 250 sqft                                │
│                                                         │
│   [ℹ️] [📷] [❤️]    [× Close]                          │
│                                                         │
│─────────────────────────────────────────────────────────│
│  Tip: Move your phone to explore the room in 360°      │
└─────────────────────────────────────────────────────────┘

INTERACTIONS:
- Swipe/Drag → Look around 360°
- Pinch → Zoom in/out
- Tap Hotspots → View room details
- Tap Room Names → Jump to different rooms
- [VR Mode] → View in VR headset (Cardboard compatible)
```

**Key Features:**

- **Match Score:** AI-calculated (visible to build trust)
- **Commute Time:** Personalized based on work location
- **Social Proof:** Landlord ratings, response time
- **Scarcity:** "12 people viewed this today"
- **VR Tour:** Immersive viewing without physical visit

***

### FLOW 4: MATCHES \& MESSAGING

**Objective:** Convert matches into viewings[^35_4]

```
┌─────────────────────────────────────────────────────────┐
│ MATCHES SCREEN                                         │
├─────────────────────────────────────────────────────────┤
│ [☰]  Matches (5)            🔍 Search    🔔 [Notif: 2] │
│─────────────────────────────────────────────────────────│
│                                                         │
│   New Matches (2)                           [See All →]│
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Sky Villa, Koramangala    │  (card) │
│   │                                         │         │
│   │  Priya Sharma                           │         │
│   │  Matched 2 hours ago                    │         │
│   │  "Hi! The property is available..."    │         │
│   │                                         │         │
│   │  [Start Chat →]                         │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Green Heights, HSR        │         │
│   │  Amit Kumar                             │         │
│   │  Matched 5 hours ago                    │         │
│   │  [Start Chat →]                         │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   Active Conversations (3)                              │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Ocean View Apartments     │  (card) │
│   │  Neha Patel                  [🔴]       │         │
│   │  "Sure, viewing tomorrow at 4pm?"       │         │
│   │  2 min ago                              │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Sunrise Residency         │         │
│   │  Rahul Singh                            │         │
│   │  "I'll send you the agreement..."      │         │
│   │  1 hour ago                             │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   [Load More]                                          │
│                                                         │
│─────────────────────────────────────────────────────────│
│   [🏠 Home] [💬 Matches] [❤️ Saved] [👤 Profile]      │
└─────────────────────────────────────────────────────────┘

                         ↓ (User taps on conversation)

┌─────────────────────────────────────────────────────────┐
│ CHAT SCREEN                                            │
├─────────────────────────────────────────────────────────┤
│ [← Back]      Priya Sharma                 [📞] [•••]  │
│               ⚡ Active now                             │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ┌─────────────────────────────────────────┐          │
│  │  Sky Villa, Koramangala                 │ (context)│
│  │  ₹32,000/month • 2BHK                   │          │
│  │  [View Property →]                      │          │
│  └─────────────────────────────────────────┘          │
│                                                         │
│  ────────────────────────────────────────              │
│                                                         │
│  Today, 2:30 PM                                         │
│                                                         │
│           ┌────────────────────────────┐              │
│           │ Hi! Can we schedule a      │  (landlord)  │
│           │ viewing?                   │              │
│           └────────────────────────────┘              │
│           2:30 PM ✓✓                                   │
│                                                         │
│  ┌────────────────────────────┐                       │
│  │ Hi! The property is         │      (tenant - you)  │
│  │ available. When would you   │                       │
│  │ like to visit?              │                       │
│  └────────────────────────────┘                       │
│  2:32 PM ✓✓                                            │
│                                                         │
│           ┌────────────────────────────┐              │
│           │ How about tomorrow at 4pm? │              │
│           └────────────────────────────┘              │
│           2:35 PM ✓✓                                   │
│                                                         │
│  ┌────────────────────────────┐                       │
│  │ Perfect! See you then.      │                       │
│  └────────────────────────────┘                       │
│  2:36 PM ✓                                             │
│                                                         │
│  ────────────────────────────────────────              │
│                                                         │
│  Smart Reply Suggestions:                              │
│  [Yes, that works!] [Can we do 5pm instead?]           │
│                                                         │
│  ────────────────────────────────────────              │
│                                                         │
│  Quick Actions:                                         │
│  [📅 Schedule Viewing] [📋 Request Documents]          │
│                                                         │
│─────────────────────────────────────────────────────────│
│  [Type a message...]       [+] [📷] [😊] [Send]        │
└─────────────────────────────────────────────────────────┘

INTERACTIONS:
- Tap [📅 Schedule Viewing] → Opens calendar picker
- Tap [📋 Request Documents] → Sends template message
- Tap [📞] → Initiates call (shows phone number)
- Long press message → Copy, Delete, Forward
- Swipe right on message → Quick reply
- Pull down → Load older messages
```

**Key Features:**

- **Property Context Card:** Always visible in chat
- **Smart Replies:** AI-suggested responses
- **Quick Actions:** One-tap common tasks
- **Read Receipts:** ✓ (sent), ✓✓ (delivered), ✓✓ (read)
- **Online Status:** Real-time presence indicator

***

### FLOW 5: SAVED PROPERTIES

**Objective:** Let users bookmark \& revisit properties

```
┌─────────────────────────────────────────────────────────┐
│ SAVED PROPERTIES SCREEN                                │
├─────────────────────────────────────────────────────────┤
│ [☰]  Saved (12)                       [Sort ▼] [Filter]│
│─────────────────────────────────────────────────────────│
│                                                         │
│   Collections:                                          │
│   [All (12)] [Favorites (5)] [Maybe (3)] [Viewed (4)]  │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Large Thumbnail]                      │  (card) │
│   │                                         │         │
│   │  Sky Villa, Koramangala         [❤️]   │         │
│   │  ₹32,000/month • 2BHK • 92% Match      │         │
│   │                                         │         │
│   │  Saved 2 days ago                       │         │
│   │  [Message Landlord] [View Details]      │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Green Heights, HSR        │         │
│   │  ₹28,000/month • 2BHK • 88% Match      │         │
│   │  Saved 4 days ago                       │         │
│   │  [Message Landlord] [View Details]      │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Ocean View Apartments     │         │
│   │  ₹35,000/month • 3BHK • 85% Match      │         │
│   │  Saved 1 week ago                       │         │
│   │  ⚠️ Price dropped by ₹2,000!            │         │
│   │  [Message Landlord] [View Details]      │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   [Load More]                                          │
│                                                         │
│─────────────────────────────────────────────────────────│
│   [🏠 Home] [💬 Matches] [❤️ Saved] [👤 Profile]      │
└─────────────────────────────────────────────────────────┘

INTERACTIONS:
- Swipe left on card → Remove from saved
- Tap heart icon → Move to Favorites collection
- Long press → Options (Share, Compare, Add Note)
- Pull to refresh → Check for price/availability updates
- Tap [Sort] → Price, Match %, Date Saved, Distance
- Tap [Filter] → Same filters as main feed
```

**Key Features:**

- **Collections:** Organize saved properties
- **Price Alerts:** Notify when price drops
- **Availability Tracking:** Auto-remove rented properties
- **Compare Mode:** Side-by-side comparison (max 3)

***

### FLOW 6: LANDLORD JOURNEY

**Objective:** Simple property listing \& tenant management

```
┌─────────────────────────────────────────────────────────┐
│ LANDLORD DASHBOARD                                     │
├─────────────────────────────────────────────────────────┤
│ [☰]  Dashboard                           🔔 [Notif: 5] │
│─────────────────────────────────────────────────────────│
│                                                         │
│   Welcome back, Priya! 👋                              │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  This Month                             │  (stats)│
│   │  📊 125 views  •  💬 12 messages        │         │
│   │  ❤️ 23 likes   •  ⭐ 3 matches          │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   Your Properties (3)                    [+ Add New]   │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Sky Villa, Koramangala    │  (card) │
│   │                                         │         │
│   │  ₹32,000/month • 2BHK                   │         │
│   │  🟢 Available                            │         │
│   │                                         │         │
│   │  45 views • 8 likes • 2 new messages    │         │
│   │                                         │         │
│   │  [View Insights] [Edit] [Messages]      │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Green Heights, HSR        │         │
│   │  ₹28,000/month • 2BHK                   │         │
│   │  🔴 Rented (Contract ends: 30 Aug 2026) │         │
│   │  [View Contract] [Tenant Profile]       │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Thumbnail]  Ocean View Apartments     │         │
│   │  ₹35,000/month • 3BHK                   │         │
│   │  🟡 Maintenance (Back in 2 weeks)       │         │
│   │  [Mark as Available] [Edit]             │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   Tenant Requests (5)                    [View All →]  │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Avatar] Riya Sharma                   │  (card) │
│   │  Interested in: Sky Villa               │         │
│   │  ⭐ 95% compatibility                    │         │
│   │  [View Profile] [❌] [✓]                │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  [Avatar] Amit Kumar                    │         │
│   │  Interested in: Sky Villa               │         │
│   │  ⭐ 88% compatibility                    │         │
│   │  [View Profile] [❌] [✓]                │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│─────────────────────────────────────────────────────────│
│   [🏢 Properties] [👥 Tenants] [💬 Messages] [📊 Stats]│
└─────────────────────────────────────────────────────────┘

                         ↓ (User taps "+ Add New")

┌─────────────────────────────────────────────────────────┐
│ ADD PROPERTY (Step 1/4)                                │
├─────────────────────────────────────────────────────────┤
│ [× Cancel]          1/4 Basic Info        [Save Draft] │
│─────────────────────────────────────────────────────────│
│                                                         │
│   Property Details                                      │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  Property Title                         │         │
│   │  Sky Villa                              │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  Full Address                           │         │
│   │  123, 5th Cross, Koramangala...         │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   [📍 Use Current Location]                            │
│                                                         │
│   Property Type                                         │
│   ● Apartment  ○ Villa  ○ Independent House  ○ PG     │
│                                                         │
│   Configuration                                         │
│   ○ 1RK  ○ 1BHK  ● 2BHK  ○ 3BHK  ○ 4BHK+              │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  Size (sqft)                            │         │
│   │  1200                                   │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   Floor Details                                         │
│   ┌──────────┐  ┌──────────┐                          │
│   │ Floor    │  │ Total    │                          │
│   │ Number:3 │  │ Floors:5 │                          │
│   └──────────┘  └──────────┘                          │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Continue to Pricing →            │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ ADD PROPERTY (Step 2/4)                                │
├─────────────────────────────────────────────────────────┤
│ [← Back]            2/4 Pricing            [Save Draft] │
│─────────────────────────────────────────────────────────│
│                                                         │
│   Pricing Details                                       │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  Monthly Rent (₹)                       │         │
│   │  32,000                                 │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   💡 Suggested rent: ₹30,000 - ₹34,000                │
│   Based on similar properties in your area              │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  Security Deposit (₹)                   │         │
│   │  64,000                                 │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  Maintenance Charge (₹)                 │         │
│   │  2,000                                  │  (input)│
│   └─────────────────────────────────────────┘         │
│                                                         │
│   Furnishing Status                                     │
│   ○ Unfurnished  ● Semi-Furnished  ○ Fully Furnished  │
│                                                         │
│   Available From                                        │
│   ┌─────────────────────────────────────────┐         │
│   │  📅 Select Date: 15 Feb 2026            │  (date) │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Continue to Amenities →          │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ ADD PROPERTY (Step 3/4)                                │
├─────────────────────────────────────────────────────────┤
│ [← Back]          3/4 Amenities            [Save Draft] │
│─────────────────────────────────────────────────────────│
│                                                         │
│   Select Available Amenities                            │
│                                                         │
│   [✓ Parking] [✓ Gym] [  Swimming Pool]                │
│   [✓ Security] [✓ Power Backup] [✓ Lift]               │
│   [  Pet Friendly] [✓ Balcony] [✓ Wi-Fi]               │
│   [  Clubhouse] [  Playground] [+ Add Custom]           │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   Property Description                                  │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │  Beautiful 2BHK apartment in prime      │  (text) │
│   │  Koramangala location. Close to metro,  │         │
│   │  schools, and shopping centers...       │         │
│   │                                         │         │
│   │  (300 characters remaining)             │         │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   💡 Tips for better description:                      │
│   • Mention nearby landmarks                           │
│   • Highlight unique features                          │
│   • Be honest and detailed                             │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Continue to Photos →             │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓

┌─────────────────────────────────────────────────────────┐
│ ADD PROPERTY (Step 4/4)                                │
├─────────────────────────────────────────────────────────┤
│ [← Back]            4/4 Photos             [Save Draft] │
│─────────────────────────────────────────────────────────│
│                                                         │
│   Add Property Photos (Min 5, Max 15)                   │
│                                                         │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│   │ Photo 1 │ │ Photo 2 │ │ Photo 3 │ │ Photo 4 │    │
│   │ [Image] │ │ [Image] │ │ [Image] │ │ [Image] │    │
│   │   [×]   │ │   [×]   │ │   [×]   │ │   [×]   │    │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│                                                         │
│   ┌─────────┐ ┌─────────┐                             │
│   │ Photo 5 │ │   [+]   │                             │
│   │ [Image] │ │  Add    │                             │
│   │   [×]   │ │  Photo  │                             │
│   └─────────┘ └─────────┘                             │
│                                                         │
│   [📷 Take Photo] [🖼️ Choose from Gallery]            │
│                                                         │
│   💡 Photo Tips:                                        │
│   ✓ Good lighting, clean rooms                         │
│   ✓ Show all rooms (living, bedrooms, kitchen, bath)   │
│   ✓ Include amenities (gym, parking, etc.)             │
│   ✗ Avoid blurry or dark photos                        │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   🎥 Want a VR Tour? (Recommended)                     │
│   Professional 360° tour increases views by 3x          │
│                                                         │
│   [📅 Schedule VR Photoshoot - ₹4,999]                 │
│   We'll send a photographer to your property            │
│                                                         │
│   ────────────────────────────────────────             │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Publish Property 🎉              │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   [Save as Draft]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

                         ↓ (After publishing)

┌─────────────────────────────────────────────────────────┐
│ SUCCESS MODAL                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Celebration animation]                    │
│                                                         │
│         🎉 Property Published!                          │
│                                                         │
│   Your property is now live and visible to             │
│   thousands of verified tenants.                        │
│                                                         │
│   What happens next:                                    │
│   ✓ AI will match you with compatible tenants          │
│   ✓ You'll get notifications when tenants like it      │
│   ✓ You can review tenant profiles before responding   │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        View My Property                 │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
│   ┌─────────────────────────────────────────┐         │
│   │        Go to Dashboard                  │  (btn)  │
│   └─────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**

- **Smart Pricing:** AI-suggested rent based on market data
- **Draft Saving:** Don't lose progress
- **Photo Guidance:** Tips for better photos
- **VR Upsell:** Monetization opportunity
- **Instant Publishing:** Live immediately after submission

***

## 🎨 DESIGN SYSTEM

### Color Palette

```
Primary Colors:
- Indigo 600 (#4F46E5) - Main CTA buttons, active states
- Indigo 700 (#4338CA) - Hover states
- Indigo 50 (#EEF2FF) - Light backgrounds

Secondary Colors:
- Rose 500 (#F43F5E) - Like/Love actions, alerts
- Emerald 500 (#10B981) - Success states, available badge
- Amber 500 (#F59E0B) - Warnings, notifications

Neutral Colors:
- Gray 900 (#111827) - Primary text
- Gray 600 (#4B5563) - Secondary text
- Gray 300 (#D1D5DB) - Borders
- Gray 50 (#F9FAFB) - Card backgrounds
- White (#FFFFFF) - Main background
```


### Typography

```
Font Family: Inter (primary), SF Pro Display (iOS), Roboto (Android)

Headings:
- H1: 32px, Bold, Gray 900
- H2: 24px, Semibold, Gray 900
- H3: 20px, Semibold, Gray 900
- H4: 18px, Medium, Gray 900

Body:
- Large: 18px, Regular, Gray 600
- Medium: 16px, Regular, Gray 600
- Small: 14px, Regular, Gray 600
- Extra Small: 12px, Regular, Gray 500

Special:
- Button: 16px, Semibold
- Caption: 12px, Medium
- Label: 14px, Medium
```


### Component Library

```
Buttons:
┌─────────────────────────────────────────┐
│        Primary Button (Indigo)          │  Height: 56px, Radius: 12px
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        Secondary Button (Gray)          │  Height: 56px, Radius: 12px
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        Danger Button (Rose)             │  Height: 56px, Radius: 12px
└─────────────────────────────────────────┘

Cards:
┌─────────────────────────────────────────┐
│  [Image]                                │
│                                         │
│  Title (H3)                             │
│  Subtitle (Body Small)                  │
│  Meta info (Caption)                    │
│                                         │
│  [Action Button]                        │
└─────────────────────────────────────────┘
Shadow: 0px 4px 16px rgba(0,0,0,0.08)
Radius: 16px
Padding: 16px

Input Fields:
┌─────────────────────────────────────────┐
│  Label (Label)                          │
│  Placeholder text...                    │
└─────────────────────────────────────────┘
Height: 56px
Radius: 12px
Border: 1px Gray 300
Focus: 2px Indigo 600
```


### Spacing System

```
Scale: 4px base unit

4px   (1x) - Minimal spacing
8px   (2x) - Icon padding
12px  (3x) - Component padding
16px  (4x) - Card padding (default)
24px  (6x) - Section spacing
32px  (8x) - Page margins
48px  (12x) - Large section gaps
64px  (16x) - Very large spacing
```


### Iconography

```
Style: Outlined (Heroicons)
Size: 20px (small), 24px (default), 32px (large)
Stroke Width: 2px

Common Icons:
🏠 - Home/Properties
💬 - Messages/Chat
❤️ - Saved/Favorites
👤 - Profile/User
🔍 - Search
🔔 - Notifications
⚙️ - Settings
📍 - Location
📅 - Calendar
📷 - Camera/Photos
🎥 - Video/VR
✓ - Success/Complete
× - Close/Cancel
ℹ️ - Information
⋮ - More options (vertical)
```


***

## 🔄 NAVIGATION PATTERNS

### Bottom Navigation (Primary)

```
┌─────────────────────────────────────────────────────────┐
│   [🏠]      [💬]      [❤️]      [👤]                   │
│   Home     Matches    Saved    Profile                  │
│  (Active)                                               │
└─────────────────────────────────────────────────────────┘

Behavior:
- Always visible (except in full-screen modes)
- Active tab highlighted with Indigo 600
- Badge count on Matches tab for unread messages
- Haptic feedback on tap
- Swipe between tabs (horizontal gesture)
```


### Top Navigation (Secondary)

```
┌─────────────────────────────────────────────────────────┐
│ [☰ Menu]   Screen Title        [🔍] [Filter] [🔔 (3)]  │
└─────────────────────────────────────────────────────────┘

Left Side:
- Hamburger menu (☰) or Back arrow (←)
- Logo on home screen

Center:
- Screen title or search bar

Right Side:
- Contextual actions (search, filter, notifications)
- Notification badge count
```


### Gesture Navigation

```
Swipe Right → Go back
Swipe Left → Forward (if applicable)
Swipe Down → Refresh content
Long Press → Context menu
Double Tap → Quick like
Pinch → Zoom (on images)
```


***

## 🎭 MICRO-INTERACTIONS

### Swipe Animations[^35_2][^35_1]

```
Like (Swipe Right):
1. Card tilts 15° clockwise
2. Green heart appears top-right
3. Card flies off screen right
4. Haptic feedback (light impact)
5. Next card slides up with spring animation
Duration: 300ms

Dislike (Swipe Left):
1. Card tilts 15° counter-clockwise
2. Red X appears top-left
3. Card flies off screen left
4. Haptic feedback (light impact)
5. Next card slides up
Duration: 300ms

Super Like (Swipe Up):
1. Card moves up quickly
2. Blue star burst animation
3. Stronger haptic feedback
4. "Super Like Sent!" toast message
Duration: 400ms
```


### Match Animation

```
1. Screen darkens (0.8 opacity overlay)
2. Confetti falls from top (1s)
3. Profile photos zoom in from sides
4. Heart icon appears between photos (pulse)
5. "It's a Match!" text fades in
6. Action buttons slide up from bottom
Duration: 2s total
```


### Loading States

```
Skeleton Screens:
- Show gray boxes where content will load
- Subtle shimmer animation left-to-right
- Maintains layout structure
- Prevents layout shift

Spinners:
- Use for full-screen loads
- Indigo 600 color
- 32px size
- Center of screen
```


### Error States

```
Empty States:
┌─────────────────────────────────────────┐
│         [Illustration]                  │
│                                         │
│    No properties found                  │
│    Try adjusting your filters           │
│                                         │
│    [Adjust Filters]                     │
└─────────────────────────────────────────┘

Error Messages:
┌─────────────────────────────────────────┐
│ ⚠️ Something went wrong                 │
│ Please try again                        │
│ [Retry]                                 │
└─────────────────────────────────────────┘
Position: Bottom of screen (toast)
Duration: 4 seconds
Dismissible: Swipe down
```


***

## 📊 ANALYTICS \& TRACKING

### Key Events to Track

```
User Acquisition:
- App Install
- Onboarding Started
- Onboarding Completed
- Phone Verification Success
- Profile Setup Completed
- First Swipe

Engagement:
- Session Start/End
- Screen View (all screens)
- Property Viewed
- Property Detail Opened
- VR Tour Viewed
- Property Liked/Disliked
- Property Saved
- Match Created
- Message Sent
- Viewing Scheduled

Conversion:
- Subscription Started
- Payment Completed
- Lease Signed
- Property Listed (landlord)
- VR Tour Purchased

Retention:
- Daily Active Users
- Weekly Active Users
- Churn Rate
- Session Length
- Return Rate (Day 1, 7, 30)
```


### User Journey Funnel

```
Tenant Funnel:
App Install → 100%
  ↓
Onboarding Complete → 80%
  ↓
Phone Verified → 95%
  ↓
Profile Setup → 70%
  ↓
First Swipe → 85%
  ↓
First Like → 60%
  ↓
Mutual Match → 15%
  ↓
Message Sent → 80%
  ↓
Viewing Scheduled → 40%
  ↓
Lease Signed → 30%

Expected Conversion: 100 installs → 2-3 leases
```


***

## 🚀 PERFORMANCE BENCHMARKS

### Load Times

```
Target Metrics:
- App Launch: <2s (cold start)
- Screen Transition: <300ms
- Property Card Load: <500ms
- VR Tour Load: <3s (depends on size)
- Image Load: <1s (with progressive loading)
- API Response: <500ms (p95)
```


### Image Optimization

```
Formats:
- WebP for photos (60% smaller than JPEG)
- SVG for icons and illustrations
- Progressive JPEG fallback

Sizes:
- Thumbnail: 400x300px
- Card Image: 800x600px
- Full Screen: 1200x900px
- VR Panorama: 4096x2048px (optimized)

Lazy Loading:
- Load images as user scrolls
- Placeholder blur effect
- Priority loading for above-fold content
```


***

## 🔐 SECURITY \& PRIVACY

### Data Privacy

```
User Consent:
┌─────────────────────────────────────────┐
│   Privacy & Permissions                 │
│                                         │
│   ✓ Location Access (for property search)│
│   ✓ Camera (for photos)                 │
│   ✓ Notifications (for matches)         │
│   ○ Contacts (optional, for referrals)  │
│                                         │
│   [Learn More] [Continue]               │
└─────────────────────────────────────────┘

Data Collection:
- Phone number (required for auth)
- Location (city-level, not precise GPS)
- Device info (for analytics)
- Usage data (anonymized)

Data NOT Collected:
- Precise GPS location
- Contact list (unless opted-in)
- Browsing history outside app
- Social media data
```


### Trust \& Safety

```
Verification Badges:
✓ Phone Verified (all users)
✓ Email Verified (optional)
✓ ID Verified (KYC via Aadhar)
✓ Landlord Verified (property ownership docs)

Report & Block:
- Report inappropriate content
- Block users
- Flag fake listings
- Emergency support contact
```


***

## 📱 RESPONSIVE DESIGN

### Breakpoints

```
Mobile Portrait: 320px - 428px (primary focus)
Mobile Landscape: 568px - 926px
Tablet Portrait: 768px - 1024px
Tablet Landscape: 1024px - 1366px
Desktop: 1440px+ (admin/web dashboard)
```


### Adaptive Layouts

```
Mobile (< 600px):
- Single column layout
- Full-width cards
- Bottom navigation
- Swipe-first interactions

Tablet (600px - 1024px):
- Two column grid (property list)
- Side navigation option
- Split view (list + detail)
- Both touch and mouse support

Desktop (> 1024px):
- Three column layout
- Persistent side navigation
- Hover states
- Keyboard shortcuts
```


***

## ✅ ACCESSIBILITY

### WCAG 2.1 AA Compliance

```
Color Contrast:
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

Touch Targets:
- Minimum: 44x44px
- Spacing: 8px between targets
- Thumb-friendly zones

Screen Readers:
- Semantic HTML elements
- ARIA labels on interactive elements
- Image alt text
- Focus indicators

Keyboard Navigation:
- Tab order logical
- Enter/Space to activate
- Esc to close modals
- Arrow keys for carousels
