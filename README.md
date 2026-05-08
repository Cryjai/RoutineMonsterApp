# 🐲 Routine Monsters

> **Turn your daily routines into a monster-taming adventure.**  
> A gamified habit tracker Android app — built with React + TypeScript + Capacitor. Fully offline-first.

---

## ✨ What is this?

Routine Monsters is a mobile app that turns your real-life tasks and habits into a game. Complete your routines → earn rewards → level up your monsters. Built solo as a personal project to prove that productivity apps don't have to be boring.

---

## 📱 Download

| Build | File | Notes |
|-------|------|-------|
| **Debug APK** (sideload) | [`routine-monsters-v1.1-debug.apk`](routine-monsters-v1.1-release.apk) | Enable "Install from unknown sources" |
| **Release Bundle** (Play Store) | [`routine-monsters-v1.1-release.aab`](routine-monsters-v1.1-release.aab) | For Google Play Console upload |

> Version `1.0` · Android API 35 (Android 15+) · App ID: `com.acry.routinemonsters`
> Version `1.1` · Android API 35 (Android 15+) · App ID: `com.acry.routinemonsters`

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| **Animations** | Framer Motion |
| **State / Data** | TanStack Query + Drizzle ORM |
| **Mobile** | Capacitor v8 (Android) |
| **Local Storage** | `@capacitor/preferences` (fully offline) |
| **Web Backend** | Express.js + better-sqlite3 (web preview only) |
| **Forms** | React Hook Form + Zod |
| **Routing** | Wouter |

---

## 🏗️ Architecture

```
Routine Monsters
├── React Frontend (Vite)
│   ├── Screens: Home, Routines, Tasks, Rewards, Profile
│   └── Components: shadcn/ui + custom monster UI
│
├── Capacitor Android Wrapper
│   ├── nativeApi.ts — offline-first data layer
│   └── @capacitor/preferences — replaces SQLite on device
│
└── Express Backend (web preview only)
    └── better-sqlite3 + Drizzle ORM
```

On **Android**, the app runs entirely offline — no backend server needed. Routines, tasks, profiles, rewards, and run history are all stored locally on device via Capacitor Preferences.

The **web preview** (dev mode) still uses the Express + SQLite backend.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Android Studio (for Android build)
- Java 17+

### Web Development

```bash
# Install dependencies
npm install

# Start dev server (web preview with Express backend)
npm run dev
```

### Android Build

```bash
# Build the web bundle
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then build / run from Android Studio, or:

```bash
# Build debug APK directly
cd android && ./gradlew assembleDebug
```

### Database (web only)

```bash
# Push schema to SQLite
npm run db:push
```

---

## 📁 Project Structure

```
├── App.tsx              # Root component + routing
├── main.tsx             # Entry point
├── nativeApi.ts         # Capacitor offline data layer
├── storage.ts           # Web storage layer (Express)
├── schema.ts            # Drizzle ORM schema
├── routes.ts            # Express API routes
├── index.css            # Global styles
├── tailwind.config.ts   # Tailwind config
├── capacitor.config.ts  # Capacitor config
├── server/              # Express backend
├── script/              # Build scripts
└── release/             # Release artifacts
```

---

## 🎮 Features

- **Routine Management** — Create routines with custom tasks, frequency, and schedules
- **Monster System** — Each routine is tied to a monster that reflects your consistency
- **Reward Shop** — Complete tasks to earn coins and unlock rewards
- **Run History** — Track your past sessions and progress over time
- **AI Coach** — Deterministic in-app coach that gives contextual tips (no external API)
- **Dark / Light Mode** — System-aware theming via `next-themes`
- **100% Offline** — No account, no cloud, no nonsense. Your data stays on your device.

---

## ⚠️ Known Limitations (v1.0)

- No real OAuth / login system
- No cross-device sync (data is local only)
- No push notifications
- No Google Play Billing
- AI Coach is rule-based, not an LLM
- Store listing, screenshots, and privacy policy pending before public Play Store launch

---

## 📄 License

[MIT](./LICENSE)

---

<p align="center">Built by <a href="https://github.com/Cryjai">Cryjai</a> · Made in Hong Kong 🇭🇰</p>
