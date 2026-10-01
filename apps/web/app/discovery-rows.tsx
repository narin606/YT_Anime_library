"use client";

import { useEffect, useState } from "react";

import { episodeLabel, getDiscovery, importAnime, type AnimeSearchItem, type CatalogueAnime, type DiscoveryResult } from "../lib/anime";

function titleFor(anime: AnimeSearchItem | CatalogueAnime) { return anime.title.english ?? anime.title.romaji; }
function availableEpisodes(anime: CatalogueAnime) { return anime.episodes.filter(episode => episode.sources.length > 0).length; }

function CoverCard({ anime, badge, onClick, disabled }: { anime: AnimeSearchItem | CatalogueAnime; badge: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="discoveryCard" onClick={onClick} disabled={disabled} aria-label={`${badge}: ${titleFor(anime)}`}>
    <span className="discoveryCover">{anime.coverImageUrl && <img src={anime.coverImageUrl} alt="" />}<b>{badge}</b></span>
    <span className="discoveryCopy"><strong>{titleFor(anime)}</strong><small>{[anime.seasonYear, episodeLabel(anime.episodeCount)].filter(Boolean).join(" · ") || "Explore details"}</small><span>{anime.genres.slice(0, 2).join(" · ")}</span></span>
  </button>;
}

export function DiscoveryRows() {
  const [data, setData] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState<number | null>(null);
  useEffect(() => { getDiscovery().then(setData).catch(reason => setError(reason instanceof Error ? reason.message : "Discovery is unavailable.")); }, []);
  async function add(anime: AnimeSearchItem) { setAdding(anime.anilistId); try { const stored = await importAnime(anime.anilistId); window.location.assign(`/anime/${stored.id}`); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add this anime."); setAdding(null); } }
  if (error) return <section className="homeDiscovery" id="library"><p className="status error" role="status">{error}</p></section>;
  if (!data) return <section className="homeDiscovery" id="library" aria-label="Loading recommendations"><div className="discoverySkeleton" /><div className="discoverySkeleton" /></section>;
  const rows = [
    { key: "playable", eyebrow: "Ready now", title: "Available to watch", description: "Verified official YouTube episodes you can start immediately.", items: data.playable, stored: true },
    { key: "recent", eyebrow: "Your catalogue", title: "Recently added", description: "Titles most recently saved to this library.", items: data.recent, stored: true },
    { key: "popular", eyebrow: `${data.season} ${data.seasonYear}`, title: "Popular this season", description: "Discover what is popular on AniList. Add a title to check for official releases.", items: data.popular, stored: false }
  ];
  return <section className="homeDiscovery" id="library" aria-label="Anime discovery">
    {rows.map(row => row.items.length > 0 && <section className="discoveryRow" key={row.key} aria-labelledby={`${row.key}-heading`}><div className="sectionHeading"><div><span className="eyebrow">{row.eyebrow}</span><h2 id={`${row.key}-heading`}>{row.title}</h2></div><p>{row.description}</p></div><div className="discoveryRail">{row.items.map(anime => {const stored=anime as CatalogueAnime; const badge=row.key==="playable"?`${availableEpisodes(stored)} eps`:row.stored?"Open":"Add";return <CoverCard key={row.stored?stored.id:anime.anilistId} anime={anime} badge={badge} disabled={adding!==null} onClick={()=>row.stored?window.location.assign(`/anime/${stored.id}`):add(anime as AnimeSearchItem)} />})}</div></section>)}
  </section>;
}
