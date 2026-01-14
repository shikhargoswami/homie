# 🏠 Homie - VR & AI Rental Matching Platform

Tinder-style property matching with VR tours, powered by AI recommendations.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Setup](#detailed-setup)
5. [Project Structure](#project-structure)
6. [Running the Project](#running-the-project)
7. [Testing](#testing)
8. [Environment Variables](#environment-variables)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

---

## ✨ Features

### Tenant Features
- 📱 **Phone OTP Authentication** - Secure login with phone verification
- 🎯 **Smart Property Discovery** - Tinder-style swipe interface with auto-cycling photos
- 🔍 **Advanced Filtering** - Filter by budget, BHK, commute time, and lifestyle preferences
- 🤖 **AI-Powered Matching** - Intelligent match scoring based on preferences and lifestyle
- 📊 **Profile Management** - Edit profile details, occupation, and company information
- ⚙️ **Preference Settings** - Configure budget, location, amenities, and lifestyle tags
- 💬 **Real-time Chat** - WebSocket-based instant messaging with landlords
- 📅 **Viewing Scheduler** - Schedule and manage property viewings
- 🏆 **Mutual Matches** - View properties where both parties expressed interest

### Landlord Features
- 🏢 **Property Management** - Add, edit, and manage property listings
- 👥 **Tenant Discovery** - View interested tenants with match scores
- 💼 **Professional Dashboard** - Track listings, matches, and viewings
- 📊 **Analytics & Insights** - Monitor property performance

### Technical Highlights
- 🎨 **Modern UI/UX** - Clean, intuitive interface with smooth animations
- ⚡ **Real-time Updates** - WebSocket-powered live chat and notifications
- 🔒 **Secure Authentication** - JWT-based session management
- 📊 **Smart Scoring Algorithm** - Multi-factor matching system
- 🗄️ **PostgreSQL Database** - Robust data persistence
- 🚀 **Redis Caching** - Fast session and data caching

---

## 🎯 Prerequisites

### Required Software

| Software | Version | Download Link | Purpose |
|----------|---------|---------------|---------|
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com/) | Version control |
| **Node.js** | 22.x | [nodejs.org](https://nodejs.org/) | JavaScript runtime |
| **npm** | 10.x | Included with Node.js | Package manager |
| **PostgreSQL** | 15+ | [postgresql.org](https://www.postgresql.org/) | Database |
| **Redis** | 7+ | [redis.io](https://redis.io/) | Caching & sessions |
| **Xcode** (macOS only) | Latest | Mac App Store | iOS development |
| **Android Studio** | Latest | [developer.android.com](https://developer.android.com/studio) | Android development |

### Optional (Recommended)

- **VS Code** - [code.visualstudio.com](https://code.visualstudio.com/)
- **VS Code Extensions:**
  - ESLint
  - Prettier
  - TypeScript
  - React Native Tools
  - PostgreSQL

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd homie

# 2. Install all dependencies
npm install

# 3. Copy environment files
cp packages/api/.env.example packages/api/.env
cp packages/mobile/.env.example packages/mobile/.env

# 4. Start PostgreSQL and Redis (see Detailed Setup for installation)
# PostgreSQL should be running on localhost:5432
# Redis should be running on localhost:6379

# 5. Setup database
cd packages/api
npm run db:create
npm run db:migrate
npm run db:seed

# 6. Start development servers
cd ../..
npm run dev

# Backend API: http://localhost:3000
# Mobile app: exp://localhost:8081
```

---

## 🧪 Test Accounts & Development Data

After running `npm run db:seed`, you'll have access to pre-configured test accounts:

### Test Accounts

| Phone | Type | Profile | Description |
|-------|------|---------|-------------|
| `9999999999` | New User | Incomplete | Test full onboarding flow (tenant/landlord) |
| `9876540001` | Full Home Tenant | Complete | Test tenant with mutual matches and chats |
| `9876540006` | Room Sharing Tenant | Complete | Test flatmate search functionality |
| `9123450001` | Landlord | Complete | Test landlord with active properties |

**Development OTP:** Use `123456` for any phone number during development

### Seeded Data
- 👤 **10 Tenants** - 5 full-home seekers, 5 room-sharing seekers
- 🏠 **5 Landlords** - Each with 2-3 properties
- 🏢 **12+ Properties** - Variety of configurations and locations
- ✅ **2 Mutual Matches** - Pre-configured for test user (9876540001)
- 💬 **Sample Conversations** - Pre-populated chat history
- 📅 **Viewing Schedules** - Sample viewings in various states

### Testing Features
1. **Login**: Use `9876540001` + OTP `123456` to access a tenant with matches
2. **Swipe**: Browse pre-seeded properties with AI match scores
3. **Filter**: Test budget, BHK, commute, and lifestyle filters
4. **Chat**: Pre-configured conversations with landlords
5. **Schedule**: Book viewings with available properties
6. **Profile**: Edit profile and preferences settings

---

## 📁 Project Structure

```
homie/
├── packages/
│   ├── api/                    # Backend API (Node.js + Express)
│   │   ├── src/
│   │   │   ├── controllers/    # Route controllers
│   │   │   ├── database/       # Database schema & migrations
│   │   │   ├── middleware/     # Auth, logging, error handling
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   ├── types/          # TypeScript types
│   │   │   └── utils/          # Utilities
│   │   └── __tests__/          # API tests
│   │
│   ├── mobile/                 # React Native App (Expo)
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── navigation/     # Navigation setup
│   │   │   ├── screens/        # App screens
│   │   │   │   ├── auth/       # Authentication screens
│   │   │   │   ├── tenant/     # Tenant-specific screens
│   │   │   │   ├── landlord/   # Landlord-specific screens
│   │   │   │   └── shared/     # Shared screens
│   │   │   ├── services/       # API clients
│   │   │   └── types/          # TypeScript types
│   │   └── assets/             # Images, fonts, etc.
│   │
│   └── shared/                 # Shared code between API & Mobile
│       ├── constants/          # App constants
│       ├── types/              # Shared TypeScript types
│       └── validators/         # Input validation
│
├── docs/                       # Documentation
│   ├── MVP_STATUS.md          # Feature status tracking
│   ├── tech.md                # Technical architecture
│   └── USER_JOURNEY_DIAGRAMS.md
└── package.json               # Root package configuration
```

---

## 🚀 Running the Project

### Development Mode

Start all services simultaneously:
```bash
npm run dev
```

This will start:
- **Backend API** on `http://localhost:3000`
- **Mobile App** on `exp://localhost:8081` (Expo)

### Individual Services

**Backend API:**
```bash
cd packages/api
npm run dev
```

**Mobile App:**
```bash
cd packages/mobile
npm start
```

**Run on Device/Emulator:**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run API Tests Only
```bash
cd packages/api
npm test
```

### Run Specific Test Suite
```bash
cd packages/api
npm test -- auth.controller.test
```

### Test Coverage
```bash
npm run test:coverage
```

---

## 🔧 Key Technologies

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **TypeScript** - Type safety
- **JWT** - Authentication
- **WebSocket (Socket.io)** - Real-time chat
- **Jest** - Testing framework

### Mobile
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Query** - Data fetching and caching
- **Ionicons** - Icon library
- **AsyncStorage** - Local storage

### DevOps
- **Git** - Version control
- **npm** - Package management
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 🔐 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/homie_dev
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# API
PORT=3000
NODE_ENV=development

# External Services (Optional)
GOOGLE_MAPS_API_KEY=your-key-here
TWILIO_ACCOUNT_SID=your-sid-here
TWILIO_AUTH_TOKEN=your-token-here
```

### Mobile (.env)
```env
API_URL=http://localhost:3000
GOOGLE_MAPS_API_KEY=your-key-here
```

---

## 🐛 Troubleshooting

### Database Issues

**Error: "database does not exist"**
```bash
cd packages/api
npm run db:create
npm run db:migrate
```

**Error: "relation does not exist"**
```bash
cd packages/api
npm run db:migrate
```

**Reset database (⚠️ Deletes all data)**
```bash
cd packages/api
npm run db:reset
npm run db:seed
```

### Mobile App Issues

**Error: "Unable to resolve module"**
```bash
cd packages/mobile
rm -rf node_modules
npm install
```

**Metro bundler cache issues**
```bash
cd packages/mobile
npx expo start --clear
```

**iOS Simulator not starting**
```bash
# Ensure Xcode Command Line Tools are installed
xcode-select --install
```

### Port Already in Use

**Backend (Port 3000)**
```bash
lsof -ti:3000 | xargs kill -9
```

**Expo (Port 8081)**
```bash
lsof -ti:8081 | xargs kill -9
```

---

## 🎯 What's New (Recent Updates)

### January 2026

#### ✨ New Features
- **Edit Profile Screen** - Users can now update their profile information (name, email, occupation, company)
- **Advanced Property Filtering** - Real-time filtering on SwipeScreen by budget, BHK, commute time, and lifestyle preferences
- **Enhanced Preferences** - Improved preferences loading/saving with proper data transformation
- **Conditional Property Details** - Property detail screen adapts based on whether it's a match (shows chat/schedule buttons only for matched properties)

#### 🐛 Bug Fixes
- Fixed preferences screen data loading from API
- Fixed preferences data format transformation for saving
- Improved test data seeding for reliable development testing
- Enhanced match status handling across navigation

#### 🔧 Improvements
- Optimized property filtering performance with useMemo
- Better seed data for test user (9876540001) with guaranteed matches
- Improved navigation type safety with isMatched parameter
- Enhanced UI feedback for empty filter results

---

## 📚 Documentation

- [MVP Status](docs/MVP_STATUS.md) - Current implementation status
- [Technical Architecture](docs/tech.md) - System design and architecture
- [User Journey Diagrams](docs/USER_JOURNEY_DIAGRAMS.md) - User flow documentation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Write tests for new features
- Use ESLint and Prettier for code formatting
- Follow the existing project structure

---

## 📄 License

This project is proprietary and confidential.

---

## 👨‍💻 Development Team

Built with ❤️ by the Homie team

---

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`

---

**Last Updated:** January 14, 2026