# Data Model

PostgreSQL is the current default because anime, episodes, sources, profiles and viewing state have clear relationships.

## Core entities

- Anime: canonical anime metadata, usually anchored by AniList ID.
- AnimeAlias: alternate titles used for matching inconsistent YouTube uploads.
- Episode: canonical episode row per anime/season/episode number.
- VideoProvider: official YouTube channel/provider metadata.
- VideoSource: specific YouTube video mapped to an episode.
- SourceMatch: confidence/review record for automated matching.
- Account: authenticated user identity.
- Profile: Netflix-style viewer profile under an account.
- WatchProgress: one current progress row per profile/episode.
- WatchlistItem / Favourite: profile-specific library state.

The Prisma schema in `services/api/prisma/schema.prisma` is the implementation source of truth.

## Important constraints

- AniList ID unique when present.
- YouTube video ID unique.
- Episode unique by anime + season + episode number.
- WatchProgress unique by profile + episode.
- Watchlist/favourite unique by profile + anime.

## Availability

Video sources track availability independently from anime metadata:

```text
UNKNOWN
AVAILABLE
UNAVAILABLE
PRIVATE
DELETED
REGION_RESTRICTED
EMBED_DISABLED
```

A catalogue entry should remain even if one external source disappears; another source may replace it later.
