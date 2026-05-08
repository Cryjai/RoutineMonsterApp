# 🐲 Routine Monsters

A habit tracker I built because normal productivity apps are too dead inside.

Routine Monsters turns routines into creatures you have to keep alive.  
Show up, finish tasks, stack wins. Ignore your life, and your monsters pay the price.

---

## What it is

This is a gamified routine app built around one idea:  
**consistency feels better when it has consequences, feedback, and a bit of personality.**

Instead of another sterile checklist, I wanted something that feels more like a system you live with.
So this app mixes habit tracking, rewards, light progression, and monster-style feedback into one offline-first Android app.

---

## Download

| Build | File | Notes |
|---|---|---|
| Latest Android APK | [`routine-monsters-v1.1-release.apk`](./routine-monsters-v1.1-release.apk) | Current sideloadable build |
| Play Store bundle | [`routine-monsters-v1.0-release.aab`](./routine-monsters-v1.0-release.aab) | Existing Google Play upload bundle |

**App ID:** `com.acry.routinemonsters`  
**Target:** Android 15 / API 35

---

## Screens

<div align="center">
  <img src="https://raw.githubusercontent.com/Cryjai/RoutineMonsterApp/main/Routine%20Monsters%20Pics/Screenshot_20260508_160544_Routine%20Monsters.jpg" width="30%" />
  <img src="https://raw.githubusercontent.com/Cryjai/RoutineMonsterApp/main/Routine%20Monsters%20Pics/Screenshot_20260508_160551_Routine%20Monsters.jpg" width="30%" />
  <img src="https://raw.githubusercontent.com/Cryjai/RoutineMonsterApp/main/Routine%20Monsters%20Pics/Screenshot_20260508_160558_Routine%20Monsters.jpg" width="30%" />
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/Cryjai/RoutineMonsterApp/main/Routine%20Monsters%20Pics/Screenshot_20260508_160608_Routine%20Monsters.jpg" width="30%" />
  <img src="https://raw.githubusercontent.com/Cryjai/RoutineMonsterApp/main/Routine%20Monsters%20Pics/Screenshot_20260508_160613_Routine%20Monsters.jpg" width="30%" />
  <img src="https://raw.githubusercontent.com/Cryjai/RoutineMonsterApp/main/Routine%20Monsters%20Pics/Screenshot_20260508_160619_Routine%20Monsters.jpg" width="30%" />
</div>

---

## Why I made it

A lot of habit apps are technically fine but emotionally empty.
They track tasks, but they don’t create attachment.

I wanted something that makes routine-building feel more alive:
- your progress should feel visible
- your slips should feel real
- your system should feel like it belongs to you, not like a spreadsheet pretending to be a life

That’s where the monster layer comes in.

---

## What it does

- Build routines and break them into actual tasks
- Tie routines to monster-style progression
- Track sessions and run history
- Earn rewards through consistency
- Work fully offline on Android
- Keep personal data on-device instead of depending on a live backend

---

## Tech

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Mobile | Capacitor Android |
| UI | Tailwind CSS, Radix UI, custom components |
| State / Data | TanStack Query, Drizzle ORM |
| Storage | `@capacitor/preferences` on Android |
| Web preview | Express + SQLite |

---

## How it works

On Android, the app does not need the Express backend for core flows.
Routines, tasks, profile data, rewards, app state, and run history are stored locally on-device.

For web preview / development, there is still an Express + SQLite setup.

---

## Local development

```bash
npm install
npm run dev
```

### Android build

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## Current state

This is a real working build, not just a UI mockup.

Current limitations:
- no account system
- no cloud sync
- no push notifications
- no billing
- AI coach is rule-based, not an LLM integration

That said, the core loop already works: build routines, complete tasks, track progress, keep the system alive.

---

## Notes

Built by [Cryjai](https://github.com/Cryjai) in Hong Kong.  
This project is part of a bigger direction I’m exploring: building products that make self-management feel less boring, less sterile, and more human.

---

## License

[MIT](./LICENSE)
