# Homie - Angel Investor Pitch Script

> **Purpose**: Screen recording walkthrough script for first angel investor meeting
> **Duration**: 12-15 minutes
> **Format**: App demo + market context + vision

---

## 🎬 PRE-RECORDING CHECKLIST

### Test Accounts Ready
```
Tenant Demo: 9876540001 (OTP: 123456)
Landlord Demo: 9123450001 (OTP: 123456)
New User Flow: 9999999999 (OTP: 123456)
```

### Screens to Show
- [ ] Login/OTP flow
- [ ] Tenant onboarding
- [ ] Swipe screen with matches
- [ ] Match celebration modal
- [ ] Chat with anti-bypass
- [ ] Viewing scheduling
- [ ] Property detail
- [ ] Landlord dashboard
- [ ] Property management

---

## 📜 SCRIPT

### INTRO (60 seconds)

```
[Screen: Homie app logo/splash]

"Hi, I'm [Your Name], founder of Homie.

Let me tell you about my last rental search. I went on NoBroker, 
saw 500 listings for Koramangala. Sounds great, right?

Then I spent the next 2 weeks making 40+ phone calls asking the 
SAME questions: 'Is parking included?' 'Which floor?' 'Is it 
still available?' 'Can bachelors apply?'

Landlords were equally frustrated - one told me he gets 50 calls 
a DAY asking 'what's the rent?' when it's RIGHT THERE in the listing.

This is the problem with NoBroker and every rental platform:
More listings ≠ better experience. 
It just means more noise, more calls, more wasted time.

Homie takes the opposite approach. We go HYPER-LOCAL.

Instead of 50,000 listings across Bengaluru with garbage data, 
we have 100 VERIFIED properties in Koramangala with COMPLETE 
information. Every photo, every amenity, every house rule - upfront.

No calls needed. No information hunting. 
You swipe, you match, you chat about the DEAL - not the basics.

Let me show you what we've built."
```

---

### SECTION 1: THE PRODUCT - TENANT EXPERIENCE (4 minutes)

```
[Action: Open app, show login screen]

"Let's start with the tenant experience. I'll login as a tenant who's 
looking for a flat in Bengaluru."

[Action: Enter phone 9876540001, enter OTP 123456]

"We use phone-based authentication - simple, universal, works for all 
of India. No email required, no passwords to remember."
```

#### Swipe Experience

```
[Action: Show swipe screen with property cards]

"This is our core discovery experience - think Tinder, but for homes.

See this number here - 87% match? That's our AI compatibility score. 
Unlike NoBroker or Housing.com where you get 1,000 random listings, 
we show you the 20 properties that actually match YOUR needs.

How do we calculate this? When tenants onboard, we ask about:
- Their work location and maximum commute time
- Budget and flexibility
- Lifestyle - vegetarian, pets, smoking preferences
- Move-in timeline

Then we match this against landlord preferences and property features.

[Action: Swipe right on a property]

When I swipe right on a property I like...

[Action: Show match celebration modal with confetti]

BOOM! We matched! See this celebration? Both the tenant AND the landlord 
have expressed interest. This is a double-opt-in system.

Notice the bottom bar - see how the matches icon just popped up and 
shows a badge? That's real-time feedback. The same happens when you 
get messages."
```

#### Chat & Anti-Bypass

```
[Action: Go to Chat tab, open a conversation]

"Now here's where it gets interesting. This is our chat interface.

The biggest problem rental platforms face is BYPASS. Users match, 
exchange phone numbers, and complete the deal offline. Platform 
gets nothing.

[Action: Type a message like "my number is 9876543210"]

Watch what happens when I try to share my phone number...

[Show blocked message or warning]

We've built sophisticated anti-bypass detection. It catches:
- Phone numbers in any format
- Email addresses
- Social media handles (@instagram, WhatsApp mentions)
- URLs
- Even creative spellings like 'nine eight seven six...'

This isn't just pattern matching - we detect context. Legitimate 
property discussions go through, only contact exchange attempts 
are flagged.

Why does this matter for investors? This is how we protect our 
revenue model. Every deal that happens on-platform is monetizable."
```

#### Viewing Scheduling

```
[Action: Show viewing scheduling in chat]

"Once both parties are interested, they can schedule viewings 
directly in the chat.

[Action: Show viewing scheduler]

Select date, time - the landlord gets notified, confirms, and 
both parties have a calendar event.

This seems simple, but it's the critical handoff point. Today, 
tenants schedule viewings, don't show up, landlords waste time. 
Our planned viewing deposit feature will change this - but 
I'll cover that in our roadmap."
```

