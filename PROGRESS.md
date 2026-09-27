# Project Progress

Last updated: 2026-09-27

This file is the source of truth for the current project state. Read it before starting work and update it before ending a work session.

## Current phase

**Phase 0 complete. Phase 1 and Phase 2 started.**

The public repository now exists and contains a runnable frontend/backend scaffold, deployment notes, Prisma data model, Docker Compose configuration, server handoff instructions, and the initial product architecture.

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

- [ ] Final frontend subdomain
- [ ] Final API subdomain
- [ ] Authentication provider/approach
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
- [ ] Build anime card component
- [ ] Build horizontal catalogue row
- [ ] Build anime details page
- [ ] Build episode list
- [ ] Build player page
- [ ] Add loading/empty/error states
- [ ] Connect frontend to backend catalogue API
- [ ] Replace placeholders with real AniList-backed data

## Phase 2 - Backend foundation

- [x] Create TypeScript Express service
- [x] Add `GET /health`
- [x] Add initial `GET /api/v1/anime`
- [x] Add Helmet and CORS middleware
- [x] Add Prisma dependency/schema
- [x] Add Dockerfile
- [x] Add PostgreSQL Docker Compose service
- [x] Bind API host exposure to localhost in Compose
- [ ] Add environment validation
- [ ] Generate Prisma client in a real dev/server environment
- [ ] Create initial migration
- [ ] Connect API to PostgreSQL
- [ ] Add structured logging
- [ ] Add request validation
- [ ] Add rate limiting
- [ ] Define stable API error envelope

## Phase 3 - AniList metadata

- [ ] Create AniList GraphQL client
- [ ] Search by anime title
- [ ] Import canonical metadata
- [ ] Store AniList ID
- [ ] Store English/Romaji/native titles
- [ ] Store artwork
- [ ] Store genres
- [ ] Store synopsis
- [ ] Store season/year/status
- [ ] Store episode count when available
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

- [ ] Select authentication approach
- [ ] Implement account identity
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
- [ ] Inspect mini-PC environment
- [ ] Clone repo onto mini PC
- [ ] Choose application path
- [ ] Configure persistent PostgreSQL
- [ ] Run first migration
- [ ] Configure Cloudflare Tunnel
- [ ] Select/configure API hostname
- [ ] Restrict production CORS
- [ ] Import repo into Vercel
- [ ] Select/configure frontend hostname
- [ ] Set production environment variables
- [ ] Configure backups
- [ ] Test full browser -> Vercel -> Cloudflare -> mini PC path

## Current blockers

1. Mini-PC environment has not yet been inspected by an agent with machine access.
2. YouTube API credentials have not been created/configured.
3. Authentication approach is still undecided.
4. Final frontend/API subdomains are not selected.
5. No real PostgreSQL migration has been executed yet.

## Recommended next work

### Track A - mini PC

Give `SERVER_AGENT_PROMPT.md` to the agent that can access the server. Its first job is environment inspection, not installation.

### Track B - application

Implement AniList search/import first. This gives the frontend real anime metadata before YouTube ingestion is introduced.

Suggested first vertical slice:

```text
search AniList title
  -> save anime metadata
  -> GET /api/v1/anime
  -> render real anime cards on frontend
```

After that, add YouTube source mapping.

## Session log

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
