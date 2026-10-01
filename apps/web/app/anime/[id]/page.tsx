import { notFound } from "next/navigation";

import { episodeLabel, getAnime } from "../../../lib/anime";

export default async function AnimeDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let anime;
  try { anime = await getAnime(id); }
  catch { notFound(); }
  const title = anime.title.english ?? anime.title.romaji;
  return <main className="detailPage">
    <header className="topbar">
      <a className="brand" href="/" aria-label="YT Anime Library home"><span className="brandMark">遊</span><span><strong>YT Anime Library</strong><small>Official sources. One library.</small></span></a>
      <nav aria-label="Main navigation"><a href="/">Catalogue</a><a className="signInLink" href="/login">Sign in</a></nav>
    </header>
    <section className="detailHero" style={anime.bannerImageUrl ? { backgroundImage: `linear-gradient(90deg, rgba(9,8,13,.96), rgba(9,8,13,.66)), url(${anime.bannerImageUrl})` } : undefined}>
      <div className="detailCover">{anime.coverImageUrl ? <img src={anime.coverImageUrl} alt={`${title} cover`} /> : <span>No cover</span>}</div>
      <div className="detailCopy"><span className="eyebrow">Stored catalogue</span><h1>{title}</h1><p className="detailMeta">{[anime.seasonYear, anime.season?.replaceAll("_", " "), episodeLabel(anime.episodeCount)].filter(Boolean).join(" · ")}</p><div className="genres">{anime.genres.map(genre => <span key={genre}>{genre}</span>)}</div><p className="synopsis">{anime.synopsis ?? "Synopsis is not available yet."}</p>{anime.studios.length > 0 && <p className="studioLine">Studio: {anime.studios.join(", ")}</p>}</div>
    </section>
    <section className="episodeSection"><div className="sectionHeading"><div><span className="eyebrow">Official YouTube releases</span><h2>Episodes</h2></div><p>Episodes appear here after an official source has been reviewed and mapped.</p></div>{anime.episodes.length ? <ol className="episodeList">{anime.episodes.map(episode => <li key={episode.id}><span>Episode {episode.episodeNumber}</span><strong>{episode.title ?? `Episode ${episode.episodeNumber}`}</strong></li>)}</ol> : <div className="episodeEmpty"><strong>No mapped episodes yet</strong><p>This anime is in the catalogue. Official YouTube source mapping is the next pipeline stage.</p></div>}</section>
  </main>;
}
