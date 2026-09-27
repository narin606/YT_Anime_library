# Live Smoke Test — 2026-09-27

Tested 27 September 2026, approximately 20:47–20:52 MYT (UTC+8).

**Site:** https://ani.kaehana.com  
**API:** https://ani-api.kaehana.com  
**Reference repository:** https://github.com/narin606/YT_Anime_library  
**Reviewed commit:** `1e893a016f112dcb0a94102099cd90c3c9b8ece8` (the deployed commit was not independently identified).

## Assessment

The public catalogue-search foundation passes the smoke test. The frontend, live metadata search, API and database were reachable. No blocking failure was observed in the public flows tested.

This is not yet a complete anime-watching application: playback, episode mapping and personal library features remain planned.

In the initial pass, authentication was only partially verified: login rejection and form constraints worked, but successful registration, sign-in, session restoration and logout were not exercised because no test account was supplied. Those paths were subsequently completed in the follow-up verification below.

## Follow-up verification

A second production pass was completed after the findings below were addressed. All six findings now pass on the live site:

- Invalid short searches clear previous results.
- Queries over 120 characters show a specific limit message.
- Account pages describe personal-library features as coming later.
- One episode is rendered with singular wording.
- Search feedback is announced through an atomic polite status region.
- Search pagination loads subsequent results without replacing the current page.

The follow-up pass also verified successful registration, a secure HTTP-only session cookie, session restoration, valid sign-in, logout revocation, trusted-origin CORS behavior, mobile and desktop overflow, and a clean browser console. A conventional browser icon was added after the deeper pass identified a missing-favicon request.

Additional API checks passed for duplicate-email rejection, malformed JSON, search and pagination bounds, structured unknown-route responses, security headers, and HTTP-to-HTTPS redirects. The disposable test account and its cascaded session/profile records were removed afterward and the production database was checked to confirm no QA accounts remained.

## Executed test cases

PASS means the stated observation succeeded; it does not certify the entire feature.

| ID | Test / procedure | Expected result | Observed result | Status |
|---|---|---|---|---|
| T01 | Open HTTPS homepage | Usable homepage | Main content, navigation and search rendered | PASS |
| T02 | Request HTTP homepage | Redirect to HTTPS | HTTP 301 to HTTPS root | PASS |
| T03 | Click Explore catalogue | Navigate to search section | URL became `/#discover` | PASS |
| T04 | Click My library | Navigate to library section | URL became `/#library`; placeholder collections present | PASS |
| T05 | Search `Naruto` | Relevant title cards | 12 cards, including Naruto and Shippuden | PASS |
| T06 | Inspect result cards | Artwork and metadata visible | Images, titles, years, status, genres and episode counts present | PASS with wording issue F04 |
| T07 | Submit a search | Loading feedback and disabled submit | “Searching…” and loading placeholders observed | PASS |
| T08 | Search `a` after Naruto | Validation without ambiguous results | Correct minimum-length message, but Naruto results remain | ISSUE F01 |
| T09 | Enter `zzzxqvsmoketest927` and press Enter | Submit by keyboard; clear empty state | “No anime matched that title.”; prior cards removed | PASS |
| T10 | Submit 121 characters | Explain maximum allowed length | Generic “Check the request and try again.” | ISSUE F02 |
| T11 | Click Sign in | Load login form | Email/password form rendered | PASS |
| T12 | Submit blank login form | Required fields prevent submission | Email validity false; remained on form | PASS |
| T13 | Submit fabricated credentials | Reject without signing in | “Email or password is incorrect.” | PASS |
| T14 | Follow Create an account | Load registration form | Profile name, email, password and 12-character guidance present | PASS |
| T15 | Submit blank registration | Required name prevents submission | Name required, validity false, maximum length 32 | PASS |
| T16 | Registration brand link | Return home | Returned to home; library navigation then worked | PASS |
| T17 | Narrow registration layout | No document horizontal overflow | At measured 390px viewport, document width 390px and inputs within card | PASS, limited layout check |
| T18 | Narrow home layout | No document horizontal overflow | Measured client width and scroll width both 375px | PASS, limited layout check |
| T19 | Wide home layout | No document horizontal overflow | At requested 1440px viewport, client and scroll widths both 1425px | PASS, limited layout check |
| T20 | GET `/health` | API/database healthy | HTTP 200; status `ok`, database `ok` | PASS |
| T21 | GET `/api/v1/anime` | Valid catalogue response | HTTP 200; `items: []`, `nextCursor: null` | PASS endpoint; catalogue empty |
| T22 | GET `/api/v1/auth/me` without session | Deny access | HTTP 401; `unauthenticated` | PASS |
| T23 | GET `/api/v1/search?q=a` | Reject too-short query | HTTP 400; `invalid_request`, minimum-length detail | PASS |
| T24 | GET `/api/v1/search?q=Naruto&perPage=1` | Structured metadata and page info | HTTP 200; one Naruto item; `hasNextPage: true` | PASS |
| T25 | GET unknown API route | Structured not-found response | HTTP 404; `not_found` | PASS |
| T26 | Inspect browser error/warning log at end | No recorded errors | Returned log list empty | PASS within capture limits |

