import assert from "node:assert/strict";
import test from "node:test";

import { classifyPlaylist, fetchChannelInventory, parseEpisodeNumber, parseIsoDurationSeconds, validatePlaylistEpisodes } from "./youtube.js";

const channelId = "UCC-g5hWSvCbdB8HQQIA0_pg";

test("episode parser accepts numbered episodes and rejects trailers", () => {
  assert.equal(parseEpisodeNumber("【English Sub】Title｜Episode 01｜TROPICS"), 1);
  assert.equal(parseEpisodeNumber("Title - EPISODE 12"), 12);
  assert.equal(parseEpisodeNumber("《殺手旅店》#7 (繁中字幕 | 日語原聲)【Ani-One Asia】"), 7);
  assert.equal(parseEpisodeNumber("Title｜PV01｜TROPICS"), null);
  assert.equal(parseEpisodeNumber("Official Trailer"), null);
});

test("ISO 8601 YouTube durations become seconds", () => {
  assert.equal(parseIsoDurationSeconds("PT23M57S"), 1437);
  assert.equal(parseIsoDurationSeconds("PT1H2M3S"), 3723);
});

test("approved playlist validation ignores videos without usable duration", () => {
  const videos = [{ id: "scheduled", title: "Title Episode 03", channelId, channelTitle: "Tropics Anime Asia", duration: "PT0S", embeddable: true, privacyStatus: "public", thumbnailUrl: null, publishedAt: null }];
  assert.deepEqual(validatePlaylistEpisodes(videos, channelId), []);
});

test("approved playlist validation keeps public embeddable episodes from one channel", () => {
  const videos = [
    { id: "video01", title: "Title Episode 01", channelId, channelTitle: "Tropics Anime Asia", duration: "PT23M57S", embeddable: true, privacyStatus: "public", thumbnailUrl: "https://img.example/1.jpg", publishedAt: "2026-01-01T00:00:00Z" },
    { id: "preview01", title: "Title - Preview of Episode 01", channelId, channelTitle: "Tropics Anime Asia", duration: "PT30S", embeddable: true, privacyStatus: "public", thumbnailUrl: null, publishedAt: null },
    { id: "trailer01", title: "Title PV01", channelId, channelTitle: "Tropics Anime Asia", duration: "PT1M", embeddable: true, privacyStatus: "public", thumbnailUrl: null, publishedAt: null },
    { id: "video02", title: "Title Episode 02", channelId, channelTitle: "Tropics Anime Asia", duration: "PT23M56S", embeddable: true, privacyStatus: "public", thumbnailUrl: null, publishedAt: null }
  ];
  const episodes = validatePlaylistEpisodes(videos, channelId);
  assert.deepEqual(episodes.map(item => item.episodeNumber), [1, 2]);
  assert.equal(episodes[0].durationSeconds, 1437);
  assert.throws(() => validatePlaylistEpisodes([{ ...videos[0], channelId: "wrong" }], channelId), /unexpected channel/);
});

test("playlist classifier excludes promotional collections and identifies likely anime series", () => {
  assert.equal(classifyPlaylist("Official Trailers and PVs", 24), "EXCLUDED");
  assert.equal(classifyPlaylist("Anime Funny Clips", 80), "EXCLUDED");
  assert.equal(classifyPlaylist("The Example Hero | English Sub", 12), "LIKELY_SERIES");
  assert.equal(classifyPlaylist("Weekly updates", 3), "REVIEW");
});

test("channel inventory verifies identity and follows every playlist page", async () => {
  const urls: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = new URL(String(input)); urls.push(url.toString());
    const resource = url.pathname.split("/").at(-1);
    if (resource === "channels") return new Response(JSON.stringify({ items: [{ id: channelId, snippet: { title: "Tropics Anime Asia", customUrl: "@TropicsAnimeAsia" }, contentDetails: { relatedPlaylists: { uploads: "UUUploads" } } }] }));
    if (!url.searchParams.get("pageToken")) return new Response(JSON.stringify({ nextPageToken: "page-2", items: [{ id: "PLone", snippet: { title: "Series One", channelId, channelTitle: "Tropics Anime Asia", publishedAt: "2026-01-01T00:00:00Z", thumbnails: {} }, contentDetails: { itemCount: 12 }, status: { privacyStatus: "public" } }] }));
    return new Response(JSON.stringify({ items: [{ id: "PLtwo", snippet: { title: "Official PV", channelId, channelTitle: "Tropics Anime Asia", publishedAt: "2026-01-02T00:00:00Z", thumbnails: {} }, contentDetails: { itemCount: 2 }, status: { privacyStatus: "public" } }] }));
  };
  const result = await fetchChannelInventory("key", channelId, fetcher);
  assert.equal(result.channel.title, "Tropics Anime Asia");
  assert.equal(result.channel.uploadsPlaylistId, "UUUploads");
  assert.deepEqual(result.playlists.map(item => item.id), ["PLone", "PLtwo"]);
  assert.equal(result.playlists[0].classification, "LIKELY_SERIES");
  assert.equal(result.playlists[1].classification, "EXCLUDED");
  assert.equal(urls.filter(url => url.includes("/playlists?")).length, 2);
});

test("channel inventory rejects a mismatched API identity", async () => {
  const fetcher: typeof fetch = async () => new Response(JSON.stringify({ items: [{ id: "UCwrong", snippet: { title: "Impersonator" }, contentDetails: { relatedPlaylists: { uploads: "UUwrong" } } }] }));
  await assert.rejects(fetchChannelInventory("key", channelId, fetcher), /not found or did not match/);
});
