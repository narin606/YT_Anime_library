# Project Progress

Last updated: 2026-10-02

This file is the source of truth for the current project state. Read it before starting work and update it before ending a work session.

## Current phase

**Distributor-backed catalogue ingestion now supports reviewed AniList mappings and multiple official language/audio/region source variants per anime.**

### 2026-10-02 — preview-safe Muse playlist import

- Linked Muse Asia playlist `PLwLSw1_eDZl1AUEELCJe2ghK9eDI5nGsQ` to AniList `148465` with exactly 12 full English-sub episodes.
- Episode previews are now excluded before numbering validation, preventing previews and full episodes from being treated as duplicate episode numbers.

### 2026-10-02 — Frieren season separation

- Moved global episodes 29–38 out of AniList `154587` and into canonical Season 2 AniList `182255` as local episodes 1–10.
- Season 1 now contains only episodes 1–28, retaining separate English Sub and English Dub variants.
- Automatic matching now sends duplicate episode-number playlists to review instead of failing metadata import with HTTP 500.

### 2026-10-02 — episode-list pagination

- Long episode lists now show 15 episodes per page with Previous/Next, numbered page controls, and a visible episode range.
- Changing language/audio source resets pagination to page 1; mobile controls wrap into a touch-friendly layout.

### 2026-10-02 — multi-series playlist segmentation

- Diagnosed the 328-entry Ani-One Fairy Tail playlist: YouTube pagination and inventory were complete, but one playlist spans three AniList entries while ingestion assumed one playlist per anime.
- Added explicit, non-overlapping playlist segments with local episode renumbering so combined distributor playlists can safely populate sequels without duplicating anime records.
- Fairy Tail boundaries are verified against AniList: 1–175 (`6702`), 176–277 (`20626`, local 1–102), and 278–328 (`99749`, local 1–51).

### 2026-10-02 — reviewed playlist variants

- Imported all 279 language/region annotations from the user-reviewed workbook.
- Validated 33 direct playlist-to-AniList mappings covering 26 unique anime.
- Accepted 22 approved-channel playlists with 296 numbered episode sources; four had fewer than four valid episodes and seven contained conflicting duplicate episode numbers, so those remain in review.
- Added Ani-One `#episode` parsing, playlist provenance, source language/audio/region metadata, and an episode-player variant selector.
- Canonical anime identity remains the AniList ID; alternate subtitle/dub/region playlists become sources under one anime rather than duplicate catalogue cards.
- API and web tests pass (20/20), both production builds pass, and the API deployment is healthy.

**The persisted catalogue and anime-details foundation is implemented.**

The repository contains a responsive frontend, validated AniList search and canonical-ID import APIs, persisted PostgreSQL catalogue records, anime detail pages with episode-ready empty states, deployment configuration, and the product architecture.

## Confirmed decisions

- [x] Public GitHub repository: `narin606/YT_Anime_library`
- [x] Frontend deployment target: Vercel
- [x] Backend deployment target: personal mini PC/server
- [x] DNS/public routing layer: Cloudflare
- [x] Main domain: `kaehana.com`
- [x] Frontend direction: Next.js + React + TypeScript
- [x] Backend direction: Node.js + TypeScript
- [x] Database direction: PostgreSQL + Prisma
- [x] YouTube remains the playback/video host
- [x] UI is organized by anime rather than channel
- [x] Provider/channel data remains stored internally
- [x] AniList is the preferred first metadata provider
- [x] Accounts/profiles will have separate viewing state
- [x] Partial episode progress will be resumable
- [x] `PROGRESS.md` is mandatory project state documentation
- [x] Cloudflare Tunnel is the preferred backend exposure method
- [x] Docker Compose is the initial mini-PC deployment approach

## Still undecided

- [x] Frontend subdomain: `ani.kaehana.com`
- [x] API subdomain: `ani-api.kaehana.com`
- [x] Authentication: self-hosted email/password with hashed credentials and revocable sessions
- [ ] Whether multiple profiles per account remain in MVP or move slightly later
- [ ] Whether scheduled sync runs inside the API process initially or as a separate worker

## Phase 0 - Bootstrap

- [x] Define product concept
- [x] Define architecture
- [x] Define deployment topology
- [x] Create public repository
- [x] Push bootstrap files to GitHub
- [x] Add repository working rules
- [x] Add mini-PC handoff prompt
- [x] Add security/deployment/API/product documentation
- [x] Add Prisma data model
- [x] Add Docker Compose foundation
- [ ] Decide final public subdomains

## Phase 1 - Frontend

