import type { AnimeStatus } from "@prisma/client";

import type { AnimeSearchItem } from "./anilist.js";

const statuses = new Set<AnimeStatus>(["UNKNOWN", "RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"]);

function cleanSynopsis(value: string | null) {
  return value?.replace(/<br\s*\/?>/gi, "\n").replace(/\n{3,}/g, "\n\n").trim() ?? null;
}

export function animeCreateData(item: AnimeSearchItem, syncedAt = new Date()) {
  return {
    anilistId: item.anilistId,
    titleEnglish: item.title.english,
    titleRomaji: item.title.romaji,
    titleNative: item.title.native,
    synopsis: cleanSynopsis(item.synopsis),
    season: item.season,
    seasonYear: item.seasonYear,
    status: statuses.has(item.status as AnimeStatus) ? item.status as AnimeStatus : "UNKNOWN" as AnimeStatus,
    episodeCount: item.episodeCount,
    coverImageUrl: item.coverImageUrl,
    bannerImageUrl: item.bannerImageUrl,
    genres: [...item.genres],
    studios: [...item.studios],
    metadataSyncedAt: syncedAt
  };
}

export const animeUpdateData = animeCreateData;

type EpisodeRecord = {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  durationSeconds: number | null;
  videoSources?: Array<{ externalVideoId: string; thumbnailUrl: string | null; embeddable: boolean | null; availabilityStatus: string; provider: { externalChannelName: string | null } }>;
};

type AnimeRecord = {
  id: string;
  anilistId: number | null;
  titleEnglish: string | null;
  titleRomaji: string;
  titleNative: string | null;
  synopsis: string | null;
  season: string | null;
  seasonYear: number | null;
  status: AnimeStatus;
  episodeCount: number | null;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  genres: string[];
  studios: string[];
  createdAt: Date;
  updatedAt: Date;
  episodes?: EpisodeRecord[];
};

export function publicAnime(anime: AnimeRecord) {
  return {
    id: anime.id,
    anilistId: anime.anilistId,
    title: { english: anime.titleEnglish, romaji: anime.titleRomaji, native: anime.titleNative },
    synopsis: anime.synopsis,
    season: anime.season,
    seasonYear: anime.seasonYear,
    status: anime.status,
    episodeCount: anime.episodeCount,
    coverImageUrl: anime.coverImageUrl,
    bannerImageUrl: anime.bannerImageUrl,
    genres: anime.genres,
    studios: anime.studios,
    episodes: (anime.episodes ?? []).map(episode => ({
      id: episode.id,
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      durationSeconds: episode.durationSeconds,
      sources: (episode.videoSources ?? []).map(source => ({
        provider: "YOUTUBE",
        videoId: source.externalVideoId,
        thumbnailUrl: source.thumbnailUrl,
        channelName: source.provider.externalChannelName,
        embeddable: source.embeddable,
        availabilityStatus: source.availabilityStatus
      }))
    }))
  };
}
