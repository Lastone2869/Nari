# NARI – Test Report

Date: 2026-11-12. All tests ran locally. Functional tests ran against the Firebase **emulators** (Auth, Firestore, Storage) with the real `firestore.rules` and `storage.rules` loaded, so nothing was written to the live project.

## Summary

| Layer | Tool | Result |
|---|---|---|
| Unit | Node test runner (`npm test`) | 9 / 9 pass |
| Integration (security rules) | Firestore emulator + `@firebase/rules-unit-testing` (`npm run test:rules`) | 12 / 12 pass |
| Functional end to end | Real browser driving the app on emulators | 30 / 30 checks pass |
| Accessibility | axe-core 4.14 (WCAG 2.0/2.1/2.2 A + AA, best practice) | 0 violations on 11 pages after fixes |
| Performance | Lighthouse 12, load test with seeded data | Mobile 94–97, desktop 99 |
| Usability | Keyboard walk, tap targets, responsive at 375 / 768 px | Pass after fixes |
| Static | ESLint, production build | 0 errors, build OK |

## 1. Unit tests

`tests/format.test.js`, `tests/safetyScore.test.js`. They cover the logic that has branches: file-size formatting at each unit boundary, mapping Firebase auth errors to plain messages (known codes, unknown codes, empty input), report lifecycle progress, and the safety score (empty, severe vs minor weight, behaviour at volume, 30-day window, missing timestamps).

## 2. Integration tests: security rules

`tests/rules/firestore.rules.test.js`, 12 tests, each seeding fresh data with rules disabled and then acting as Alice, Bob, an admin, or a signed-out visitor.

| Rule under test | Proven |
|---|---|
| Profiles | Owner and admin can read; strangers and signed-out users cannot |
| Admin backdoor | A user cannot set `role` on their own profile by update, merge, or at creation |
| Role changes | Only an admin can grant or revoke admin |
| Report linkage | A user can add report ids to their own profile only |
| Reports | Public read; create needs sign-in, `pending` status, string type, description of 2000 characters or less, and **no `userId` field** |
| Report moderation | Only admins change status or delete |
| Evidence | Private to owner, readable by admin, immutable, cannot be created for someone else |
| Alerts | Owner and admin read and resolve; strangers cannot read, list, or resolve |
| Safe spaces | Public read, admin-only write |

Storage rules were probed over HTTP on the Storage emulator: unauthenticated read and write of an evidence object both return **403**.

One test failed on its first run. The cause was the test itself (it promoted Bob to admin, then expected Bob to be refused). The rules were correct.

## 3. Functional end-to-end tests

Driven through the real UI in a browser. GPS was stubbed in the page because the test browser has no location permission.

| # | Journey | Checks | Result |
|---|---|---|---|
| 1 | Sign in with an unknown account | Friendly message "No account with that email" | Pass |
| 2 | Register with email | Lands on the page originally requested (`/evidence`), profile doc created | Pass |
| 3 | File a report | Next disabled without category, disabled without description, review screen correct, Report ID shown | Pass |
| 4 | Track the report | Opens at `/track/<id>`, status PENDING, progress 17 %, "In Progress" marker | Pass |
| 5 | Profile | Report listed under My Reports, counts correct, phone saved with "Saved!" | Pass |
| 6 | Evidence upload | 51 MB file rejected with message, PDF uploaded, SHA-256 on screen equals independently computed hash | Pass |
| 7 | Anonymous report | Toggle state exposed as a switch, report created, **not** linked to the profile | Pass |
| 8 | Stored data | Reports contain no `userId`; missing GPS stored as `null`; evidence path is under the owner's uid | Pass |
| 9 | SOS hold | 1 s press does nothing, 3 s hold activates, toast shown, alert stays active after navigating away and back | Pass |
| 10 | SOS live trail | Alert document gains location pings over time (3, then 5) | Pass |
| 11 | SOS with GPS denied | Error toast, state returns to safe, no false "active" | Pass |
| 12 | SOS by keyboard | Holding Space for 3 s activates; Disarm works | Pass |
| 13 | Location share | Link appears, toggle shows pressed, stop clears it | Pass |
| 14 | Admin guard | Signed-out and non-admin users see Access Denied | Pass |
| 15 | Admin dashboard | Correct live counts (users, reports, active SOS) | Pass |
| 16 | Admin reports | All six statuses offered, change persists, Resolved filter works, delete cancel keeps row, delete confirm removes it | Pass |
| 17 | Admin users | Promoted user listed as ADMIN | Pass |
| 18 | Admin alerts | Live alert listed with ping count, resolve clears it, dashboard drops to 0 | Pass |
| 19 | Exit admin | Signs out and lands on `/login` | Pass |
| 20 | Signed-out tracking | Report shows RESOLVED, 83 % after the admin change | Pass |
| 21 | Signed-out report | Anonymous session created silently, report appears under that session's profile | Pass |
| 22 | Sign out / wrong password / sign in | Correct messages and redirects | Pass |

