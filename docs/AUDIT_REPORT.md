# NARI – System Audit and Remediation Report

Date: 2026-11-12. Scope: the whole repository, every file read. Load assumed: a small public web app (hundreds of users, tens of concurrent SOS alerts), one Firebase project, no server code of its own.

## A. System audit

**What this repo does.** A React 19 + Vite 8 single-page app styled with Tailwind v4. Firebase Auth (email, Google, anonymous), Firestore and Storage are the entire backend; there is no server, no API layer, no migrations. Pages: Home (hold-to-SOS, live location share, local audio/video recording), Report wizard, Track by ID, Safety Map (Google Maps), Evidence locker (SHA-256 hashed uploads), Profile, and an admin area (dashboard, reports, users, live alerts, map).

**Overall assessment before fixes:** not production ready. The two blocking problems were a self-service admin backdoor and the absence of any security rules in the repo. A working-tree CSS change had also silently removed the whole brand theme. Lint failed with 16 errors; there were no tests.

### Findings (severity, root cause, status)

| # | Sev | Finding | Root cause | Status |
|---|-----|---------|------------|--------|
| 1 | Critical | **Anyone could become admin.** Login page had an "Admin" button that signed in anonymously and wrote `role: 'admin'` to the user's own profile; the admin area trusted that field. | Test bailout (`loginAsMagicAdmin`) left in production code; client-side role write. | Fixed: button and function removed; rules forbid clients writing `role`. |
| 2 | Critical | **No Firestore or Storage rules in the repo.** Access control was whatever happened to be in the console. Browser test shows the live rules currently deny public reads, so the map and Track are empty for visitors; what they allow for writes is unknown. | Never written. | Fixed in repo: `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`. **Not deployed** (needs `firebase login`). |
| 3 | High | **Entire brand palette missing from the build.** `index.css` used Tailwind v3 `@tailwind` directives and a `:root` block; Tailwind v4 generated zero `text-nari-*`/`bg-nari-*` utilities and no preflight. | Uncommitted rewrite replaced `@import "tailwindcss"` + `@theme`. | Fixed: v4 syntax restored; built CSS now contains the utilities (verified). |
| 4 | High | **Admin check reused the previous user's answer.** `isAdmin` was only ever set to true, so after an admin signed out and a normal user signed in, the admin shell rendered. | One-way state. | Fixed: result keyed by uid. |
| 5 | High | **Hold-to-SOS could fire after release on touch devices** and leaked timers on unmount. | Both touch and mouse handlers started separate timers. | Fixed: pointer events, timers cleared on unmount, keyboard support added. |
| 6 | High | **SOS said "live tracking active" with no alert created** when the user was signed out or denied location; errors went only to the console. | No sign-in path, no user feedback. | Fixed: anonymous sign-in on demand (`ensureSignedIn`), error toast, emergency state reverts on failure. |
| 7 | High | **Active SOS was orphaned on navigation.** Leaving Home cleared the GPS watch but left the alert `active` forever; the user could never disarm it. | State lived in the unmounting page. | Fixed: trackers and recorders live in a module-level session; Home restores state on return. |
| 8 | High | **Floating SOS button faked a call** ("Calling 112…" with the dial commented out). | Placeholder. | Fixed: it is now a `tel:112` link. |
| 9 | High | **Report submit without a signed-in user** wrote `userId: 'anonymous'` unauthenticated; with any sane rules this fails. | No auth requirement. | Fixed: anonymous sign-in before submit; rules require the author uid or `'anonymous'`. |
| 10 | High | **Track page froze.** Pressing Enter with an empty ID threw inside `doc()`, leaving `loading` stuck and the button disabled; the effect also tripped a React lint error. | Unguarded path and setState in effect. | Fixed: URL-driven fetch, loading derived from state, load failures shown distinctly from "not found". |
| 11 | High | **Hospitals never appeared on the map.** Filter key `hospitals` never matched the stored type `hospital`. | Key mismatch. | Fixed: filter keys equal stored types. |
| 12 | High | **Advanced Markers used a fake Map ID** (`nari-safety-map`), which Google rejects. | Hardcoded string. | Fixed: `VITE_GOOGLE_MAPS_MAP_ID`, default `DEMO_MAP_ID`. |
| 13 | Medium | **Upload failures were hidden.** Evidence page cleared the file list and showed 100% even when every upload failed; no size limit. | Swallowed errors. | Fixed: failed files kept with a message; 50 MB cap mirrored in Storage rules. |
| 14 | Medium | **Admin delete of a report had no confirmation**, unlike users/alerts. | Omission. | Fixed: confirm dialog. |
| 15 | Medium | **Status workflow was incomplete.** Track showed six stages; admins could only set "verified". | Missing control. | Fixed: shared `REPORT_STATUSES` list, admin status select. |
| 16 | Medium | **Profile save could wedge** (`updateDoc` on a missing doc, no try/finally). | Interrupted registration leaves no profile doc. | Fixed: `setDoc` merge with error message. |
| 17 | Medium | **Reports without GPS stored `{lat:0,lng:0}`**, a real point in the Gulf of Guinea. | `|| 0` fallback. | Fixed: `location: null`. |
| 18 | Medium | **Fake data in UI:** safety score hardcoded to 62; "Hardware SOS: press power 3×" claim a web app cannot honour; "ChartJS integration pending" placeholders in admin. | Demo leftovers. | Fixed: score computed from reports (`src/lib/safetyScore.js`, tested), honest copy, placeholders removed. |
| 19 | Medium | **Error boundary printed stack traces to users.** | Debug UI. | Fixed: friendly reload screen, stack to console. |
| 20 | Medium | **Admin layout unusable on phones** (fixed 256 px sidebar). | Desktop-only CSS. | Fixed: icon rail under `md`. |
| 21 | Medium | Firestore listeners had no error callback, so a missing composite index or denied rule produced a silently empty "My Reports". | Omission. | Fixed: shared `listen()` helper logs errors; indexes file added. |
| 22 | Low | Lint: 16 errors (impure `Date.now()` in render, undefined `google`, empty catch blocks, hook/component co-export). | Various. | Fixed: `npm run lint` passes. |
| 23 | Low | Dead code: `Dashboard.jsx` (229 lines, routed to "Page removed"), `AdminSafeSpaces.jsx` (unrouted, dead button), `App.css`, three template assets, unused Firestore helpers, Firebase Analytics (sets cookies without consent), `grid-bg` class used but never defined, duplicate font import. | Template leftovers. | Fixed: deleted. |
| 24 | Low | Broken favicon (`/nari-icon.svg` did not exist); Inter 900 used but not loaded; Playfair loaded but unused. | Mismatch. | Fixed: brand SVG icon added, font request corrected. |
| 25 | Low | `.gitignore` did not cover `.env`; README was the Vite template. | Omission. | Fixed. |
| 26 | Low | Accessibility: icon-only buttons without labels, SOS hold target was a `div`, no reduced-motion handling. | Omission. | Fixed: labels, real `<button>`, `prefers-reduced-motion` rule. |