---

### SECTION 2: LANDLORD EXPERIENCE (2 minutes)

```
[Action: Logout and login as 9123450001]

"Now let me show you the landlord side. I'll login as a property owner."

[Action: Show landlord dashboard]

"This is the landlord dashboard. Unlike other platforms where 
landlords are bombarded with 50 inquiries from unqualified tenants, 
we show them pre-screened, compatible matches.

[Action: Go to My Properties]

Here are my listed properties. Each shows:
- View count
- Match count  
- Current status

[Action: Show property detail with matches]

For each property, I can see which tenants have shown interest, 
their compatibility score, and their profile - work schedule, 
lifestyle, verification status.

[Action: Show Explore tab - landlord swiping on tenants]

Here's something unique - landlords can also DISCOVER tenants. 
If I have a property and I see a tenant profile that's a perfect 
fit, I can reach out proactively. It's a true two-sided marketplace."
```

---

### SECTION 3: THE BUSINESS MODEL (3 minutes)

```
[Screen: Can show a slide or just speak to camera]

"Now let's talk about how we make money. This is where Homie's 
model is fundamentally different from existing players.

CURRENT MARKET:
- NoBroker charges ₹999-4,999 for 'premium' listings
- Housing.com sells leads to brokers
- 99acres is pure advertising

The problem? Tenants and landlords pay upfront, then go offline. 
Platforms have no stake in successful transactions.

HOMIE'S MODEL - TRANSACTION-LINKED REVENUE:

We don't charge for matching. We charge when VALUE is delivered.

REVENUE STREAM 1: VIEWING COMMITMENT DEPOSIT
- Tenant pays ₹1,000 refundable deposit to schedule viewing
- This filters serious tenants (no more no-shows)
- We earn: Gateway fee + forfeit revenue on no-shows
- This is LIVE in our roadmap for Month 2

REVENUE STREAM 2: TOKEN PAYMENT
- After viewing, tenant pays ₹5,000 to 'lock' the property
- Property removed from marketplace for 48 hours
- This creates urgency AND prevents bypass
- We earn: Escrow fee + forfeit revenue

REVENUE STREAM 3: SECURITY DEPOSIT ESCROW
- This is the BIG one
- Average security deposit: ₹50,000-2,00,000
- We hold this in escrow throughout the lease
- We earn: 1.5% escrow fee + interest on float

REVENUE STREAM 4: RENT AUTOMATION
- Tenants set up auto-debit for monthly rent
- We process ₹25,000-50,000 every month
- We earn: 1% cashback split + late fee share

REVENUE STREAM 5: PREMIUM SUBSCRIPTIONS
- Tenant Plus: ₹49/month for unlimited swipes
- Landlord Pro: ₹299/month for featured listings

LET ME PUT NUMBERS TO THIS:

Year 1 target: 10,000 successful matches
Average security deposit: ₹75,000
Average monthly rent: ₹25,000

REVENUE CALCULATION:
- Viewing deposits: 50,000 viewings × ₹1,000 × 5% forfeit = ₹25 lakh
- Token payments: 15,000 tokens × ₹5,000 × 2% fee = ₹15 lakh  
- Escrow deposits: ₹75 Cr GMV × 1.5% = ₹1.1 Cr
- Escrow float interest: ₹75 Cr × 6% × 50% = ₹2.25 Cr
- Rent automation: ₹100 Cr annual × 1% = ₹1 Cr
- Subscriptions: 5,000 premium users × ₹500 avg = ₹25 lakh

TOTAL YEAR 1 REVENUE: ₹5-6 Crore
At 10,000 transactions with ₹6 Cr revenue = ₹6,000 revenue per transaction

Compare this to NoBroker's ₹1,500 average revenue per user. 
We're 4x more monetizable because we're transaction-linked, 
not subscription-based."
```

---

### SECTION 4: MARKET & COMPETITION (2 minutes)

