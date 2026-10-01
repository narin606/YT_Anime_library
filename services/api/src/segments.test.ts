import assert from "node:assert/strict";
import test from "node:test";
import { localEpisodeNumber, validatePlaylistSegments } from "./segments.js";

test("playlist segments reject overlaps and renumber global episodes locally",()=>{
  const segments=validatePlaylistSegments([
    {animeId:"original",sourceEpisodeStart:1,sourceEpisodeEnd:175,animeEpisodeStart:1},
    {animeId:"2014",sourceEpisodeStart:176,sourceEpisodeEnd:277,animeEpisodeStart:1},
    {animeId:"final",sourceEpisodeStart:278,sourceEpisodeEnd:328,animeEpisodeStart:1}
  ]);
  assert.equal(localEpisodeNumber(176,segments[1]),1);
  assert.equal(localEpisodeNumber(277,segments[1]),102);
  assert.equal(localEpisodeNumber(278,segments[2]),1);
  assert.equal(localEpisodeNumber(328,segments[2]),51);
  assert.throws(()=>validatePlaylistSegments([
    {animeId:"a",sourceEpisodeStart:1,sourceEpisodeEnd:10,animeEpisodeStart:1},
    {animeId:"b",sourceEpisodeStart:10,sourceEpisodeEnd:20,animeEpisodeStart:1}
  ]),/overlap/);
});
