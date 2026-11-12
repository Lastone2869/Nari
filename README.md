# NARI – Women Safety OS

A React + Vite single-page app backed by Firebase (Auth, Firestore, Storage). Users can hold an SOS button to broadcast a live location alert, share a live map link, record audio/video locally, file incident reports (optionally anonymous), track a report by ID, upload hashed evidence, and view a community safety map. Admins verify reports, manage users and monitor live SOS alerts.

## Run locally

```bash
npm install
cp .env.example .env   # optional: Google Maps key + Map ID for the live map
npm run dev
```

`npm run build` produces `dist/`. `npm run lint`, `npm test` and `npm run test:rules` must pass before deploying.

## Testing

| Command | What it covers |
|---|---|
| `npm test` | Unit tests for the pure logic in `src/lib` (Node's built-in test runner, no extra dependency) |
| `npm run test:rules` | Integration tests of `firestore.rules` against the Firestore emulator (needs Java 11+) |
| `npm run emulators` then `npx vite --mode emulators` | Runs the whole app against local Auth, Firestore and Storage emulators, so reports, uploads and admin actions can be exercised without touching the live project |

In the emulator, make yourself admin with the owner API:

```bash
curl -X PATCH -H "Authorization: Bearer owner" -H "Content-Type: application/json" "http://127.0.0.1:8080/v1/projects/nari-safety-os/databases/(default)/documents/users/YOUR_UID?updateMask.fieldPaths=role" -d '{"fields":{"role":{"stringValue":"admin"}}}'
```

Full results of the last test round are in `docs/TEST_REPORT.md`.

## Android app

The Android app is the same web app inside a native shell ([Capacitor](https://capacitorjs.com)). There is one codebase: change the React code, then re-sync. The native project lives in `android/`.

**Get an APK without installing anything.** Every push to `main` runs the "Android APK" workflow on GitHub Actions. Open the run, download the `nari-debug-apk` artifact, unzip it, and install `app-debug.apk` on a phone (allow "install unknown apps" for your file manager or browser).

**Build locally.** Needs [Android Studio](https://developer.android.com/studio) (it brings the SDK and a suitable JDK; the system JDK 25 is too new for this Gradle version).

```bash
npm run android:sync   # build the web app and copy it into android/
npm run android:open   # open the project in Android Studio, then press Run
```

What differs from the website:

| Area | In the app |
|---|---|
| Recordings | Saved to `Documents/NARI` on the phone instead of the browser's downloads |
| Google sign-in | Hidden, because Google blocks its sign-in popup inside embedded browsers. Email and anonymous sign-in work |
| Permissions | Location, camera and microphone are requested the first time each feature is used |
| Floating SOS button, Call 112 | Open the phone dialer |

Not included yet: a signed release build for the Play Store (create a keystore and a `release` signing config), native Google sign-in (needs `@capacitor-firebase/authentication` and a `google-services.json`), and location updates while the app is in the background (needs a foreground service). The app id is `com.nari.safetyos` in `capacitor.config.json` and `android/app/build.gradle`; change both before publishing if you want a different one.

## Firebase setup (required once)

1. Enable **Email/Password**, **Google** and **Anonymous** sign-in in Firebase Auth. Anonymous sign-in is used automatically so SOS and reports work without an account.
2. Deploy the security rules and indexes in this repo. Without them Firestore is open or closed by whatever rules are currently in the console.
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use nari-safety-os
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
3. Create the first admin: in the Firestore console open `users/<your uid>` and add `role: "admin"`. Clients can never set this field themselves; existing admins can promote others from `/admin/users`.
4. Hosting (optional): `npm run build && firebase deploy --only hosting`. `firebase.json` sets the SPA rewrite and basic security headers.

The Firebase web config in `src/firebase/config.js` is a public identifier, not a secret. Protection comes from the rules above; consider enabling App Check to block scripted abuse.

## Data model

| Collection | Written by | Readable by |
|---|---|---|
| `users/{uid}` (profile, `reportIds`) | owner (not `role`), admin | owner, admin |
| `reports` | any signed-in user (`status: pending`, no reporter uid) | everyone (public map + track by ID) |
| `evidence` | owner | owner, admin |
| `alerts` | owner; resolved by owner or admin | owner, admin |
| `safe_spaces` | admin | everyone |

Storage path `evidence/{uid}/…` accepts images, video, audio, PDF and Word files up to 50 MB from the owning user only.

## Known limitations

- Reports are world readable but never contain the reporter's identity. A non-anonymous report is linked by storing its id on the reporter's own private profile; "My Reports" shows the newest 30.
- Deleting a user from the admin panel removes the profile document only; the Auth account must be deleted in the Firebase console.
- The shared "live location" link is a static Google Maps pin of the first position. Only admins see the live trail.
- No rate limiting on report or alert creation beyond Firebase quotas. App Check is wired in: set `VITE_RECAPTCHA_SITE_KEY` and turn on enforcement in the Firebase console.
- The density overlay and markers need a Google Maps API key; without one the map shows a placeholder, so that layer is untested here.
- If an admin resolves a live alert, the reporter's own screen keeps showing it as active until they disarm.
- Live SOS/recording state is kept in memory and ends if the tab is closed or reloaded.