```
"Let me address the elephant in the room - NoBroker.

NoBroker raised $210 million and is valued at $700 million. 
They've proven the market exists. But they have THREE fundamental problems.

NOBROKER PROBLEM #1 - THE CALL CHAOS:
- 50,000 listings with incomplete information
- Tenants make 30-40 calls just to gather basic info
- Landlords get spammed with 'what's the rent?' calls
- Both sides frustrated before they even meet

NOBROKER PROBLEM #2 - SPRAY AND PRAY:
- They spread thin across entire cities
- 50 properties in each of 100 neighborhoods
- No critical mass anywhere
- A tenant in Koramangala sees listings from Whitefield

NOBROKER PROBLEM #3 - REVENUE LEAKAGE:
- They charge upfront (₹999-4,999 subscription)
- Users pay, then complete deals offline
- No visibility into actual transactions
- Their take rate is <1% of transaction value

HOMIE'S APPROACH - THE OPPOSITE:

1. INFORMATION FIRST:
   - Every listing has 15+ photos, video tour, all amenities
   - House rules, parking, floor, everything documented
   - Zero calls needed for basic information

2. HYPER-LOCAL DOMINANCE:
   - 100 verified properties in ONE micro-market
   - Koramangala first, then Indiranagar, then HSR
   - We own 80% of rentals in each neighborhood before expanding

3. TRANSACTION-LINKED REVENUE:
   - We charge at transaction milestones
   - Escrow gives us 100% visibility
   - Our take rate is 3-4% of transaction value
   - We have ongoing rent relationship (not one-time)

MARKET SIZE:
- 12 million urban rental transactions/year
- Average rent: ₹25,000/month  
- Average deposit: ₹75,000
- Total addressable market: ₹1,80,000 Cr annually
- Even 0.1% market share = ₹180 Cr GMV

WHY HYPER-LOCAL WINS:
- Koramangala alone: 5,000 rental transactions/year
- If we own 50% of Koramangala = 2,500 deals × ₹8,500 = ₹2.1 Cr revenue
- From ONE neighborhood!
- Bengaluru has 50+ such micro-markets
- We don't need to boil the ocean

WHY NOW:
1. UPI has made micro-payments frictionless
2. Aadhaar eSign enables digital agreements
3. Post-COVID, renters expect digital-first experiences
4. Trust in digital escrow is at all-time high (Razorpay, Paytm)
5. NoBroker has EDUCATED the market - but FRUSTRATED users
6. People are ready for a BETTER alternative, not just cheaper"
```

---

### SECTION 5: CURRENT STATUS & TRACTION (1 minute)

```
"Here's where we are today:

BUILT (MVP COMPLETE):
✅ Full tenant onboarding with AI matching
✅ Tinder-style property discovery
✅ Real-time chat with anti-bypass protection
✅ Viewing scheduling system
✅ Landlord dashboard and property management
✅ Landlord tenant discovery
✅ Animated match celebrations and notifications

TECHNOLOGY:
- React Native mobile app (iOS + Android from single codebase)
- Node.js backend with PostgreSQL
- WebSocket for real-time features
- AI matching algorithm
- Sophisticated anti-bypass detection system

WHAT'S NEXT (With This Funding):
Month 1-2: Payment gateway integration (Razorpay)
Month 2-3: Viewing deposit + token payment system
Month 3-4: Security deposit escrow
Month 4-5: Digital agreement with eSign
Month 5-6: Rent automation

We're looking for ₹50 lakh to:
1. Complete payment infrastructure
2. Hire 2 engineers
3. Launch in Bengaluru with 100 properties
4. Prove unit economics over 3 months"
```

---

### SECTION 6: THE ASK & CLOSE (1 minute)

```
"So here's the opportunity:

We're raising ₹50 lakh at a ₹4 Cr valuation.

USE OF FUNDS:
- 50% Engineering (2 full-stack developers for 6 months)
- 25% Initial supply acquisition (landlord onboarding)
- 15% Marketing (target 1,000 tenant signups)
- 10% Legal & compliance (escrow licensing)

MILESTONES FOR NEXT ROUND:
- 100 successful transactions
- ₹50 lakh GMV through escrow
- Prove 3-4% take rate
- Retention: 80% landlords list second property

THE VISION:
Homie becomes the Stripe of Indian rentals. 
Every rental transaction - from discovery to monthly rent - 
flows through our platform. 

12 million transactions × ₹6,000 revenue per transaction = 
₹7,200 Crore revenue opportunity.

We're starting with Bengaluru, then Hyderabad, Pune, Mumbai.
The playbook scales city by city.

I'd love to have you join us on this journey.

[Contact information]

Thank you for your time."
```

---

## 📊 SUPPORTING SLIDES (If Needed)

### Slide 1: The Problem
```
┌─────────────────────────────────────────┐
│           RENTING IS BROKEN             │
├─────────────────────────────────────────┤
│  ₹50,000     Broker commission          │
│  15-20       Properties visited         │
│  3-4 weeks   Time to find home          │
│  ₹2,00,000   Deposit at risk            │
│  0%          Digital agreements         │
└─────────────────────────────────────────┘
```

