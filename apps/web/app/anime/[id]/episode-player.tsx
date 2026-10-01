"use client";

import { useState } from "react";

import type { CatalogueAnime } from "../../../lib/anime";

type Episode = CatalogueAnime["episodes"][number];

function durationLabel(seconds: number | null) {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function EpisodePlayer({ episodes }: { episodes: Episode[] }) {
  const playable = episodes.filter(episode => episode.sources[0]);
  const [selected, setSelected] = useState(playable[0] ?? null);
  if (!playable.length) return <div className="episodeEmpty"><strong>No official episodes available yet</strong><p>This title is saved in the catalogue. Check back after official releases are added.</p></div>;
  const source = selected?.sources[0];
  return <>
    {selected && source && <section className="playerShell" aria-label={`Playing episode ${selected.episodeNumber}`}>
      <iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(source.videoId)}?rel=0`} title={`Episode ${selected.episodeNumber} official YouTube player`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      <div className="playerMeta"><div><span className="eyebrow">Now playing</span><h3>Episode {selected.episodeNumber}</h3></div><p>Official upload by {source.channelName ?? "YouTube"}</p></div>
    </section>}
    <ol className="episodeGrid">{playable.map(episode => {const item=episode.sources[0];return <li key={episode.id}><button type="button" className={selected?.id===episode.id?"selected":""} onClick={()=>{setSelected(episode);document.querySelector('.playerShell')?.scrollIntoView({behavior:'smooth',block:'start'})}}><span className="episodeThumb">{item.thumbnailUrl&&<img src={item.thumbnailUrl} alt="" />}<b>▶</b></span><span className="episodeCardCopy"><strong>Episode {episode.episodeNumber}</strong><small>{durationLabel(episode.durationSeconds)} · {item.channelName ?? "YouTube"}</small></span></button></li>})}</ol>
  </>;
}
