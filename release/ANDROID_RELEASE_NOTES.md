# Routine Monsters Android Release Notes

## Build output

- App name: Routine Monsters
- Android application ID: `com.acry.routinemonsters`
- Version: `1.0` / versionCode `1`
- Target SDK: Android 15 / API 35
- Release bundle for Google Play: `routine-monsters-v1.0-release.aab`
- Debug APK for sideload testing: `routine-monsters-v1.0-debug.apk`

## What changed for Android

- Added Capacitor Android wrapper.
- Added native/offline API mode for Capacitor using `@capacitor/preferences`.
- Android app no longer depends on the Express backend for core flows.
- Routines, tasks, profiles, rewards, app state, and run history are stored locally on-device.
- Web preview still uses the Express + SQLite backend.

## Signing files

- Upload keystore: `routine-monsters-upload.jks`
- Keystore password file: `upload-keystore-password.txt`
- Key alias: `routine-monsters-upload`
- Key password: same as keystore password
- Fingerprint: see `upload-key-fingerprint.txt`

Keep the keystore and password private. You need the same upload key for future Google Play updates. Do not commit these files to GitHub.

## Google Play upload

Upload `routine-monsters-v1.0-release.aab` in Play Console. If this is a new personal developer account, Google may require closed testing with 12 opted-in testers for 14 continuous days before production access.

## Known production limitations

- No real OAuth login.
- No Google Play Billing.
- No push notifications.
- AI Coach is deterministic, not a paid LLM API.
- Data is local to the device. There is no cross-device sync.
- Store listing, screenshots, privacy policy, and Data safety answers still need to be prepared before public launch.