## B. Architecture

**Existing:** React SPA talking directly to Firebase. Pages call thin wrappers in `src/firebase/*`. Auth state in one context. No server, no job queue, no caching layer. This is appropriate for the product's size; the weaknesses were in trust boundaries, not topology.

**Weaknesses found:** authorisation decided on the client; no shared status vocabulary; emergency state tied to one page's lifetime; two copies of the live-tracking code; pure logic mixed into components so nothing could be unit-tested.

**Changes made:** rules move authorisation to Firebase; `src/lib/` holds framework-free logic (`safetyScore`, `reportStatus`, `sosSession`); one `startTracking` helper serves both SOS and location sharing; one `listen` helper serves every live query; `useAuth` split from the provider so Fast Refresh works. Nothing was added that the current scale does not need (no state library, no code splitting, no server).

**Recommended next:** enable Firebase App Check (abuse protection), and if reporter identity matters, publish map data through a Cloud Function projection instead of world-readable report documents.

## C. Implementation summary

Files changed: 25 modified, 11 added, 8 deleted. Lines: roughly +640 / −900 against the last commit (dead code removal outweighs additions).

Added: `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json`, `.env.example`, `src/lib/{safetyScore,reportStatus,sosSession}.js`, `src/context/useAuth.js`, `tests/safetyScore.test.js`, `public/nari-icon.svg`, `docs/AUDIT_REPORT.md`.
Deleted: `src/pages/Dashboard.jsx`, `src/pages/admin/AdminSafeSpaces.jsx`, `src/App.css`, `src/assets/*`, `public/favicon.svg`, `public/icons.svg`.
Rewritten: `src/pages/Home.jsx`, `src/pages/Track.jsx`, `src/index.css`, `src/firebase/{auth,firestore,config}.js`, `src/components/{AdminRoute,ProtectedRoute,SOSButton}.jsx`, `src/ErrorBoundary.jsx`, `README.md`.
Edited: Login, Report, Evidence, Profile, SafetyMap, AdminReports, AdminAlerts, AdminDashboard, AdminLayout, Navbar, App, `index.html`, `eslint.config.js`, `package.json`, `.gitignore`.

