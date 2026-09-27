# Architecture

## Overview

The system has three layers:

1. Presentation - Next.js frontend on Vercel.
2. Application/data - API and workers on the mini PC.
3. External metadata/content - AniList and YouTube.

YouTube remains the video delivery platform. The application stores metadata, mappings and user state only.

## Topology

```text
AniList ----------------------+
                              |
Browser <-> Vercel frontend <-> Cloudflare <-> Mini PC API <-> PostgreSQL
   |
   +-> YouTube embedded player
```

## Frontend responsibilities

- Render catalogue, anime pages and episode lists.
- Embed the official YouTube player.
- Read player state/current time.
- Save progress periodically and on meaningful player events.
- Resume from stored position.
- Display Continue Watching, watchlist and favourites.
- Keep backend-only secrets out of the browser bundle.

## Backend responsibilities

- Own the canonical database.
- Manage profiles and viewing state.
- Store anime, episode and source relationships.
- Call YouTube Data API with server-side credentials.
- Call AniList and normalize metadata.
- Run ingestion, matching and availability refresh jobs.
- Expose a stable API to the frontend.

## Catalogue principle

Normal browsing should be:

```text
Anime -> Episode -> Play
```

Internally:

```text
Episode -> VideoSource -> Provider/channel -> YouTube video
```

Provider/channel data stays available for source validation and debugging even if hidden from normal UI.

## Matching pipeline

```text
YouTube title/description
        |
    normalization
        |
 candidate anime lookup
        |
 title aliases + playlist context + episode extraction
        |
 confidence score
      /      \
   high     uncertain
    |          |
 auto-link   review queue
```

Uncertain matches must not be silently accepted.

## Progress strategy

Save current time roughly every 10-15 seconds while actively playing and also on pause, seek completion, episode switch, page lifecycle events where practical, and video end.

The backend upserts one record per profile/episode. A configurable 90-95% completion threshold is a reasonable starting point.
