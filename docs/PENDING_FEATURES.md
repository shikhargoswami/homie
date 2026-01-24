# Homie - Pending Features & Roadmap

> **Document Purpose**: Comprehensive list of features pending implementation, organized by priority and user journey stage.

---

## 📊 Implementation Summary

| Category | Implemented | Pending | Total |
|----------|-------------|---------|-------|
| Core User Journey | 18 | 6 | 24 |
| Revenue Features | 2 | 8 | 10 |
| Trust & Safety | 3 | 5 | 8 |
| Post-Move-In | 0 | 7 | 7 |
| Growth & Marketing | 0 | 5 | 5 |
| **Total** | **23** | **31** | **54** |

---

## ✅ Currently Implemented (MVP Complete)

### Stage 1-2: Awareness → Consideration
- [x] Phone OTP Authentication (bypass code for dev: `123456`)
- [x] User Type Selection (Tenant/Landlord)
- [x] Tenant Onboarding (Non-negotiables, Must-haves, Nice-to-haves)
- [x] Landlord Onboarding
- [x] AI-Powered Match Scoring Algorithm
- [x] Tinder-style Swipe UI (Full-screen immersive cards)
- [x] Property Detail Screen with Photo Carousel
- [x] Property Search & Filtering
- [x] Like/Pass/Super-like Actions
- [x] Mutual Match Detection & Celebration Modal
- [x] Animated Bottom Bar with Badge Notifications

### Stage 2-3: Match → Viewing
- [x] Real-time Chat (WebSocket-based)
- [x] Quick Reply Templates
- [x] Chat Anti-Bypass Detection (Phone, Email, Social Media, URLs)
- [x] Viewing Scheduling System
- [x] Chat List Screen with Unread Indicators

### Landlord Features
- [x] Landlord Dashboard
- [x] Property Management (Add/Edit/Delete)
- [x] Multi-step Property Addition Flow
- [x] Landlord Tenant Discovery (Explore Screen)
- [x] Landlord Swipe on Tenants

### Infrastructure
- [x] PostgreSQL Database with Full Schema
- [x] WebSocket Server for Real-time Features
- [x] Analytics Event Tracking
- [x] Subscription Tiers (Basic/Pro structure)

---

## 🔴 PRIORITY 1: Revenue-Critical Features (Next 4-6 Weeks)

### 1.1 Viewing Commitment Deposit (₹1,000)
**User Journey**: Stage 3.1 - Viewing Scheduling

| Aspect | Details |
|--------|---------|
| **What** | Refundable deposit required before scheduling viewing |
| **Why** | Prevents no-shows, filters serious tenants, first revenue touchpoint |
| **Revenue** | ₹1,000 × 1.5% gateway fee + ~5% forfeit rate |
| **Complexity** | Medium |
| **Dependencies** | Payment gateway (Razorpay) |

**Implementation Tasks**:
- [ ] Integrate Razorpay payment gateway
- [ ] Create deposit payment UI flow
- [ ] Add refund policy screen
- [ ] Build deposit tracking in database (`viewing_deposits` table)
- [ ] Implement auto-refund on deal closure
- [ ] Add forfeit logic for no-shows

---

### 1.2 Token Payment System (₹5,000)
**User Journey**: Stage 3.3 - Post-Viewing Lock-In

| Aspect | Details |
|--------|---------|
| **What** | Escrow token to reserve property after viewing |
| **Why** | Locks both parties into platform, prevents bypass |
| **Revenue** | Escrow fee 1.5% + forfeit revenue |
| **Complexity** | High |
| **Dependencies** | Razorpay escrow, legal compliance |

**Implementation Tasks**:
- [ ] Create token payment flow UI
- [ ] Build escrow account management
- [ ] Implement 48-hour exclusivity timer
- [ ] Add token-to-deposit conversion
- [ ] Build refund request workflow
- [ ] Create landlord notification system

---

### 1.3 Security Deposit Escrow (₹50,000+)
**User Journey**: Stage 4.1 - Final Payment

| Aspect | Details |
|--------|---------|
| **What** | Full security deposit held in platform escrow |
| **Why** | Core value prop - deposit protection |
| **Revenue** | 1.5% escrow fee + interest on float |
| **Complexity** | High |
| **Dependencies** | RBI compliance, escrow partner |

