"use client";

import { useMemo, useState } from "react";
import type { CatalogueAnime } from "../../../lib/anime";

type Episode = CatalogueAnime["episodes"][number];
type Source = Episode["sources"][number];
function durationLabel(seconds: number | null) { if (!seconds) return null; const minutes=Math.floor(seconds/60);return `${minutes}:${String(seconds%60).padStart(2,"0")}`; }
function variantKey(source: Source){return [source.language??"Unknown",source.audioType??"Sub",source.region??"Global"].join("|")}
function variantLabel(source: Source){return [source.language,source.audioType,source.region].filter(Boolean).join(" · ")||"Official source"}

export function EpisodePlayer({ episodes }: { episodes: Episode[] }) {
  const variants=useMemo(()=>{const map=new Map<string,Source>();for(const episode of episodes)for(const source of episode.sources)if(!map.has(variantKey(source)))map.set(variantKey(source),source);return [...map.entries()]},[episodes]);
  const [variant,setVariant]=useState(variants[0]?.[0]??"");
  const playable=episodes.filter(episode=>episode.sources.some(source=>variantKey(source)===variant));
  const [selectedNumber,setSelectedNumber]=useState<number|null>(playable[0]?.episodeNumber??null);
  const selected=playable.find(e=>e.episodeNumber===selectedNumber)??playable[0]??null;
  const source=selected?.sources.find(item=>variantKey(item)===variant);
  if (!variants.length) return <div className="episodeEmpty"><strong>No official episodes available yet</strong><p>This title is saved in the catalogue. Check back after official releases are added.</p></div>;
  return <>
    {variants.length>1&&<div className="variantTabs" role="tablist" aria-label="Language and audio version">{variants.map(([key,item])=><button key={key} role="tab" aria-selected={variant===key} className={variant===key?"selected":""} onClick={()=>{setVariant(key);const first=episodes.find(e=>e.sources.some(s=>variantKey(s)===key));setSelectedNumber(first?.episodeNumber??null)}}>{variantLabel(item)}</button>)}</div>}
    {selected&&source&&<section className="playerShell" aria-label={`Playing episode ${selected.episodeNumber}`}><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.videoId)}?rel=0`} title={`Episode ${selected.episodeNumber} official YouTube player`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/><div className="playerMeta"><div><span className="eyebrow">Now playing · {variantLabel(source)}</span><h3>Episode {selected.episodeNumber}</h3></div><p>Official upload by {source.channelName??"YouTube"}</p></div></section>}
    <ol className="episodeGrid">{playable.map(episode=>{const item=episode.sources.find(source=>variantKey(source)===variant)!;return <li key={`${episode.id}-${variant}`}><button type="button" className={selected?.episodeNumber===episode.episodeNumber?"selected":""} onClick={()=>{setSelectedNumber(episode.episodeNumber);document.querySelector('.playerShell')?.scrollIntoView({behavior:'smooth',block:'start'})}}><span className="episodeThumb">{item.thumbnailUrl&&<img src={item.thumbnailUrl} alt=""/>}<b>▶</b></span><span className="episodeCardCopy"><strong>Episode {episode.episodeNumber}</strong><small>{durationLabel(episode.durationSeconds)} · {item.channelName??"YouTube"}</small></span></button></li>})}</ol>
  </>;
}
