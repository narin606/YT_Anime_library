import assert from "node:assert/strict";
import test from "node:test";

import { episodeLabel, getDiscovery, importAnime, validateSearchQuery } from "./anime.js";
import { EPISODES_PER_PAGE, episodePageCount } from "./pagination.js";

test("search validation mirrors the API limits", () => {
  assert.equal(validateSearchQuery("a"), "Enter at least two characters.");
  assert.equal(validateSearchQuery("x".repeat(121)), "Use 120 characters or fewer.");
  assert.equal(validateSearchQuery(" Naruto "), null);
});

test("episode labels use singular and plural wording", () => {
  assert.equal(episodeLabel(1), "1 episode");
  assert.equal(episodeLabel(2), "2 episodes");
  assert.equal(episodeLabel(null), null);
});

test("long episode lists paginate in groups of fifteen", () => {
  assert.equal(EPISODES_PER_PAGE, 15);
  assert.equal(episodePageCount(1), 1);
  assert.equal(episodePageCount(15), 1);
  assert.equal(episodePageCount(16), 2);
  assert.equal(episodePageCount(175), 12);
});

test("importAnime persists a selected AniList result", async () => {
  let request: RequestInit | undefined;
  const fetcher: typeof fetch = async (_url, init) => {
    request = init;
    return new Response(JSON.stringify({ anime: { id: "anime_1", anilistId: 21, title: { english: "One Piece", romaji: "ONE PIECE", native: null }, synopsis: null, season: null, seasonYear: null, status: "RELEASING", episodeCount: null, coverImageUrl: null, bannerImageUrl: null, genres: [], studios: [], episodes: [] } }), { status: 201 });
  };
  const anime = await importAnime(21, fetcher, "https://api.example");
  assert.equal(anime.id, "anime_1");
  assert.equal(request?.method, "POST");
  assert.equal(request?.body, JSON.stringify({ anilistId: 21 }));
});

test("getDiscovery validates the homepage row payload", async () => {
  const response = { playable: [], recent: [], popular: [], byDistributor: { "Muse Asia": [], "Ani-One Asia": [], "Tropics Anime Asia": [] }, season: "FALL", seasonYear: 2026 };
  const fetcher: typeof fetch = async () => new Response(JSON.stringify(response), { status: 200 });
  assert.deepEqual(await getDiscovery(fetcher, "https://api.example"), response);
  const broken: typeof fetch = async () => new Response(JSON.stringify({ playable: [] }), { status: 200 });
  await assert.rejects(getDiscovery(broken, "https://api.example"), /unexpected response/);
});