**Implementation Tasks**:
- [ ] Partner with escrow service provider
- [ ] Build deposit payment UI (UPI/NEFT/Card)
- [ ] Create escrow dashboard for users
- [ ] Implement deposit release workflow
- [ ] Build dispute resolution interface
- [ ] Add interest calculation (split with user)

---

### 1.4 Premium Subscription Tiers
**User Journey**: Throughout

| Tier | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 10 swipes/week, basic chat |
| **Tenant Plus** | ₹49/month | Unlimited swipes, priority matching, VR tours |
| **Landlord Pro** | ₹299/month | Featured listings, tenant insights, priority support |

**Implementation Tasks**:
- [ ] Build subscription purchase flow
- [ ] Implement swipe limit logic
- [ ] Create premium badge UI
- [ ] Add feature gating middleware
- [ ] Build subscription management screen

---

## 🟡 PRIORITY 2: Trust & Verification (Weeks 6-10)

### 2.1 KYC Verification (Aadhaar/PAN)
**User Journey**: Stage 3 - Before Agreement

| Aspect | Details |
|--------|---------|
| **What** | Government ID verification for both parties |
| **Why** | Trust, legal compliance, fraud prevention |
| **Complexity** | High |
| **Dependencies** | DigiLocker API, Aadhaar eSign |

**Implementation Tasks**:
- [ ] Integrate DigiLocker API
- [ ] Build KYC upload flow
- [ ] Implement verification status UI
- [ ] Add verified badges to profiles
- [ ] Create KYC reminder notifications

---

### 2.2 Digital Rental Agreement
**User Journey**: Stage 3.4 - Agreement Signing

| Aspect | Details |
|--------|---------|
| **What** | Auto-generated RERA-compliant agreement with e-sign |
| **Why** | Legal protection, seamless process |
| **Revenue** | Stamp duty pass-through, premium legal review |
| **Complexity** | High |

**Implementation Tasks**:
- [ ] Create agreement template engine
- [ ] Build clause customization UI
- [ ] Integrate Aadhaar eSign
- [ ] Implement stamp duty calculator
- [ ] Add RERA filing automation
- [ ] Build agreement PDF viewer

---

### 2.3 Landlord Verification System
**User Journey**: Property Listing

| Aspect | Details |
|--------|---------|
| **What** | Property ownership verification |
| **Why** | Prevent fake listings |
| **Complexity** | Medium |

**Implementation Tasks**:
- [ ] Build property document upload
- [ ] Create manual verification queue
- [ ] Add verified property badge
- [ ] Implement verification status tracking

---

## 🟢 PRIORITY 3: Post-Move-In Features (Weeks 10-16)

### 3.1 Move-In Inspection System
**User Journey**: Stage 4.2 - Move-In Day

| Aspect | Details |
|--------|---------|
| **What** | AI-guided photo documentation |
| **Why** | Prevents deposit disputes |
| **Complexity** | Medium |

**Implementation Tasks**:
- [ ] Build inspection checklist UI
- [ ] Create room-by-room photo capture flow
- [ ] Implement AI damage detection (optional)
- [ ] Add meter reading capture
- [ ] Generate move-in report PDF
- [ ] Create dual e-signature flow

---

### 3.2 Automated Rent Collection
**User Journey**: Stage 5 - Monthly Rent

| Aspect | Details |
|--------|---------|
| **What** | Auto-debit rent on due date |
| **Why** | Convenience, platform stickiness |
| **Revenue** | 1% cashback (split), late fee share |
| **Complexity** | High |

**Implementation Tasks**:
- [ ] Build mandate setup UI (NACH/UPI Autopay)
- [ ] Create rent schedule management
- [ ] Implement payment reminder notifications
- [ ] Build rent receipt auto-generation
- [ ] Add late payment penalty logic
- [ ] Create landlord payout system

---

### 3.3 Maintenance Request Portal
**User Journey**: Stage 5 - During Tenancy

| Aspect | Details |
|--------|---------|
| **What** | In-app maintenance ticketing |
| **Why** | Ongoing engagement, value-add |
| **Complexity** | Medium |

**Implementation Tasks**:
- [ ] Create maintenance request form
- [ ] Build ticket tracking UI
- [ ] Implement landlord notification
- [ ] Add service provider marketplace
- [ ] Create resolution workflow

---

### 3.4 Rent Receipt & Tax Documents
**User Journey**: Stage 5 - Monthly

| Aspect | Details |
|--------|---------|
| **What** | Auto-generated rent receipts for HRA claims |
| **Why** | High-value tenant feature |
| **Complexity** | Low |

