import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { episodeLabel, getAnime } from "../../../lib/anime";
import { EpisodePlayer } from "./episode-player";

export default async function AnimeDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let anime;
  const cookie = (await cookies()).toString();
  if (!cookie.includes("yt_anime_session=")) redirect(`/login?next=${encodeURIComponent(`/anime/${id}`)}&reason=signin_required`);
  try { anime = await getAnime(id, cookie); }
  catch (error) {
    if (error instanceof Error && error.message === "Sign in to view this anime.") redirect(`/login?next=${encodeURIComponent(`/anime/${id}`)}&reason=signin_required`);
    notFound();
  }
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
    <section className="episodeSection"><div className="sectionHeading"><div><span className="eyebrow">Official YouTube releases</span><h2>Episodes</h2></div><p>Choose an episode and watch the official upload without leaving the library.</p></div><EpisodePlayer episodes={anime.episodes} /></section>
  </main>;
}