- [x] Create Next.js application shell
- [x] Add TypeScript
- [x] Add global responsive starter styling
- [x] Add initial home page shell
- [ ] Add Tailwind CSS if retained
- [x] Build anime card component
- [x] Build horizontal catalogue rows
- [x] Build anime details page
- [x] Build episode list and empty state
- [ ] Build player page
- [x] Add loading/empty/error states
- [x] Connect frontend to backend search API
- [x] Replace search placeholders with live AniList-backed data

## Phase 2 - Backend foundation

- [x] Create TypeScript Express service
- [x] Add `GET /health`
- [x] Add initial `GET /api/v1/anime`
- [x] Add Helmet and CORS middleware
- [x] Add Prisma dependency/schema
- [x] Add Dockerfile
- [x] Add PostgreSQL Docker Compose service
- [x] Bind API host exposure to localhost in Compose
- [x] Add environment validation
- [x] Generate Prisma client in a real development environment
- [x] Create initial migration
- [x] Connect catalogue routes to PostgreSQL
- [ ] Add structured logging
- [x] Add request validation
- [x] Add authentication rate limiting
- [x] Define stable API error envelope

## Phase 3 - AniList metadata

- [x] Create validated AniList GraphQL client
- [x] Search by anime title
- [x] Import canonical metadata into PostgreSQL
- [x] Normalize AniList ID
- [x] Normalize English/Romaji/native titles
- [x] Normalize artwork
- [x] Normalize genres and studios
- [x] Normalize synopsis
- [x] Normalize season/year/status
- [x] Normalize episode count when available
- [ ] Add metadata refresh flow

## Phase 4 - YouTube catalogue

- [x] Reuse the secured YouTube Data API v3 key
- [x] Validate YouTube Data API v3 access
- [x] Create approved official source/channel ingestion
- [x] Ingest approved playlists
- [x] Store video/provider metadata
- [x] Extract episode numbers from approved playlist titles
- [ ] Build anime matching workflow
- [ ] Add confidence scoring
- [ ] Add manual review queue
- [ ] Support multiple sources per episode
- [ ] Detect deleted/private/embed-disabled sources
- [ ] Add periodic availability refresh

## Phase 5 - Playback and progress

- [ ] Integrate YouTube IFrame Player API
- [ ] Capture playback state/current time/duration
- [ ] Save progress roughly every 10-15 seconds while actively playing
- [ ] Save on pause
- [ ] Save on seek completion
- [ ] Save on episode change/navigation where practical
- [ ] Resume playback from saved timestamp
- [ ] Mark episode complete near configured threshold
- [ ] Add Continue Watching
- [ ] Add next-episode behavior

## Phase 6 - Accounts/profiles

- [x] Select authentication approach
- [x] Implement account identity
- [ ] Implement profile CRUD
- [ ] Enforce profile ownership server-side
- [ ] Profile-specific progress
- [ ] Profile-specific watchlist
- [ ] Profile-specific favourites

## Phase 7 - Library/discovery

- [ ] Search
- [ ] Genre filter
- [ ] Year filter
- [ ] Studio filter
- [ ] Airing-status filter
- [ ] Recently added
- [ ] Watchlist
- [ ] Favourites
- [ ] Completed/history views
- [ ] New episode indicators

## Phase 8 - Deployment

- [x] Add API Dockerfile
- [x] Add Compose foundation
- [x] Inspect mini-PC environment
- [x] Clone repo onto mini PC
- [x] Choose application path
- [x] Configure persistent PostgreSQL
- [x] Run first migration
- [x] Configure Cloudflare Tunnel
- [x] Select/configure API hostname
- [x] Restrict production CORS
- [x] Import repo into Vercel
- [x] Select/configure frontend hostname
- [x] Set production environment variables
- [ ] Configure backups
- [x] Test frontend -> Vercel and public API -> Cloudflare -> mini PC paths

## Current blockers

1. YouTube API credentials have not been created/configured.
2. Automated PostgreSQL backup storage and retention are not configured yet.
3. No blocker remains for persisted catalogue import/details; official YouTube source ingestion and automated backups are the next operational work.

## QA findings from production smoke test

A production smoke test was completed on 2026-09-27 against `ani.kaehana.com` and `ani-api.kaehana.com`. The public catalogue-search foundation passed with no blocking failures. See `docs/SMOKE_TEST_2026-09-27.md`.

Open improvements:

- [x] F01 Clear previous search results after client-side validation failure.
- [x] F02 Add frontend maximum search length validation and a specific 120-character message.
- [x] F03 Adjust account-page wording so unfinished watch-progress/watchlist features are presented as coming later.
- [x] F04 Render singular episode count as `1 episode`.
- [x] F05 Add an accessible live region for async search validation, empty and error states.
- [x] F06 Preserve AniList pagination metadata and add load-more controls.
- [x] Complete valid registration/sign-in/session/logout smoke coverage using a disposable test account.
- [ ] Add broader browser/device, accessibility, resilience and security test coverage later.

## Recommended next work

Deploy and smoke-test persisted catalogue import/details, then add official YouTube source mapping and playback.

## Session log

### 2026-10-01 - Strict playlist matching and distributor rows

- Added exact normalized playlist-to-AniList matching, plausible episode-count checks, official channel validation and idempotent source ingestion.
- Added import-time auto-linking and a bounded administrative backfill. The first batch linked 14 playlists representing six distinct anime and sent 26 candidates to review before AniList rate limiting stopped further work safely.
- Scheduled/live videos without duration are now skipped rather than failing an entire playlist.
- Discovery remains available from local PostgreSQL when AniList is throttled, and homepage data is grouped into Muse Asia, Ani-One Asia and Tropics Anime Asia rows.
- Sixteen API tests and four web tests pass; both production builds pass. Production QA verified three Muse and four Tropics cards, representative official players, 135 episode records and 197 sources with no overflow, console errors or failed requests. Ani-One remains hidden until a safe match is available.
- Exported 279 processed unmatched/ambiguous playlists to `/home/brandon/refs/anime-playlist-review.csv` for manual AniList linking. Visual QA clarified card badges as available-source counts and added a mobile swipe cue.

### 2026-10-01 - Trusted distributor channel inventory

- Verified immutable YouTube channel IDs and uploads-playlist IDs through the YouTube Data API for Muse Asia, Ani-One Asia and Tropics Anime Asia.
- Added complete `playlists.list` pagination, strict channel-identity validation, conservative playlist classification, and an authenticated idempotent channel-sync endpoint.
- Added durable approved-channel and discovered-playlist models. Missing playlists are marked inactive on later syncs rather than deleted; no candidate is automatically published by this inventory stage.
- The first read-only crawl found 1,184 public playlists: Muse Asia 534, Ani-One Asia 536 and Tropics Anime Asia 114. The broad first-pass classifier produced 1,017 likely-series candidates, 148 review candidates and 19 excluded promotional/clip collections; every likely candidate still requires episode-pattern and AniList confidence validation.
- Thirteen API tests pass, the API production build passes, and all three migrations applied successfully to an isolated PostgreSQL 16 database.
- Production migration and authenticated synchronization completed successfully. PostgreSQL contains exactly 534 active Muse Asia, 536 active Ani-One Asia and 114 active Tropics Anime Asia playlists; the public API and database remained healthy. This is an inventory baseline only—no broad classifier candidate was published automatically.

### 2026-10-01 - Homepage anime discovery

- Replaced placeholder library panels with live horizontal rows for **Available to watch**, **Recently added**, and **Popular this season**.
- Playable and recent rows come from the persisted PostgreSQL catalogue; only verified playable titles display official episode counts.
- Popular seasonal recommendations come from a validated AniList popularity query and use an explicit **Add** action before opening a stored detail page.
- Added discovery response validation and seasonal-query regression coverage. Ten API tests and four web tests pass; both production builds pass.
- Production verification passed on Vercel deployment `dpl_9yXfA3xqi91VCaPnTvru1SE51Q9W`: desktop cards are capped at 220px; mobile cards are 181px with a visible horizontal-scroll cue; all three rows returned the expected 1 playable, 2 recent and 12 seasonal titles with no page overflow, console errors or failed requests.
- The playable card opened the correct 12-episode detail page. Visual QA found and resolved an oversized single-card rail before final deployment.

### 2026-10-01 - Official YouTube episode ingestion and playback

- Added server-side YouTube Data API playlist ingestion behind administrator authentication; credentials remain only in the mode-600 production environment.
- Approved playlists are checked for channel ownership, public status, embeddability, unique episode numbers and valid durations before an idempotent transaction persists providers, episodes and video sources.
- Added official YouTube privacy-enhanced playback and responsive episode cards to anime detail pages.
- Verified the Tropics Anime Asia English-subtitled playlist for *Jack-of-All-Trades, Party of None*: 12 numbered episodes plus two promotional videos; only Episodes 1–12 are ingested.
- Nine API tests and three web tests pass; both production builds pass.
- Production ingestion persisted exactly Episodes 1–12 with one approved source each. Live desktop/mobile checks confirmed the official YouTube iframe, Episode 1→12 switching, thumbnails and selected state with zero overflow, console errors or failed requests; mobile hero stacking was tightened after visual review.