Not covered: Google sign-in popup (needs a real Google account), the live Google Map layer (no API key), real device GPS, camera and microphone recording.

## 4. Non-functional tests

### Accessibility (axe-core)

Scanned `/`, `/report`, `/track/<id>`, `/evidence`, `/profile`, `/login`, `/map`, `/admin`, `/admin/reports`, `/admin/users`, `/admin/alerts`.

Defects found and fixed in this round:

| Severity | Defect | Fix |
|---|---|---|
| Critical | Anonymous toggle had no accessible name | `role="switch"`, `aria-checked`, label |
| Critical | Evidence copy button and file link had no name | `aria-label` |
| Critical | Profile email field had no label | `htmlFor` / `id` |
| Serious | Low-contrast text in 9 places (grey labels, status badges, score label, emerald status text, pulsing SOS button) | Darker tones; pulse removed from the floating button |
| Serious | Tap targets under 24 px (password eye, evidence icons) | Padding added |
| Moderate | Skipped heading levels (footer, Track, Profile), no `h1` on Login, nested `main` in admin | Corrected structure |

Final state: 0 violations on all 11 pages. Lighthouse accessibility score: 100 on every page tested.

### Performance (Lighthouse 12, production build)

Mobile runs use Lighthouse's simulated slow 4G and 4x CPU slowdown.

| Page | Performance | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Home (mobile) | 97 | 2.1 s | 2.1 s | 0 ms | 0 |
| Login (mobile) | 97 | 2.1 s | 2.1 s | 0 ms | 0.001 |
| Map (mobile) | 96 | 2.2 s | 2.3 s | 0 ms | 0.024 |
| Report (mobile) | 94 | 2.4 s | 2.5 s | 0 ms | 0.002 |
| Track (mobile) | 93 | 2.4 s | 2.6 s | 0 ms | 0.001 |
| Home (desktop) | 99 | 0.7 s | 0.7 s | 0 ms | 0.013 |

Home, Login and Map were measured after the font change below; Report and Track before it, so they should now be slightly better. Best practices 100 and SEO 100 on all pages (SEO was 91 until `robots.txt` was added). Scores vary a few points between runs.

Changes that moved the numbers:

| Change | Effect |
|---|---|
| Route-level code splitting (map and admin load on demand) | First-load JavaScript 741 kB down to about 694 kB across two cached chunks, admin code no longer shipped to visitors |
| Non-blocking font stylesheet | Mobile FCP 2.6 s to 2.1 s, performance 91 to 97 |
| Firebase Analytics removed | Smaller bundle, no cookies |

### Load test

300 reports and 40 live alerts (60 location pings each) seeded into the emulator. Measured on the **unminified dev build**, so production is faster.

| Measurement | Result |
|---|---|
| Admin reports: all 302 rows rendered | 1.09 s from navigation |
| Filter to Pending (51 rows) | 74 ms |
| Filter back to All (302 rows) | 444 ms |
| Status change round trip (write, snapshot, re-render) | 92 ms |
| Admin alerts: 40 cards rendered | 0.68 s |
| Map: 50 most recent incidents listed | 0.48 s |
| JS heap with 302 rows | 60 MB |

**Defect found by the load test:** with 50 reports loaded the safety score fell to its floor of 5, so any active area would always read "UNSAFE". The formula now uses a smooth curve and ignores reports older than 30 days. The same 50 reports now score 26, and the score keeps discriminating at 200.

Not done: multi-user concurrency or soak testing against real Firebase. That is governed by Firebase quotas, not this code, and needs the live project.

### Usability

| Check | Result |
|---|---|
| Keyboard order on Report | Logo, menu, anonymous switch, six categories, footer. Logical, disabled Next is skipped |
| Focus visibility | Every tab stop shows a focus ring |
| SOS without a pointer | Works with Space or Enter held for 3 s |
| Reduced motion | Pulsing and sliding animations switch off under `prefers-reduced-motion` |
| 375 px phone | No horizontal page scroll on any page; admin table scrolls inside its own container; admin sidebar collapses to icons |
| 768 px tablet | Desktop navigation appears, no overflow |
| Error messages | Auth, upload, profile, tracking and SOS failures all show plain-language messages instead of failing silently |
| Honest status | SOS no longer claims to be active when it is not; the SOS button really dials 112; Track separates "not found" from "could not load" |

Defect found and fixed: on a phone the admin reports header clipped its filter tabs. It now wraps.

## 5. How to repeat

```bash
npm run lint
npm test
npm run test:rules
npm run build
```

End-to-end: `npm run emulators` in one terminal, `npx vite --mode emulators` in another, then use the app at the printed URL. The README shows how to make the emulator user an admin.
