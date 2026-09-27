# Project Progress

Last updated: 2026-09-27

This file is the source of truth for the current project state. Read it before starting work and update it before ending a work session.

## Current phase

**The catalogue foundation is running.**

The repository contains a responsive frontend, a validated AniList search API, the initial PostgreSQL migration, deployment configuration, and the product architecture. Title search now returns live, normalized anime metadata without requiring a YouTube API key.

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
- [ ] Build horizontal catalogue row
- [ ] Build anime details page
- [ ] Build episode list
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
- [ ] Import canonical metadata into PostgreSQL
- [x] Normalize AniList ID
- [x] Normalize English/Romaji/native titles
- [x] Normalize artwork
- [x] Normalize genres and studios
- [x] Normalize synopsis
- [x] Normalize season/year/status
- [x] Normalize episode count when available
- [ ] Add metadata refresh flow

## Phase 4 - YouTube catalogue

- [ ] Create Google Cloud project/API key or reuse a suitable existing one
- [ ] Enable YouTube Data API v3
- [ ] Create official source/channel registry
- [ ] Ingest uploads/playlists
- [ ] Store video/provider metadata
- [ ] Extract candidate anime title and episode number
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
3. Stored catalogue is still empty; live AniList search currently works separately from persisted catalogue data.

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

Persist selected AniList search results into PostgreSQL, expose them through `GET /api/v1/anime`, and build an anime details page from the stored catalogue. After that, add official YouTube source mapping and playback.

## Session log

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
