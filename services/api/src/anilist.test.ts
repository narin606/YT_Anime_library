import assert from "node:assert/strict";
import test from "node:test";

import { AniListError, searchAnime } from "./anilist.js";

const payload = {
  data: {
    Page: {
      pageInfo: { currentPage: 1, hasNextPage: false },
      media: [
        {
          id: 21,
          title: { english: "One Piece", romaji: "ONE PIECE", native: "ワンピース" },
          description: "Pirates search for a legendary treasure.",
          season: "FALL",
          seasonYear: 1999,
          status: "RELEASING",
          episodes: null,
          genres: ["Action", "Adventure"],
          studios: { nodes: [{ name: "Toei Animation" }] },
          coverImage: { extraLarge: "https://example.com/cover.jpg", large: null, color: "#e4b25c" },
          bannerImage: null,
          siteUrl: "https://anilist.co/anime/21"
        }
      ]
    }
  }
};

test("searchAnime validates and normalizes AniList results", async () => {
  let body = "";
  const fetcher: typeof fetch = async (_input, init) => {
    body = String(init?.body);
    return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const result = await searchAnime("https://graphql.anilist.co", "one piece", 1, 12, fetcher);
  assert.match(body, /"search":"one piece"/);
  assert.deepEqual(result.items[0], {
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
  });
});

test("searchAnime rejects malformed provider data", async () => {
  const fetcher: typeof fetch = async () => new Response(JSON.stringify({ data: { Page: { media: [{}] } } }), { status: 200 });
  await assert.rejects(
    searchAnime("https://graphql.anilist.co", "anime", 1, 12, fetcher),
    (error: unknown) => error instanceof AniListError && /unexpected response/.test(error.message)
  );
});