## Findings

### F01 — Previous results remain under invalid-query error — Resolved

**Priority:** Low

1. Search for Naruto and wait for results.
2. Replace the query with `a` and submit.
3. The page shows “Enter at least two characters.” while still displaying Naruto cards.

The cards no longer correspond to the displayed query. Clear them on validation failure, or label them explicitly as results from the previous successful query.

### F02 — Maximum search length is not explained — Resolved

**Priority:** Low

Submit a 121-character query. The field accepts it, but the response is only “Check the request and try again.” The API permits at most 120 characters.

Add matching frontend validation and a useful message such as “Use 120 characters or fewer.”

### F03 — Account pages promise unavailable personal-library features — Resolved

**Priority:** Medium — product clarity

Login says it keeps watch progress, favourites and lists in sync. Registration says “Your watchlist starts here.” Those features are not yet implemented.

Until those features exist, either mark them as coming soon or describe only currently available account functionality.

### F04 — Singular episode counts use plural wording — Resolved

**Priority:** Low

NARUTO×UT and ROAD OF NARUTO display “1 episodes.”

Render `1 episode` when the count is one.

### F05 — Search status changes lack a dedicated live announcement — Resolved

**Priority:** Low — accessibility

Search validation and empty-state messages use a normal paragraph without `role="status"`, `role="alert"` or `aria-live`.

Add an appropriate live region and later confirm actual announcement behaviour with assistive-technology testing.

### F06 — Search has no pagination controls — Resolved

**Priority:** Medium — functional limitation

The live search displays 12 cards with no next/load-more control while the API exposes pagination.

Preserve `pageInfo` on the frontend and expose a next-page or load-more action when more results exist.

## Features not yet implemented or populated

These are not regressions against the current scope:

- Stored catalogue is empty in the tested API response; live AniList search works separately.
- Anime detail pages, episode lists and official YouTube source mapping are pending.
- Embedded playback, resume position, next episode and Continue Watching are pending.
- Watchlists, favourites, genre/year/studio filtering and personal viewing history are pending.

## Remaining test coverage

| Area | Next test | Why not verified |
|---|---|---|
| Registration | Valid registration creates one account/profile; duplicate email rejected | Verified with a disposable production account, then cleaned up |
| Sign-in | Valid credentials return home with correct identity | Verified in the follow-up production pass |
| Session | Reload and revisit preserve identity; logout revokes session | Verified in the follow-up production pass |
| Data isolation | Separate accounts cannot access each other's profile/viewing data | Requires test accounts and implemented features |
| Playback | Start, pause, seek, resume, unavailable video handling | Not implemented |
| Resilience | Friendly handling of API outage, AniList throttling, slow responses | Not deliberately induced on production |
| Browser/device coverage | Chrome, Edge, Firefox, Safari and real mobile devices | This run used Codex's in-app browser only |
| Accessibility | Keyboard traversal, focus visibility, screen-reader announcements, contrast | Only basic labels and one keyboard submission checked |
| Performance/security | Load testing, full security review, cookie/session inspection, backup restore | Outside this smoke test |
| External card links | Confirm new-tab AniList destination loads | Link targets inspected; destination click-through not exercised |

## Recommended order

1. Supply a dedicated test account to complete authentication smoke coverage.
2. Clarify account-page promises and expose additional search results.
3. Improve search validation/status handling and singular episode wording.
4. Add feature acceptance cases as catalogue persistence, playback and personal collections ship.

## Method and limits

Live browser interactions, low-volume direct HTTP requests and read-only repository inspection.

Narrow screenshots were inspected for card/form presentation. Browser screenshot clipping and a failed wide screenshot mean this is not full visual sign-off. Document measurements showed no horizontal overflow in the specific layouts checked.

No uptime, load-capacity, security-certification or complete cross-browser compatibility claim is made.