**Implementation Tasks**:
- [ ] Build receipt template
- [ ] Create annual statement generator
- [ ] Add download/share functionality

---

## 🔵 PRIORITY 4: Growth & Engagement (Weeks 16+)

### 4.1 VR 360° Property Tours
| Aspect | Details |
|--------|---------|
| **What** | Immersive virtual property viewing |
| **Why** | Key differentiator, reduces physical viewings |
| **Complexity** | High |
| **Dependencies** | 360 camera hardware, CDN for videos |

**Implementation Tasks**:
- [ ] Integrate 360° viewer component
- [ ] Build VR upload flow for landlords
- [ ] Create VR tour viewing experience
- [ ] Add hotspot navigation

---

### 4.2 Referral Program
| Aspect | Details |
|--------|---------|
| **What** | ₹500 credit for referrer + referee |
| **Why** | Low CAC growth |
| **Complexity** | Medium |

**Implementation Tasks**:
- [ ] Build referral code system
- [ ] Create sharing UI
- [ ] Implement credit tracking
- [ ] Add referral leaderboard

---

### 4.3 Push Notifications
| Status | Partially implemented (infrastructure ready) |
|--------|---------------------------------------------|
| **What** | Viewing reminders, match alerts, rent due |
| **Complexity** | Low |

**Implementation Tasks**:
- [ ] Set up Expo Push Notifications
- [ ] Create notification preferences screen
- [ ] Implement notification categories
- [ ] Add deep linking from notifications

---

### 4.4 Google Maps Integration
| Status | Backend ready, needs API key |
|--------|------------------------------|
| **What** | Commute time calculator, area exploration |
| **Complexity** | Low |

**Implementation Tasks**:
- [ ] Add Google Maps API key
- [ ] Enable commute time display
- [ ] Add neighborhood view
- [ ] Implement nearby places

---

### 4.5 Community Features
| Aspect | Details |
|--------|---------|
| **What** | Neighbor connections, local recommendations |
| **Why** | Engagement, network effects |
| **Complexity** | Medium |

**Implementation Tasks**:
- [ ] Build community feed
- [ ] Create neighbor discovery
- [ ] Add local tips/reviews
- [ ] Implement direct messaging

---

## 📈 Revenue Projection by Feature

| Feature | Launch | Year 1 GMV | Platform Take |
|---------|--------|------------|---------------|
| Viewing Deposit | Month 2 | ₹5 Cr | ₹25 L (fees + forfeit) |
| Token Payment | Month 3 | ₹25 Cr | ₹75 L |
| Security Deposit Escrow | Month 4 | ₹250 Cr | ₹5 Cr |
| Premium Subscriptions | Month 2 | - | ₹1 Cr |
| Rent Automation | Month 6 | ₹100 Cr | ₹1 Cr |
| **Total Year 1** | - | **₹380 Cr GMV** | **₹8 Cr Revenue** |

---

## 🗄️ Database Tables Needed

```sql
-- Payment & Escrow
CREATE TABLE viewing_deposits (...)
CREATE TABLE token_payments (...)
CREATE TABLE escrow_accounts (...)
CREATE TABLE rent_payments (...)
CREATE TABLE payouts (...)

-- Agreements
CREATE TABLE rental_agreements (...)
CREATE TABLE agreement_clauses (...)
CREATE TABLE signatures (...)

-- KYC
CREATE TABLE kyc_verifications (...)
CREATE TABLE documents (...)

-- Post Move-In
CREATE TABLE inspections (...)
CREATE TABLE inspection_photos (...)
CREATE TABLE maintenance_requests (...)
CREATE TABLE rent_receipts (...)

-- Growth
CREATE TABLE referrals (...)
CREATE TABLE notifications (...)
```

---

## 🚀 Sprint Plan

### Sprint 1-2 (Weeks 1-4): Payment Foundation
- Razorpay integration
- Viewing deposit flow
- Basic subscription gating

### Sprint 3-4 (Weeks 5-8): Lock-In System
- Token payment
- Escrow foundation
- Agreement template v1

### Sprint 5-6 (Weeks 9-12): Trust & Verification
- KYC integration
- Landlord verification
- E-signature

### Sprint 7-8 (Weeks 13-16): Post Move-In
- Move-in inspection
- Rent automation
- Maintenance portal

### Sprint 9-10 (Weeks 17-20): Growth
- VR tours
- Referral program
- Push notifications

---

*Last Updated: January 24, 2026*
