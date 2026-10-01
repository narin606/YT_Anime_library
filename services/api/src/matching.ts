export function normalizeTitle(value:string){return value.normalize("NFKD").toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g," ").trim()}
export function playlistSearchTitle(title:string){
 const bracket=title.match(/《([^》]+)》/); if(bracket)return bracket[1].trim();
 return title.replace(/^\s*\[[^\]]*\]\s*/,"").replace(/\s*\[(?:english|eng)[^\]]*\].*$/i,"").replace(/\s*[|｜].*$/," ").replace(/\s+/g," ").trim();
}
export function matchPlaylistToAnime(playlistTitle:string,itemCount:number,anime:{title:{english:string|null;romaji:string;native:string|null};episodeCount:number|null}){
 const extracted=normalizeTitle(playlistSearchTitle(playlistTitle));const titles=[anime.title.english,anime.title.romaji,anime.title.native].filter(Boolean).map(x=>normalizeTitle(x!));
 const exact=titles.includes(extracted);const countOkay=itemCount>=4&&(!anime.episodeCount||itemCount>=Math.min(4,anime.episodeCount)&&itemCount<=anime.episodeCount+10);
 const banned=/\b(trailer|pv|clip|recap|compilation|funny moments|opening|ending)\b/i.test(playlistTitle);
 const confidence=exact&&!banned?(countOkay?0.96:0.75):0;
 return {confidence,publishable:confidence>=0.9,extractedTitle:playlistSearchTitle(playlistTitle),reason:exact?(countOkay?"Exact title and plausible item count":"Exact title but implausible item count"):"Title did not match exactly"};
}