**Verification performed**

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings (was 16 errors) |
| `npm test` (node:test) | 4/4 pass |
| `npm run build` | OK, 741 kB JS / 60 kB CSS; brand utilities present in output |
| Browser: Home, Report wizard, Track (bad ID), Map (no key), Login, Evidence redirect, `/admin` guard, 404 | All render correctly; no console errors except Firebase permission denials from the live project's current rules |
| Mobile 375 px | No horizontal overflow |

## D. Remaining issues

Second round (see `docs/TEST_REPORT.md`) closed most of the first list. What is left needs your Firebase account or a product decision.

| Issue | Why unresolved | Action needed |
|---|---|---|
| Rules and indexes are not deployed to the live project | No Firebase CLI login in this environment | `firebase login && firebase deploy --only firestore:rules,firestore:indexes,storage` |
| No admin account exists in the live project | Must be set server-side | Add `role: "admin"` to your `users/{uid}` doc in the console |
| Existing live reports still carry the old `userId` field | No access to live data | One-time clean-up in the console: for each report with a real uid, add the report id to `users/{uid}.reportIds`, then delete the `userId` field |
| App Check not enforced | Needs a reCAPTCHA v3 site key and a console switch | Set `VITE_RECAPTCHA_SITE_KEY`, enable enforcement for Firestore and Storage |
| Admin "remove profile" does not delete the sign-in account | Needs the Admin SDK (Cloud Functions, paid plan) | Delete the account in the console, or add a callable function |
| Live map layer (markers, density overlay) untested | No Google Maps API key available | Add the key to `.env` and check `/map` |
| Reporter's screen is not told when an admin resolves their alert | Would need a listener on the alert doc | Small follow-up if wanted |
| First paint on throttled mobile is about 2.5 s | Firebase SDK is most of the 300 kB first load | Acceptable now; lazy-load Firestore per route if it matters |

Closed since the first round: reporter uid exposure on public reports, deprecated heatmap library, inline-styled Login page, single 741 kB bundle, missing end-to-end coverage of report/evidence/admin flows, planning notes at repo root.

## E. Production readiness

| Area | Rating | Evidence |
|---|---|---|
| Security | **Ready once rules are deployed** | 12 emulator tests prove the rules, including the old admin backdoor; Storage returns 403 without auth; reports hold no identity |
| Architecture | Good for scale | Single trust boundary, shared helpers, route-level code splitting |
| Frontend | Good | 30 functional checks pass in the browser against emulators; lint clean |
| Backend (Firebase wrappers) | Good | Every write path exercised under real rules |
| Database | Good | Schema validated in rules; one composite index; 300-report load renders in about 1 s |
| Performance | Good | Lighthouse numbers in the test report |
| Accessibility | Good | axe: zero WCAG A/AA violations on 11 pages after fixes; keyboard order and focus rings verified |
| Test coverage | Reasonable | 9 unit tests, 12 rules integration tests, scripted end-to-end round (manual to repeat) |
| Deployment | Ready once rules ship | `firebase.json` with SPA rewrite, security headers, emulator config |

**Verdict:** deploy the rules, create the first admin, clean the old `userId` fields, then the app is fit for a pilot. Turn on App Check before a public launch.
