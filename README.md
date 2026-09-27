# YT Anime Library

A personal anime library interface for available YouTube-hosted anime.

The application is anime-first rather than channel-first: anime metadata, genres, artwork, episodes, watch progress and discovery belong to this app, while playback remains inside the official YouTube embedded player.

## Architecture

```text
Browser
  |
  v
Vercel - Next.js frontend
  |
  | HTTPS API
  v
Cloudflare
  |
  | Cloudflare Tunnel
  v
Mini PC - Node.js API + PostgreSQL
  |
  +-- AniList metadata sync
  +-- YouTube catalogue sync
  +-- watch progress
  +-- accounts/profiles
```

## Planned stack

- Next.js + React + TypeScript
- Node.js + TypeScript API
- PostgreSQL + Prisma
- YouTube Data API v3
- YouTube IFrame Player API
- AniList GraphQL API
- Vercel for frontend
- Mini PC for backend/database
- Cloudflare DNS/Tunnel for backend exposure

## Core goals

- Browse by anime, not YouTube channel.
- Enrich YouTube sources with genres, posters, synopsis, studio, year and episode metadata.
- Keep official provider/channel information internally for source management.
- Support multiple official YouTube sources for one episode.
- Track playback position per profile and resume where the viewer stopped.
- Provide Continue Watching, watchlists, favourites and search.
- Never download, proxy, restream or store the anime video itself.

## Project state

Read [PROGRESS.md](./PROGRESS.md) before starting work. It is the source of truth for completed work, decisions, blockers and next tasks.

See also:

- [Architecture](./docs/ARCHITECTURE.md)
- [Data model](./docs/DATA_MODEL.md)
- [API plan](./docs/API_PLAN.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Product plan](./docs/PRODUCT_PLAN.md)
- [Security notes](./docs/SECURITY.md)
- [Mini-PC handoff](./SERVER_AGENT_PROMPT.md)
- [Repository working rules](./AGENTS.md)
