# 🏠 Homie - VR & AI Rental Matching Platform

Tinder-style property matching with VR tours, powered by AI recommendations.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Project Structure](#project-structure)
5. [Running the Project](#running-the-project)
6. [Testing](#testing)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)

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