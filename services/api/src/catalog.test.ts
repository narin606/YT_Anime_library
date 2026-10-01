import assert from "node:assert/strict";
import test from "node:test";

import { animeCreateData, animeUpdateData, publicAnime } from "./catalog.js";

const item = {
  anilistId: 21,
  title: { english: "One Piece", romaji: "ONE PIECE", native: "ワンピース" },
  synopsis: "Pirates search for a legendary treasure.",
  season: "FALL",
  seasonYear: 1999,
  status: "RELEASING",
  episodeCount: null,
  genres: ["Action", "Adventure"],
  studios: ["Toei Animation"],
  coverImageUrl: "https://example.com/cover.jpg",
  coverColor: "#e4b25c",
  bannerImageUrl: null,
  anilistUrl: "https://anilist.co/anime/21"
};

test("AniList results map to idempotent catalogue create and update data", () => {
  const now = new Date("2026-10-01T00:00:00.000Z");
  assert.deepEqual(animeCreateData(item, now), {
    anilistId: 21,
    titleEnglish: "One Piece",
    titleRomaji: "ONE PIECE",
    titleNative: "ワンピース",
    synopsis: item.synopsis,
    season: "FALL",
    seasonYear: 1999,
    status: "RELEASING",
    episodeCount: null,
    coverImageUrl: item.coverImageUrl,
    bannerImageUrl: null,
    genres: ["Action", "Adventure"],
    studios: ["Toei Animation"],
    metadataSyncedAt: now
  });
  assert.deepEqual(animeUpdateData(item, now), animeCreateData(item, now));
});

test("catalogue synopsis converts provider line-break markup to readable text", () => {
  const mapped = animeCreateData({ ...item, synopsis: "First paragraph.<br><br>Second paragraph." });
  assert.equal(mapped.synopsis, "First paragraph.\n\nSecond paragraph.");
});

test("public catalogue records expose stable detail-page fields", () => {
  assert.deepEqual(publicAnime({
    id: "anime_1",
    ...animeCreateData(item, new Date("2026-10-01T00:00:00.000Z")),
    createdAt: new Date("2026-09-30T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    episodes: [{ id: "episode_1", seasonNumber: 1, episodeNumber: 1, title: "Romance Dawn", durationSeconds: 1440 }]
  }), {
    id: "anime_1",
    anilistId: 21,
    title: { english: "One Piece", romaji: "ONE PIECE", native: "ワンピース" },
    synopsis: item.synopsis,
    season: "FALL",
    seasonYear: 1999,
    status: "RELEASING",
    episodeCount: null,
    coverImageUrl: item.coverImageUrl,
    bannerImageUrl: null,
    genres: ["Action", "Adventure"],
    studios: ["Toei Animation"],
    episodes: [{ id: "episode_1", seasonNumber: 1, episodeNumber: 1, title: "Romance Dawn", durationSeconds: 1440 }]
  });
});