### Slide 2: Our Solution
```
┌─────────────────────────────────────────┐
│           HOMIE FIXES THIS              │
├─────────────────────────────────────────┤
│  ₹0          Broker commission          │
│  3-5         AI-matched properties      │
│  3-7 days    Average time to match      │
│  100%        Deposit protected          │
│  100%        Digital, RERA-compliant    │
└─────────────────────────────────────────┘
```

### Slide 3: Revenue Model
```
┌─────────────────────────────────────────┐
│         TRANSACTION-LINKED REVENUE      │
├─────────────────────────────────────────┤
│  ₹1,000   Viewing deposit (refundable)  │
│  ₹5,000   Token payment (converts)      │
│  1.5%     Escrow fee on deposits        │
│  6%       Interest on float             │
│  1%       Rent automation fee           │
│  ───────────────────────────────────    │
│  3-4%     Effective take rate           │
└─────────────────────────────────────────┘
```

### Slide 4: Market Size
```
┌─────────────────────────────────────────┐
│              MARKET SIZE                │
├─────────────────────────────────────────┤
│  12M        Annual rental transactions  │
│  ₹4L Cr     Annual rent value           │
│  ₹1.8L Cr   Annual deposit value        │
│  ───────────────────────────────────    │
│  ₹180 Cr    0.1% = Our Y1 target GMV    │
└─────────────────────────────────────────┘
```

### Slide 5: Competitive Advantage
```
┌─────────────────────────────────────────┐
│      WHY WE WIN vs NOBROKER             │
├─────────────────────────────────────────┤
│  NoBroker    │  Homie                   │
│  ────────────┼─────────────────────     │
│  Subscription│  Transaction-linked      │
│  <1% take    │  3-4% take rate          │
│  One-time    │  Recurring (rent)        │
│  No escrow   │  Full escrow             │
│  High bypass │  Anti-bypass tech        │
└─────────────────────────────────────────┘
```

---

## 🎯 KEY TALKING POINTS TO REMEMBER

1. **Transaction-linked, not subscription** - We only make money when value is delivered

2. **Anti-bypass is our moat** - Technology prevents users from going offline

3. **Escrow is the key** - Once deposits are in escrow, users MUST use the platform

4. **Recurring revenue** - Monthly rent automation creates ongoing relationship

5. **4x NoBroker monetization** - ₹6,000 vs ₹1,500 per transaction

6. **MVP is complete** - We're not asking for money to build; we're asking to scale

7. **Clear milestones** - 100 transactions, ₹50L GMV, prove unit economics

---

## ⚠️ POTENTIAL INVESTOR QUESTIONS & ANSWERS

**Q: How do you prevent users from exchanging numbers verbally during viewing?**
> "Great question. The viewing deposit creates a financial commitment. If they complete offline, they forfeit ₹1,000. But more importantly, once we have deposits in escrow, users WANT to stay on platform for protection. The offline deal has no deposit protection, no legal agreement, no dispute resolution. We make the on-platform experience 10x better than offline."

**Q: NoBroker has massive supply. How do you compete?**
> "NoBroker's massive supply is actually their WEAKNESS, not strength. 50,000 listings means 50,000 sources of incomplete information and spam calls. A tenant in Koramangala doesn't care about 49,900 properties in other areas. They want the 100 BEST options in THEIR neighborhood with COMPLETE information. That's exactly what we provide. We don't compete on quantity - we compete on relevance and quality. When you search 'Koramangala 2BHK' on Homie, every single result is verified, available, and has all the info you need. No calls required. That's our moat."

**Q: What's your CAC?**
> "Target CAC is ₹500 per tenant through referrals. Our LTV at ₹6,000 revenue per transaction gives us 12:1 LTV:CAC. Even at ₹1,000 CAC through paid ads, we're at 6:1 which is healthy for a marketplace."

**Q: What if Razorpay or Paytm builds this?**
> "They might! But rental is a high-touch, relationship-heavy business. Payment companies are infrastructure. We're the application layer that understands tenant-landlord dynamics. Razorpay building Homie is like Stripe building Airbnb - possible but not their DNA."

**Q: Why hasn't someone done escrow before?**
> "Trust. Indians historically don't trust putting ₹2 lakh with a startup. But UPI and digital payments have normalized this. Razorpay processes ₹5 lakh crore annually. The infrastructure trust is there now. We're just applying it to rentals."

---

*Script Version: 1.0 | January 24, 2026*
