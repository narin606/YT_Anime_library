"use client";

import { useEffect, useState } from "react";

import { type ViewerAccount } from "../lib/auth";
import { episodeLabel, getDiscovery, groupPlayableByGenre, type AnimeSearchItem, type CatalogueAnime, type DiscoveryResult } from "../lib/anime";
import { loginPath } from "../lib/navigation";

function titleFor(anime: AnimeSearchItem | CatalogueAnime) { return anime.title.english ?? anime.title.romaji; }
function availableEpisodes(anime: CatalogueAnime) { return anime.episodes.filter(episode => episode.sources.length > 0).length; }

function CoverCard({ anime, badge, onClick, disabled }: { anime: AnimeSearchItem | CatalogueAnime; badge: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="discoveryCard" onClick={onClick} disabled={disabled} aria-label={`${badge}: ${titleFor(anime)}`}>
    <span className="discoveryCover">{anime.coverImageUrl && <img src={anime.coverImageUrl} alt="" />}<b>{badge}</b></span>
    <span className="discoveryCopy"><strong>{titleFor(anime)}</strong><small>{[anime.seasonYear, episodeLabel(anime.episodeCount)].filter(Boolean).join(" · ") || "Explore details"}</small><span>{anime.genres.slice(0, 2).join(" · ")}</span></span>
  </button>;
}

export function DiscoveryRows({ viewer, authReady }: { viewer: ViewerAccount | null; authReady: boolean }) {
  const [data, setData] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getDiscovery().then(setData).catch(reason => setError(reason instanceof Error ? reason.message : "Discovery is unavailable.")); }, []);
  if (error) return <section className="homeDiscovery" id="library"><p className="status error" role="status">{error}</p></section>;
  if (!data) return <section className="homeDiscovery" id="library" aria-label="Loading recommendations"><div className="discoverySkeleton" /><div className="discoverySkeleton" /></section>;

  const rows = [
    ...groupPlayableByGenre(data.playable).map(({ genre, anime }) => ({ key: `genre-${genre}`, eyebrow: "Browse by genre", title: genre, description: `Available series tagged ${genre} by AniList.`, items: anime, stored: true })),
    { key: "recent", eyebrow: "Catalogue", title: "Recently added", description: "Titles most recently added to the catalogue.", items: data.recent, stored: true },
    { key: "popular", eyebrow: `${data.season} ${data.seasonYear}`, title: "More to discover", description: "Popular AniList titles shown for reference.", items: data.popular, stored: false }
  ];

  return <section className="homeDiscovery" id="library" aria-label="Anime discovery">
    {rows.map(row => row.items.length > 0 && <section className="discoveryRow" key={row.key} aria-labelledby={`${row.key}-heading`}>
      <div className="sectionHeading"><div><span className="eyebrow">{row.eyebrow}</span><h2 id={`${row.key}-heading`}>{row.title}</h2></div><p>{row.description}<span className="swipeCue"> Swipe to browse →</span></p></div>
      <div className="discoveryRail">{row.items.map(anime => {
        const stored = anime as CatalogueAnime;
        const count = row.stored ? availableEpisodes(stored) : 0;
        const badge = !row.stored ? "Reference" : count > 0 ? `${count} available` : "Catalogue";
        return <CoverCard key={row.stored ? stored.id : anime.anilistId} anime={anime} badge={badge} disabled={!authReady || !row.stored} onClick={() => {
          if (!row.stored) return;
          const destination = `/anime/${stored.id}`;
          window.location.assign(viewer ? destination : loginPath(destination));
        }} />;
      })}</div>
    </section>)}
  </section>;
}
