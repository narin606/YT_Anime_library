# API Plan

Base path: `/api/v1`

## Catalogue

```text
GET /health
GET /anime
GET /anime/:animeId
GET /anime/:animeId/episodes
GET /episodes/:episodeId
GET /genres
GET /search?q=
```

Filters can later support genre, year, status, studio and availability.

## Profiles

```text
GET    /me
GET    /profiles
POST   /profiles
PATCH  /profiles/:profileId
DELETE /profiles/:profileId
```

## Progress

```text
GET /profiles/:profileId/progress
GET /profiles/:profileId/progress/:episodeId
PUT /profiles/:profileId/progress/:episodeId
GET /profiles/:profileId/continue-watching
```

Example write:

```json
{
  "positionSeconds": 637,
  "durationSeconds": 1420,
  "completed": false
}
```

The backend should reject negatives and clamp impossible values.

## Library

```text
GET    /profiles/:profileId/watchlist
POST   /profiles/:profileId/watchlist/:animeId
DELETE /profiles/:profileId/watchlist/:animeId

GET    /profiles/:profileId/favourites
POST   /profiles/:profileId/favourites/:animeId
DELETE /profiles/:profileId/favourites/:animeId
```

## Admin/internal

```text
POST /admin/catalogue/sync/youtube
POST /admin/catalogue/sync/anilist
GET  /admin/matches/pending
POST /admin/matches/:matchId/approve
POST /admin/matches/:matchId/reject
POST /admin/sources/:sourceId/recheck
```

All profile/admin writes require explicit authorization. Admin routes must be protected, not merely obscure.
