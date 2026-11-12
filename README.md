# NARI – Women Safety OS

A React + Vite single-page app backed by Firebase (Auth, Firestore, Storage). Users can hold an SOS button to broadcast a live location alert, share a live map link, record audio/video locally, file incident reports (optionally anonymous), track a report by ID, upload hashed evidence, and view a community safety map. Admins verify reports, manage users and monitor live SOS alerts.

## Run locally

```bash
npm install
cp .env.example .env   # optional: Google Maps key + Map ID for the live map
npm run dev
```

`npm run build` produces `dist/`. `npm run lint` and `npm test` must pass before deploying.

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
| `users/{uid}` | owner (not `role`), admin | owner, admin |
| `reports` | any signed-in user (`status: pending`) | everyone (public map + track by ID) |
| `evidence` | owner | owner, admin |
| `alerts` | owner; resolved by owner or admin | owner, admin |
| `safe_spaces` | admin | everyone |

Storage path `evidence/{uid}/…` accepts images, video, audio, PDF and Word files up to 50 MB from the owning user only.

## Known limitations

- Reports are world readable, so the `userId` of a non-anonymous report is visible to anyone who reads the collection. Use the Anonymous toggle for sensitive reports, or move public map data to a server-side projection.
- Deleting a user from the admin panel removes the profile document only; the Auth account must be deleted in the Firebase console.
- The shared "live location" link is a static Google Maps pin of the first position. Only admins see the live trail.
- No rate limiting on report or alert creation beyond Firebase quotas. Enable App Check for abuse protection.
- The heatmap uses the Google Maps `visualization` library, which Google has deprecated; it still works but should be replaced eventually.
- Live SOS/recording state is kept in memory and ends if the tab is closed or reloaded.
