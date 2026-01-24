# Feature-Based Architecture

## Status: ✅ IMPLEMENTED

This document describes the feature-based architecture of the Homie codebase, organized by **user journey** rather than technical layers. This makes it easier to:

- Understand which files relate to each user journey
- Onboard new team members quickly
- Debug issues in specific user flows
- Add new features to existing journeys
- Maintain separation of concerns

---

## Current Structure (Technical Layers)

```
packages/
├── api/src/
│   ├── controllers/     # All controllers mixed together
│   ├── services/        # All services mixed together
│   ├── routes/          # All routes mixed together
│   ├── middleware/      # All middleware
│   └── types/           # All types
│
└── mobile/src/
    ├── screens/
    │   ├── auth/        # Auth screens
    │   ├── tenant/      # Tenant screens
    │   ├── landlord/    # Landlord screens
    │   └── shared/      # Shared screens
    ├── components/
    ├── contexts/
    ├── hooks/
    └── services/
```

**Problems:**
- Hard to find all files related to a user journey
- Changes to one journey may accidentally affect others
- New team members struggle to understand the flow
- No clear ownership of features

---

## Proposed Structure (Feature/Journey-Based)

### API Package

```
packages/api/src/
├── core/                           # Shared infrastructure
│   ├── database/
│   │   ├── client.ts
│   │   ├── migrate.ts
│   │   └── migrations/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   └── subscription.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── index.ts
│
├── features/                       # Feature modules by user journey
│   │
│   ├── auth/                       # 🔐 Authentication Journey
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.types.ts
│   │   ├── sms.service.ts
│   │   ├── token.service.ts
│   │   ├── __tests__/
│   │   │   ├── auth.controller.test.ts
│   │   │   ├── auth.service.test.ts
│   │   │   └── auth.routes.test.ts
│   │   └── README.md               # Journey documentation
│   │
│   ├── onboarding/                 # 📝 Onboarding Journey
│   │   ├── onboarding.controller.ts
│   │   ├── onboarding.service.ts
│   │   ├── onboarding.routes.ts
│   │   ├── onboarding.types.ts
│   │   ├── landlord-verification.service.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── discovery/                  # 🔍 Discovery & Swiping Journey
│   │   ├── discovery.controller.ts
│   │   ├── discovery.service.ts
│   │   ├── discovery.routes.ts
│   │   ├── discovery.types.ts
│   │   ├── maps.service.ts
│   │   ├── lifestyle-matching.service.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── matching/                   # 💕 Matching Journey
│   │   ├── matching.controller.ts
│   │   ├── matching.service.ts
│   │   ├── matching.routes.ts
│   │   ├── matching.types.ts
│   │   ├── landlord-swipe.service.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── chat/                       # 💬 Chat & Messaging Journey
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat.routes.ts
│   │   ├── chat.types.ts
│   │   ├── chat-antibypass.service.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── viewings/                   # 📅 Property Viewing Journey
│   │   ├── viewing.controller.ts
│   │   ├── viewing.service.ts
│   │   ├── viewing.routes.ts
│   │   ├── viewing.types.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── properties/                 # 🏠 Property Management Journey
│   │   ├── property.controller.ts
│   │   ├── property.service.ts
│   │   ├── property.routes.ts
│   │   ├── property.types.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   └── subscription/               # 💳 Subscription Journey
│       ├── subscription.controller.ts
│       ├── subscription.service.ts
│       ├── subscription.routes.ts
│       ├── subscription.types.ts
│       ├── __tests__/
│       └── README.md
│
└── index.ts                        # App entry point
```

### Mobile Package

