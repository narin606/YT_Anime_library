import assert from "node:assert/strict";
import test from "node:test";

import { parseEpisodeNumber, parseIsoDurationSeconds, validatePlaylistEpisodes } from "./youtube.js";

const channelId = "UCC-g5hWSvCbdB8HQQIA0_pg";

test("episode parser accepts numbered episodes and rejects trailers", () => {
  assert.equal(parseEpisodeNumber("【English Sub】Title｜Episode 01｜TROPICS"), 1);
  assert.equal(parseEpisodeNumber("Title - EPISODE 12"), 12);
  assert.equal(parseEpisodeNumber("Title｜PV01｜TROPICS"), null);
  assert.equal(parseEpisodeNumber("Official Trailer"), null);
});

test("ISO 8601 YouTube durations become seconds", () => {
  assert.equal(parseIsoDurationSeconds("PT23M57S"), 1437);
  assert.equal(parseIsoDurationSeconds("PT1H2M3S"), 3723);
});

test("approved playlist validation keeps public embeddable episodes from one channel", () => {
  const videos = [
    { id: "video01", title: "Title Episode 01", channelId, channelTitle: "Tropics Anime Asia", duration: "PT23M57S", embeddable: true, privacyStatus: "public", thumbnailUrl: "https://img.example/1.jpg", publishedAt: "2026-01-01T00:00:00Z" },
    { id: "trailer01", title: "Title PV01", channelId, channelTitle: "Tropics Anime Asia", duration: "PT1M", embeddable: true, privacyStatus: "public", thumbnailUrl: null, publishedAt: null },
    { id: "video02", title: "Title Episode 02", channelId, channelTitle: "Tropics Anime Asia", duration: "PT23M56S", embeddable: true, privacyStatus: "public", thumbnailUrl: null, publishedAt: null }
  ];
  const episodes = validatePlaylistEpisodes(videos, channelId);
  assert.deepEqual(episodes.map(item => item.episodeNumber), [1, 2]);
  assert.equal(episodes[0].durationSeconds, 1437);
  assert.throws(() => validatePlaylistEpisodes([{ ...videos[0], channelId: "wrong" }], channelId), /unexpected channel/);
});
