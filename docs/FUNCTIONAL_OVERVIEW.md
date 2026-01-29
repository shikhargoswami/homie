# Homie - Comprehensive Functional Overview

> **Document Type**: Startup Functional Analysis  
> **Last Updated**: January 29, 2026  
> **Read Time**: 15 minutes

---

## Table of Contents
1. [What is Homie?](#1-what-is-homie)
2. [What Does Homie Do?](#2-what-does-homie-do)
3. [User Journey Implementation](#3-user-journey-implementation)
4. [Metrics by Journey Stage](#4-metrics-by-journey-stage)
5. [Revenue Model & Earning Stages](#5-revenue-model--earning-stages)
6. [Technical Implementation Status](#6-technical-implementation-status)

---

## 1. What is Homie?

### The One-Liner
**Homie is a hyper-local rental marketplace that matches tenants with properties using AI—eliminating brokers, endless calls, and wasted weekends.**

### The Core Concept
Think **"Tinder meets Airbnb for long-term rentals"**:
- Tenants swipe through properties
- Landlords swipe through tenants
- Mutual interest = Match → Chat → View → Rent

### Key Differentiator: Deep, Not Wide
| Traditional Platforms (NoBroker) | Homie |
|----------------------------------|-------|
| 50,000 listings city-wide | 100 verified listings per micro-market |
| Basic filters (BHK, price) | AI matching on 15+ factors |
| Call landlord for every question | All info upfront (photos, video, amenities, rules) |
| Anyone can message anyone | Only matched parties communicate |

### The Problem We Solve
> **"More listings ≠ better experience. NoBroker gives you 500 options and 50 phone calls. Homie gives you 20 perfect matches and zero wasted calls."**

| For Tenants | For Landlords |
|-------------|---------------|
| No ₹30-50K broker fees | No 50 calls asking same questions |
| No calling 20 landlords for basic info | No unqualified leads |
| No visiting 15-20 properties | No no-shows at viewings |
| Protected security deposit | Guaranteed rent payments |

---

## 2. What Does Homie Do?

Homie handles the **entire rental journey** from discovery to monthly rent:

| Journey Stage | What Homie Does | Value Delivered |
|---------------|-----------------|-----------------|
| **Discovery** | AI matches tenants with compatible properties | 20 perfect matches vs. 500 random listings |
| **Communication** | In-app chat after mutual match | No spam calls, no phone number leakage |
| **Viewing** | Schedule property visits with commitment deposit | Filters serious tenants, no no-shows |
| **Agreement** | Digital rental agreement with e-signature | Legal, RERA-compliant, instant |
| **Payments** | Escrow deposit protection + automated rent | Security for both parties |

### Target Customers

#### Tenants (Demand Side)
- **Who**: Young professionals (22-35 years)
- **Income**: ₹5-15 lakh/year
- **Trigger**: Relocating for jobs, lease expiring
- **Pain**: Broker fees, trust issues, time waste

#### Landlords (Supply Side)
- **Who**: Individuals owning 1-3 rental properties
- **Pain**: Unqualified inquiries, no-shows, rent collection hassles
- **Value**: Quality tenants, guaranteed payments

---

## 3. User Journey Implementation

### Stage 1: Awareness & Acquisition (Pre-Sign-Up)

#### What Happens
User realizes need to find rental → Discovers Homie via search/ads/referrals → Lands on app/website

#### Implemented Features
| Feature | Status | Implementation |
|---------|--------|----------------|
| App download & launch | ✅ Complete | React Native + Expo SDK |
| Landing experience | ✅ Complete | Mobile app with value prop |
| Social proof display | 🔄 Planned | Testimonials, ratings |

#### Acquisition Channels
| Channel | Strategy | Target CAC |
|---------|----------|------------|
| Referrals | "Invite friend, both get ₹500" | ₹500/user |
| Google Search | "Flats for rent in Koramangala" | ₹50-100/click |
| Instagram/Facebook | Video ads showing swipe demo | ₹30-50/click |
| Content Marketing | Blogs on renting without brokers | Free |
| Corporate Partnerships | HR relocation assistance | Revenue share |

---

### Stage 2: Onboarding (Sign-Up to Profile Complete)

#### What Happens
User enters phone → Receives OTP → Verifies → Selects user type → Completes profile

#### Implemented Features
| Feature | Status | API Endpoint | Mobile Screen |
|---------|--------|--------------|---------------|
| Phone input | ✅ Complete | `POST /auth/request-otp` | PhoneInputScreen |
| OTP verification | ✅ Complete | `POST /auth/verify-otp` | OTPVerificationScreen |
| User type selection | ✅ Complete | `POST /onboarding/user-type` | UserTypeScreen |
| Tenant onboarding | ✅ Complete | `POST /onboarding/tenant` | TenantOnboardingScreen |
| Landlord onboarding | ✅ Complete | `POST /onboarding/landlord` | LandlordOnboardingScreen |

#### Tenant Preference Capture (3-Tier System)
```
NON-NEGOTIABLES (Deal-breakers):
├── Budget range (₹5K-50K)
├── Location (specific neighborhoods)
├── Configuration (1BHK-4BHK)
└── Property type (Apartment/Villa/PG)

MUST-HAVES (Important but flexible):
├── Furnishing level
├── Parking requirement
└── Pet policy

NICE-TO-HAVES (Bonus features):
├── Gym/Pool access
├── Power backup
└── Specific amenities
```

#### User Flow Diagram
```
┌──────────────┐    ┌─────────────┐    ┌────────────────┐
│ Phone Input  │───▶│ OTP Verify  │───▶│ User Type      │
│              │    │             │    │ Selection      │
└──────────────┘    └─────────────┘    └────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
            │ Full Home    │          │ Room Seeker  │          │ Landlord     │
            │ Tenant Flow  │          │ Flow         │          │ Flow         │
            └──────────────┘          └──────────────┘          └──────────────┘
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
            │ Preferences  │          │ Lifestyle    │          │ Add Property │
            │ & Budget     │          │ & Flatmate   │          │ Details      │
            └──────────────┘          └──────────────┘          └──────────────┘
```

---

### Stage 3: Discovery (Browsing & Swiping)

#### What Happens
User sees property feed sorted by AI compatibility → Swipes right (interested) or left (pass) → Views property details

#### Implemented Features
| Feature | Status | Implementation Details |
|---------|--------|------------------------|
| AI Match Scoring | ✅ Complete | Algorithm scoring 0-100% compatibility |
| Tinder-style Swipe UI | ✅ Complete | Full-screen immersive cards |
| Property Detail View | ✅ Complete | Photos, amenities, rules, landlord info |
| Like/Pass Actions | ✅ Complete | Swipe gestures + button taps |
| Commute Calculator | 🔄 Partial | Backend ready, needs Google Maps API key |

#### Matching Algorithm Factors
```
COMPATIBILITY SCORE CALCULATION:

Budget Match (30% weight)
├── Perfect match: +30 points
├── Within ±10%: +25 points
└── Outside range: 0 points

Location Match (25% weight)
├── Preferred area: +25 points
├── Adjacent area: +15 points
└── Far area: 0 points

Preferences Match (25% weight)
├── All must-haves met: +25 points
├── Some met: +15 points
└── None met: 0 points

Nice-to-haves Match (20% weight)
├── Each matching amenity: +5 points
└── Capped at 20 points

FINAL SCORE = Sum of all components (0-100%)
```

#### User Flow Diagram
```
┌──────────────────────────────────────────────────────────┐
│                    PROPERTY CARD                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │        [Photo Carousel - 8 photos]              │    │
│  │                                                  │    │
│  │  🟢 87% Match                                    │    │
│  │                                                  │    │
│  │  2BHK • Koramangala 5th Block                   │    │
│  │  ₹28,000/month                                  │    │
│  │                                                  │    │
│  │  📍 25 min to your office                       │    │
│  │  🏠 Fully Furnished • Pet-Friendly              │    │
│  │  ✅ Verified Owner                              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│        ⬅️ PASS              LIKE ➡️                      │
└──────────────────────────────────────────────────────────┘
```

---

### Stage 4: Matching (Mutual Interest)

#### What Happens
Tenant swipes right → Landlord notified → Landlord swipes right → MATCH! → Chat unlocked

#### Implemented Features
| Feature | Status | Implementation |
|---------|--------|----------------|
| Match detection | ✅ Complete | Real-time mutual interest check |
| Match notification | ✅ Complete | Push notification + in-app alert |
| Matches list screen | ✅ Complete | View all active matches |
| Chat unlock on match | ✅ Complete | WebSocket-based chat |

#### Match Flow
```
TENANT                          LANDLORD
   │                               │
   │  Swipes Right on Property     │
   │──────────────────────────────▶│
   │                               │
   │     Receives Notification     │
   │◀──────────────────────────────│
   │                               │
   │                               │  Reviews Tenant Profile
   │                               │  (Budget, Preferences, Verification)
   │                               │
   │       Swipes Right            │
   │◀──────────────────────────────│
   │                               │
   │        🎉 MATCH! 🎉            │
   │                               │
   │      Chat Unlocked            │
   │◀─────────────────────────────▶│
```

---

### Stage 5: Communication (Chat & Discussion)

#### What Happens
Matched parties chat → Discuss property details → Clarify doubts → Build rapport

#### Implemented Features
| Feature | Status | Implementation |
|---------|--------|----------------|
| Real-time WebSocket Chat | ✅ Complete | Socket.io integration |
| Chat List Screen | ✅ Complete | All conversations with last message |
| Individual Chat Screen | ✅ Complete | Full message history |
| Quick Reply Templates | ✅ Complete | Pre-written responses |
| Read receipts | ✅ Complete | Message delivery status |

#### Quick Reply Templates (Implemented)
```
TENANT TEMPLATES:
├── "When is the property available for move-in?"
├── "Is the security deposit negotiable?"
├── "Can I schedule a viewing this weekend?"
├── "Are there any maintenance charges?"
└── "Is parking included?"

LANDLORD TEMPLATES:
├── "The property is available from [date]"
├── "Yes, we can discuss the deposit"
├── "What's your preferred viewing time?"
├── "Monthly maintenance is ₹[amount]"
└── "Yes, 1 car + 1 bike parking included"
```

---

### Stage 6: Viewing (Property Visit)

#### What Happens
Tenant requests viewing → Pays commitment deposit (₹1,000) → Landlord confirms → Visit happens

#### Implemented Features
| Feature | Status | Implementation |
|---------|--------|----------------|
| Viewing request | ✅ Complete | In-chat request flow |
| Viewing scheduling | ✅ Complete | Date/time slot selection |
| Status tracking | ✅ Complete | Pending/Confirmed/Completed states |
| Viewing reminders | 🔄 Partial | Needs push notification setup |

#### Viewing Flow
```
┌───────────────────┐
│ Request Viewing   │
│ (₹1,000 deposit)  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐    ┌───────────────────┐
│ Landlord Reviews  │───▶│ Approve/Reschedule│
│ Request           │    │ /Decline          │
└───────────────────┘    └─────────┬─────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │ ✅ Confirmed │        │ 📅 Rescheduled│        │ ❌ Declined   │
   │ Show address │        │ New time      │        │ Refund deposit│
   └──────────────┘        └──────────────┘        └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Attend Visit │
   │ Mark Complete│
   └──────────────┘
```

---

### Stage 7: Commitment (Token & Negotiation)

#### What Happens (Future Implementation)
Tenant interested after viewing → Pays token (₹5,000) → Negotiates terms → Locks property

#### Implementation Status
| Feature | Status | Notes |
|---------|--------|-------|
| Token payment | ❌ Not implemented | Post-MVP |
| Negotiation UI | ❌ Not implemented | Post-MVP |
| Property lock | ❌ Not implemented | Post-MVP |

---

### Stage 8: Agreement (Digital Contract)

#### What Happens (Future Implementation)
Terms finalized → Digital agreement generated → E-signatures → Legal contract

#### Implementation Status
| Feature | Status | Notes |
|---------|--------|-------|
| Agreement templates | ❌ Not implemented | RERA-compliant templates needed |
| E-signature (Aadhaar) | ❌ Not implemented | High complexity |
| PDF generation | ❌ Not implemented | Post-MVP |

---

### Stage 9: Move-In (Escrow & Setup)

#### What Happens (Future Implementation)
Security deposit paid to escrow → Move-in inspection → Keys handed over

#### Implementation Status
| Feature | Status | Notes |
|---------|--------|-------|
| Escrow integration | ❌ Not implemented | Razorpay partnership needed |
| Move-in inspection | ❌ Not implemented | Photo documentation feature |
| Deposit protection | ❌ Not implemented | Core value prop for trust |

---

### Stage 10: Tenancy (Ongoing Relationship)

#### What Happens (Future Implementation)
Monthly rent autopay → Maintenance requests → Rent receipts → Eventually move-out

#### Implementation Status
| Feature | Status | Notes |
|---------|--------|-------|
| Rent autopay | ❌ Not implemented | Payment gateway integration |
| Maintenance portal | ❌ Not implemented | Post-MVP |
| Rent receipts | ❌ Not implemented | Auto-generation feature |

---

## 4. Metrics by Journey Stage

### Stage 1: Awareness Metrics

| Metric | Definition | Target | What It Tells Us | Red Flag |
|--------|------------|--------|------------------|----------|
| **Impressions** | # times ad/content seen | 1M+/month | Brand awareness | <500K |
| **CTR** | % who click on ad | Paid: 2-3%, Organic: 8-10% | Message resonance | <1.5% |
| **Landing Page Views** | # visitors | 50K+/month | Top-of-funnel volume | <20K |
| **Bounce Rate** | % leave without action | <60% | Page quality | >70% |
| **Time on Page** | Avg seconds | 45-60 sec | Engagement | <30 sec |

---

### Stage 2: Onboarding Metrics

| Metric | Definition | Target | What It Tells Us | Red Flag |
|--------|------------|--------|------------------|----------|
| **Sign-Up Start Rate** | % visitors who click sign up | 15-20% | CTA effectiveness | <10% |
| **Sign-Up Completion** | % who complete full flow | 70-80% | Friction level | <60% |
| **OTP Success Rate** | % who receive and enter OTP | >90% | Technical reliability | <85% |
| **Profile Completion** | % who fill all preferences | 80%+ | Onboarding quality | <70% |
| **Time to Complete** | Median seconds | 45-90 sec | Flow friction | >2 min |

---

### Stage 3: Discovery Metrics

| Metric | Definition | Target | What It Tells Us | Red Flag |
|--------|------------|--------|------------------|----------|
| **DAU** | Daily active users | 1,000+ | Product usage | Declining W/W |
| **Swipe Rate** | Avg swipes per session | 15-25 | Engagement | <10 |
| **Right Swipe Rate** | % of interested swipes | 15-20% | Match quality | <10% |
| **Session Length** | Avg minutes browsing | 8-12 min | Stickiness | <5 min |
| **Return Rate (D1)** | % return within 24hrs | 60-70% | Product-market fit | <50% |

---

### Stage 4: Matching Metrics

| Metric | Definition | Target | What It Tells Us | Red Flag |
|--------|------------|--------|------------------|----------|
| **Match Rate** | % right swipes → mutual match | 15-20% | Supply-demand balance | <10% |
| **First Message Rate** | % matches with tenant message | 70-80% | User intent | <60% |
| **Response Rate** | % messages with landlord reply | 75-85% | Supply engagement | <65% |
| **Time to Response** | Median hours to reply | <24 hrs | Marketplace velocity | >48 hrs |

---

### Stage 5: Communication Metrics

| Metric | Definition | Target | What It Tells Us | Red Flag |
|--------|------------|--------|------------------|----------|
| **Messages per Match** | Avg messages exchanged | 5-8 | Engagement quality | <3 |
| **Quick Reply Usage** | % using templates | 30-40% | Feature adoption | N/A |
| **Chat → Viewing %** | % chats leading to viewing | 40-50% | Conversion | <30% |
| **Avg Response Time** | Minutes to reply | <2 hrs | User engagement | >6 hrs |

---

### Stage 6: Viewing Metrics

| Metric | Definition | Target | What It Tells Us | Red Flag |
|--------|------------|--------|------------------|----------|
| **Deposit Payment Rate** | % matched users who pay | 50-60% | Feature acceptance | <40% |
| **Show-Up Rate** | % paid → actually viewed | 85-90% | Deposit effectiveness | <80% |
| **Viewing → Interest %** | % viewings with interest | 50-60% | Lead quality | <40% |
| **Forfeit Rate** | % deposits forfeited | 5-10% | User seriousness | >15% |

---

### Stage 7-10: Transaction Metrics (Future)

| Metric | Definition | Target | What It Tells Us | Red Flag |
|--------|------------|--------|------------------|----------|
| **Token Conversion** | % viewing → token payment | 40-50% | Deal progression | <30% |
| **Agreement Completion** | % token → signed agreement | 80-90% | Process efficiency | <70% |
| **Escrow Adoption** | % deals using escrow | 70-80% | Trust in platform | <50% |
| **Bypass Rate** | % deals closed offline | <20% | Revenue leakage | >25% |

---

### North Star Metric

> **Monthly Successful Transactions (MST)** = Number of tenants who move into properties through Homie

### Key Business Health Metrics

| Metric | Definition | Target | What It Tells Us |
|--------|------------|--------|------------------|
| **GMV** | Gross deposits through platform | ₹50L+/month | Transaction volume |
| **Revenue** | Total platform earnings | ₹2-3L/month | Monetization |
| **Take Rate** | Revenue as % of GMV | 3-4% | Business efficiency |
| **CAC** | Cost to acquire customer | <₹1,000 | Marketing efficiency |
| **LTV** | Lifetime value per customer | >₹6,000 | Customer value |
| **LTV:CAC Ratio** | Return on acquisition | >6:1 | Unit economics |

---

## 5. Revenue Model & Earning Stages

### Revenue Streams Overview

| Revenue Stream | Journey Stage | When We Earn | Amount | Implementation Status |
|----------------|---------------|--------------|--------|----------------------|
| **Viewing Deposit** | Stage 6 | Scheduling viewing | ~₹50/viewing (forfeit avg) | ❌ Not implemented |
| **Token Payment Fee** | Stage 7 | Locking property | 1.5% of ₹5,000 = ₹75 | ❌ Not implemented |
| **Escrow Fee** | Stage 9 | Deposit transfer | 1.5% of deposit | ❌ Not implemented |
| **Escrow Float Interest** | Stage 10 | During tenancy | 6% annual on held deposits | ❌ Not implemented |
| **Rent Automation Fee** | Stage 10 | Monthly rent | 1% of rent/month | ❌ Not implemented |
| **Premium Subscriptions** | All stages | Ongoing | ₹49-299/month | ✅ Schema ready |

---

### Revenue Stream Details

#### 1. Viewing Deposit (Stage 6)
```
HOW IT WORKS:
├── Tenant pays ₹1,000 to schedule viewing
├── Refundable if viewing happens and deal closes on platform
├── Forfeited if tenant no-shows without notice
└── ~5% forfeit rate = ₹50 average revenue per viewing

WHY IT WORKS:
├── Filters unserious tenants
├── Reduces landlord time waste
└── Creates commitment

IMPLEMENTATION NEEDED:
├── Payment gateway integration (Razorpay)
├── Refund logic
└── Forfeit tracking
```

#### 2. Token Payment Fee (Stage 7)
```
HOW IT WORKS:
├── Tenant pays ₹5,000 to "lock" property after viewing
├── Shows serious intent to landlord
├── Platform charges 1.5% processing fee = ₹75
└── Token applied to security deposit later

IMPLEMENTATION NEEDED:
├── Payment capture flow
├── Property lock status
└── Fee calculation
```

#### 3. Security Deposit Escrow (Stage 9)
```
HOW IT WORKS:
├── Tenant deposits ₹50,000-2,00,000 in escrow
├── Platform charges 1.5% escrow fee
├── Example: ₹75,000 × 1.5% = ₹1,125 fee
└── Money held securely until lease ends

IMPLEMENTATION NEEDED:
├── Escrow partnership (Razorpay/licensed provider)
├── Move-in inspection flow
├── Deposit release logic
└── Dispute resolution system
```

#### 4. Escrow Float Interest (Stage 10)
```
HOW IT WORKS:
├── ₹75,000 deposit sits in escrow for 12-24 months
├── Platform earns ~6% annual interest on float
├── Example: ₹75,000 × 6% = ₹4,500/year
└── Interest accrues across all deposits

IMPLEMENTATION NEEDED:
├── Treasury management
├── Interest calculation
└── Regulatory compliance
```

#### 5. Rent Automation Fee (Stage 10)
```
HOW IT WORKS:
├── Tenant sets up autopay for monthly rent
├── Platform deducts 1% as processing fee
├── 0.5% returned as cashback to tenant
├── Net: 0.5% platform revenue
└── Example: ₹25,000 × 0.5% × 11 months = ₹1,375/year

IMPLEMENTATION NEEDED:
├── Mandate/autopay setup
├── Monthly deduction logic
├── Cashback distribution
```

#### 6. Premium Subscriptions (All Stages)
```
TENANT TIERS:
├── Free: 10 swipes/week, basic features
├── Plus (₹49/month): Unlimited swipes, priority matching
└── Premium (₹99/month): VR tours, priority support

LANDLORD TIERS:
├── Free: 1 property listing
├── Pro (₹299/month): Featured listing, tenant insights, analytics
└── Business (₹999/month): Multiple properties, dedicated support

IMPLEMENTATION STATUS:
├── ✅ Schema ready (subscriptions table)
├── ❌ Payment integration needed
└── ❌ Feature gating needed
```

---

### Revenue Per Successful Transaction

```
REVENUE BREAKDOWN (Per Deal):

┌─────────────────────────────────────────────┐
│ Viewing deposit forfeit (5% avg):    ₹50    │
│ Token payment fee:                   ₹75    │
│ Escrow fee (1.5% of ₹75K):          ₹1,125  │
│ Escrow interest (annual):           ₹4,500  │
│ Rent automation (annual):           ₹1,375  │
├─────────────────────────────────────────────┤
│ TOTAL PER DEAL:                    ~₹7,125  │
└─────────────────────────────────────────────┘

SUBSCRIPTION REVENUE (Monthly):
├── 1,000 Tenant Plus @ ₹49 = ₹49,000
├── 200 Landlord Pro @ ₹299 = ₹59,800
└── Total subscription MRR = ₹1,08,800

COMPARISON:
├── NoBroker: ~₹1,500 per user (subscription only)
├── Homie: ~₹7,125 per transaction (5x more)
└── Reason: We're transaction-linked, not just subscription
```

---

### Earning Stage Summary

| Stage | What We Earn | When | Est. Revenue |
|-------|--------------|------|--------------|
| **Discovery** | Tenant Premium subscription | Ongoing | ₹49-99/month |
| **Discovery** | Landlord Premium subscription | Ongoing | ₹299-999/month |
| **Viewing** | Viewing deposit forfeit | On no-show | ₹50/viewing avg |
| **Commitment** | Token payment fee | Property lock | ₹75/deal |
| **Move-In** | Escrow fee | Deposit transfer | ₹1,125/deal avg |
| **Tenancy** | Float interest | During lease | ₹4,500/year avg |
| **Tenancy** | Rent automation fee | Monthly | ₹125/month avg |

---

## 6. Technical Implementation Status

### MVP Features (Implemented ✅)

| Feature | API | Mobile | Database |
|---------|-----|--------|----------|
| Phone OTP Authentication | ✅ | ✅ | ✅ |
| User Type Selection | ✅ | ✅ | ✅ |
| Tenant Onboarding | ✅ | ✅ | ✅ |
| Landlord Onboarding | ✅ | ✅ | ✅ |
| Property Search/Filtering | ✅ | ✅ | ✅ |
| AI Match Scoring | ✅ | ✅ | ✅ |
| Tinder-style Swipe UI | ✅ | ✅ | N/A |
| Property Details | ✅ | ✅ | ✅ |
| Like/Pass Actions | ✅ | ✅ | ✅ |
| Real-time Chat | ✅ | ✅ | ✅ |
| Quick Reply Templates | ✅ | ✅ | ✅ |
| Viewing Scheduling | ✅ | ✅ | ✅ |
| Landlord Dashboard | ✅ | ✅ | N/A |
| Property Management (CRUD) | ✅ | ✅ | ✅ |
| Matches Screen | ✅ | ✅ | ✅ |
| Profile Screen | ✅ | ✅ | ✅ |

### In Progress 🔄

| Feature | Blocker |
|---------|---------|
| Commute Time Calculator | Needs Google Maps API key |
| Push Notifications | Needs expo-notifications setup |
| Landlord Tenant Discovery | Needs tenant swipe UI for landlords |

### Post-MVP (Not Implemented ❌)

| Feature | Priority | Complexity | Revenue Impact |
|---------|----------|------------|----------------|
| Payment Gateway Integration | 🔴 Critical | High | Enables all transactions |
| Escrow System | 🔴 Critical | High | Core revenue stream |
| KYC Verification (Aadhaar) | 🟡 High | High | Trust & compliance |
| E-Agreement Generation | 🟡 High | High | Legal protection |
| Rent Autopay | 🟡 High | High | Recurring revenue |
| VR 360° Tours | 🟢 Medium | High | Premium feature |
| Maintenance Portal | 🟢 Medium | Medium | Retention |

---

### Tech Stack

```
FRONTEND (Mobile):
├── React Native + Expo SDK 54
├── TypeScript
├── React Navigation
└── Socket.io Client (real-time chat)

BACKEND (API):
├── Node.js + Express.js
├── TypeScript
├── PostgreSQL database
├── Socket.io (WebSocket server)
└── JWT authentication

SHARED:
├── TypeScript types
├── Validators (Zod)
└── Constants

ARCHITECTURE:
├── Feature-based organization
├── Controllers → Services → Database pattern
├── Shared package for cross-platform code
```

---

### Database Schema (Current State)

```
CORE TABLES:
├── users - Base user records
├── tenant_profiles - Tenant preferences
├── landlord_profiles - Landlord info & ratings
├── properties - Property listings
├── matches - Tenant-property matches
├── deals - Rental agreements (future)
├── subscriptions - Premium tiers

CHAT TABLES:
├── conversations - Chat threads
├── messages - Individual messages
├── viewings - Scheduled viewings
├── quick_reply_templates - Response templates

NEEDED FOR REVENUE:
├── ❌ payments - Transaction records
├── ❌ agreements - Digital contracts
├── ❌ escrow_deposits - Held deposits
├── ❌ rent_payments - Monthly payments
└── ❌ kyc_verifications - Identity checks
```

---

## Quick Reference: Journey → Metrics → Revenue

| Journey Stage | Key Metric | Target | Revenue Stream | Status |
|---------------|------------|--------|----------------|--------|
| Awareness | CTR | 2-10% | None | ✅ Ready |
| Onboarding | Completion Rate | 70-80% | None | ✅ Implemented |
| Discovery | Swipe Rate | 15-25/session | Tenant Premium | ✅ Implemented |
| Matching | Match Rate | 15-20% | None | ✅ Implemented |
| Communication | Response Rate | 75-85% | None | ✅ Implemented |
| Viewing | Show-Up Rate | 85-90% | Viewing Forfeit | 🔄 Partial |
| Commitment | Token Conversion | 40-50% | Token Fee | ❌ Not Built |
| Agreement | Completion Rate | 80-90% | None | ❌ Not Built |
| Move-In | Escrow Adoption | 70-80% | Escrow Fee | ❌ Not Built |
| Tenancy | Autopay Adoption | 60-70% | Rent Fee + Interest | ❌ Not Built |

---

## Success Milestones

### For Angel Round
```
✓ 100 successful transactions
✓ ₹50 lakh GMV through escrow
✓ 3-4% take rate proven
✓ 80% landlord list 2nd property (supply retention)
✓ <20% bypass rate
✓ LTV:CAC ratio >6:1
```

### For Seed Round
```
✓ 1,000 monthly successful transactions
✓ ₹5 Cr GMV through platform
✓ Positive unit economics
✓ 3 micro-markets dominated (Koramangala, Indiranagar, HSR)
✓ 50% market share in served areas
```

---

*Document prepared for internal stakeholder alignment and investor discussions.*