```
packages/mobile/src/
├── core/                           # Shared infrastructure
│   ├── components/                 # Reusable UI components
│   │   ├── buttons/
│   │   ├── cards/
│   │   ├── inputs/
│   │   ├── modals/
│   │   └── index.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useApi.ts
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   ├── services/
│   │   └── api.service.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── index.ts
│
├── features/                       # Feature modules by user journey
│   │
│   ├── auth/                       # 🔐 Authentication Journey
│   │   ├── screens/
│   │   │   ├── PhoneInputScreen.tsx
│   │   │   ├── OTPVerificationScreen.tsx
│   │   │   └── UserTypeSelectionScreen.tsx
│   │   ├── components/
│   │   │   ├── PhoneInput.tsx
│   │   │   └── OTPInput.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── onboarding/                 # 📝 Onboarding Journey
│   │   ├── screens/
│   │   │   ├── tenant/
│   │   │   │   ├── TenantOnboardingScreen.tsx
│   │   │   │   └── PreferencesScreen.tsx
│   │   │   └── landlord/
│   │   │       ├── LandlordOnboardingScreen.tsx
│   │   │       └── VerificationScreen.tsx
│   │   ├── components/
│   │   │   ├── PreferenceSelector.tsx
│   │   │   └── VerificationUploader.tsx
│   │   ├── hooks/
│   │   │   └── useOnboarding.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── discovery/                  # 🔍 Discovery & Swiping Journey
│   │   ├── screens/
│   │   │   ├── tenant/
│   │   │   │   ├── SwipeScreen.tsx
│   │   │   │   └── PropertyDetailScreen.tsx
│   │   │   └── landlord/
│   │   │       └── LandlordExploreScreen.tsx
│   │   ├── components/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── TenantSwipeCard.tsx
│   │   │   └── SwipeActions.tsx
│   │   ├── hooks/
│   │   │   └── useDiscovery.ts
│   │   ├── services/
│   │   │   └── discovery.service.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── matching/                   # 💕 Matching Journey
│   │   ├── screens/
│   │   │   ├── MatchesScreen.tsx
│   │   │   └── LandlordMatchesScreen.tsx
│   │   ├── components/
│   │   │   ├── MatchCard.tsx
│   │   │   └── MatchAnimation.tsx
│   │   ├── hooks/
│   │   │   └── useMatching.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── chat/                       # 💬 Chat & Messaging Journey
│   │   ├── screens/
│   │   │   ├── ChatListScreen.tsx
│   │   │   └── ChatScreen.tsx
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── QuickReplies.tsx
│   │   ├── contexts/
│   │   │   └── ChatContext.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   ├── services/
│   │   │   └── chat.service.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── viewings/                   # 📅 Property Viewing Journey
│   │   ├── screens/
│   │   │   ├── ViewingsScreen.tsx
│   │   │   └── ScheduleViewingScreen.tsx
│   │   ├── components/
│   │   │   ├── ViewingCard.tsx
│   │   │   └── ViewingCalendar.tsx
│   │   ├── hooks/
│   │   │   └── useViewings.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── properties/                 # 🏠 Property Management Journey (Landlord)
│   │   ├── screens/
│   │   │   ├── AddPropertyScreen.tsx
│   │   │   ├── AddPropertyStep1Screen.tsx
│   │   │   ├── AddPropertyStep2Screen.tsx
│   │   │   ├── AddPropertyStep3Screen.tsx
│   │   │   ├── AddPropertyStep4Screen.tsx
│   │   │   ├── MyPropertiesScreen.tsx
│   │   │   └── DashboardScreen.tsx
│   │   ├── components/
│   │   │   ├── PropertyForm.tsx
│   │   │   └── PropertyStats.tsx
│   │   ├── hooks/
│   │   │   └── useProperties.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   ├── profile/                    # 👤 Profile Management Journey
│   │   ├── screens/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── EditProfileScreen.tsx
│   │   ├── components/
│   │   │   └── ProfileCard.tsx
│   │   ├── hooks/
│   │   │   └── useProfile.ts
│   │   ├── __tests__/
│   │   └── README.md
│   │
│   └── subscription/               # 💳 Subscription Journey
│       ├── screens/
│       │   └── SubscriptionScreen.tsx
│       ├── components/
│       │   └── PlanCard.tsx
│       ├── hooks/
│       │   └── useSubscription.ts
│       ├── __tests__/
│       └── README.md
│
├── assets/
└── App.tsx
```