### 2026-10-01 - Persisted catalogue and anime details

- Added idempotent AniList canonical-ID import into PostgreSQL and a stable public catalogue response shape.
- Added stored-anime detail retrieval with episodes ordered by season and episode number.
- Changed search cards to add a selected title to the library and open its detail page.
- Added a responsive anime detail page with artwork, metadata, synopsis, studios, genres and an explicit no-mapped-episodes state.
- Added catalogue mapping and frontend import-client regression tests. Five API tests and three web tests pass; both production builds pass.
- Deployed commit `2e4b467` to the mini-PC API and Vercel, imported Frieren through the production flow, and verified its persisted detail page at desktop and mobile sizes with no horizontal overflow, console errors or failed requests.
- Live visual review found and fixed literal provider `<br>` markup, overly internal empty-state wording, an oversized detail heading and a crowded mobile header. A synopsis-cleaning regression test raises the suite to six API tests plus three web tests.
- Final production verification passed on Vercel deployment `dpl_4bV4KqkGAqpoy5CmHUR1MZb9YX5Y`: desktop 1440×1000 and mobile 412×915 both had zero horizontal overflow, console errors or failed requests; screenshots showed no clipping, overlap, raw markup or broken assets.

### 2026-09-27 - QA fixes and extended production verification

- Resolved all six initial smoke-test findings: stale results, query-length feedback, account wording, singular episode wording, accessible status announcements, and search pagination.
- Added frontend regression tests for search limits and episode wording.
- Completed production registration, session restoration, sign-in, logout revocation, responsive-layout, CORS, and browser-console checks with a disposable account, then removed it and confirmed no QA account remained.
- Added application icons after the browser pass identified a missing favicon request.
- Added a controlled HTTP 400 response for malformed JSON request bodies and verified API bounds, duplicate registration handling, structured errors, security headers, and HTTPS redirects.
- Corrected the Vercel project root so GitHub deployments build the Next.js app from `apps/web`.

### 2026-09-27 - Production smoke test

- Smoke-tested the deployed frontend, search flow, authentication rejection paths, responsive layouts, health endpoint and public API behaviour.
- Confirmed the frontend, API and PostgreSQL health path were reachable in production.
- Added `docs/SMOKE_TEST_2026-09-27.md` with 26 executed test cases, six improvement findings and remaining coverage.
- Corrected stale progress items: the catalogue route already queries PostgreSQL and authentication endpoints already have rate limiting.
- Added F01-F06 to the active improvement checklist.


### 2026-09-27 - Accounts and public deployment

- Added private account registration and login with strong password hashing, HTTP-only sessions and logout invalidation.
- Added responsive sign-in and registration pages.
- Deployed the frontend to Vercel at `ani.kaehana.com`.
- Deployed PostgreSQL and the API on the mini PC at `ani-api.kaehana.com` through Cloudflare Tunnel.
- Restricted API browser access to the production frontend and verified registration, session recovery and logout through the public route.

### 2026-09-27 - First working catalogue slice

- Added a validated AniList GraphQL search client and stable API error responses.
- Connected the frontend to live anime title search with loading, empty and failure states.
- Reworked the responsive home page around anime discovery and library collections.
- Added the initial PostgreSQL migration and expanded stored anime metadata with genres, studios and sync time.
- Removed insecure database password defaults and added startup environment validation.
- Updated Next.js and pinned compatible Prisma packages; the production dependency audit reports no known vulnerabilities.

### 2026-09-27 - Initial concept

- Defined an anime-first frontend over legally available YouTube-hosted anime.
- Chose AniList for anime metadata.
- Defined profiles, Continue Watching, resumable timestamps, watchlists and favourites.
- Defined Vercel frontend + mini-PC backend + Cloudflare topology.

### 2026-09-27 - Repository bootstrap

- Created public GitHub repository `narin606/YT_Anime_library`.
- Added Next.js frontend scaffold.
- Added Express/TypeScript API scaffold.
- Added PostgreSQL + Prisma data model.
- Added Docker Compose and API Dockerfile.
- Added `AGENTS.md` project working rules.
- Added `SERVER_AGENT_PROMPT.md` for direct mini-PC work.
- Added architecture, deployment, API, product, data-model and security docs.
- Added `.env.example` and repository ignore rules.
