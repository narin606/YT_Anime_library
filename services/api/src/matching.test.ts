import assert from "node:assert/strict";
import test from "node:test";
import { matchPlaylistToAnime, playlistSearchTitle } from "./matching.js";

const anime={title:{english:"Frieren: Beyond Journey's End",romaji:"Sousou no Frieren",native:"葬送のフリーレン"},episodeCount:28};
test("extracts distributor playlist search titles",()=>{
 assert.equal(playlistSearchTitle("📓《Death Note》｜English Sub｜TROPICS ENTERTAINMENT"),"Death Note");
 assert.equal(playlistSearchTitle("Frieren: Beyond Journey's End [English Sub]"),"Frieren: Beyond Journey's End");
 assert.equal(playlistSearchTitle("《My Teen Romantic Comedy SNAFU》|《果然我的青春戀愛喜劇搞錯了。》"),"My Teen Romantic Comedy SNAFU");
});
test("accepts exact title matches and rejects loose or episode-count conflicts",()=>{
 assert.ok(matchPlaylistToAnime("Frieren: Beyond Journey's End [English Sub]",35,anime).confidence>=0.9);
 assert.equal(matchPlaylistToAnime("Frieren Funny Moments",28,anime).publishable,false);
 assert.equal(matchPlaylistToAnime("Frieren: Beyond Journey's End",3,anime).publishable,false);
});