---

## User Journey to Feature Mapping

| User Journey Step | Feature Module | Key Files |
|-------------------|----------------|-----------|
| Phone number input | `auth` | PhoneInputScreen, auth.service |
| OTP verification | `auth` | OTPVerificationScreen, sms.service |
| User type selection | `auth` | UserTypeSelectionScreen |
| Tenant onboarding | `onboarding` | TenantOnboardingScreen |
| Landlord onboarding | `onboarding` | LandlordOnboardingScreen |
| Set preferences | `onboarding` | PreferencesScreen |
| Browse properties | `discovery` | SwipeScreen, discovery.service |
| View property details | `discovery` | PropertyDetailScreen |
| Landlord browse tenants | `discovery` | LandlordExploreScreen |
| Match created | `matching` | matching.service, MatchAnimation |
| View matches | `matching` | MatchesScreen |
| Chat with match | `chat` | ChatScreen, ChatContext |
| Quick replies | `chat` | QuickReplies, chat.service |
| Schedule viewing | `viewings` | ScheduleViewingScreen |
| Manage viewings | `viewings` | ViewingsScreen |
| Add property | `properties` | AddPropertyScreen |
| Landlord dashboard | `properties` | DashboardScreen |
| View profile | `profile` | ProfileScreen |
| Upgrade to premium | `subscription` | SubscriptionScreen |

---

## Feature Module Structure

Each feature module follows this standard structure:

```
feature-name/
├── screens/           # Screen components
├── components/        # Feature-specific components
├── hooks/             # Feature-specific hooks
├── services/          # API calls and business logic
├── contexts/          # Feature-specific contexts (if needed)
├── types/             # Feature-specific types
├── utils/             # Feature-specific utilities
├── __tests__/         # Tests for this feature
└── README.md          # Feature documentation
```

### README.md Template

Each feature should have a README documenting:

```markdown
# Feature Name

## Overview
Brief description of the user journey this feature supports.

## User Journey Steps
1. Step 1 description
2. Step 2 description
...

## Screens
- `ScreenName.tsx` - Description

## Key Components
- `ComponentName.tsx` - Description

## API Endpoints
- `POST /api/endpoint` - Description

## State Management
Description of contexts/hooks used

## Testing
How to run tests for this feature

## Known Issues / TODOs
- [ ] Issue 1
- [ ] Issue 2
```

---

## Migration Strategy

### Phase 1: Create Structure (Non-Breaking)
1. Create new folder structure
2. Keep old files in place
3. Add re-exports from old locations

### Phase 2: Move API Code
1. Move files one feature at a time
2. Update imports
3. Run tests after each move

### Phase 3: Move Mobile Code
1. Move files one feature at a time
2. Update navigation imports
3. Run app after each move

### Phase 4: Cleanup
1. Remove old folders
2. Update documentation
3. Update CI/CD paths

---

## Benefits

### For Developers
- **Find code faster**: All chat-related code is in `/features/chat`
- **Understand flows**: Each feature has its own README
- **Safer changes**: Changes are isolated to feature modules

### For Team Leads
- **Clear ownership**: Assign features to team members
- **Better code reviews**: Smaller, focused PRs
- **Easier estimation**: Feature scope is clear

### For New Team Members
- **Quick onboarding**: Read feature READMEs
- **Clear boundaries**: Know where to add code
- **Self-documenting**: Folder structure tells the story

---

## Implementation Effort

| Task | Estimated Time |
|------|----------------|
| Create folder structure | 1 hour |
| Move API auth feature | 2 hours |
| Move API other features | 6 hours |
| Move Mobile features | 8 hours |
| Update imports & navigation | 4 hours |
| Update tests | 4 hours |
| Documentation | 3 hours |
| **Total** | **~28 hours** |

---

## Next Steps

1. Review and approve this proposal
2. Create a feature branch for migration
3. Start with one feature (recommend: `auth`) as a pilot
4. Iterate and refine the pattern
5. Complete migration for all features

---

## Questions?

Discuss in team channel or create an issue.
