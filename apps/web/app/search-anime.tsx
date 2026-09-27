"use client";

import { FormEvent, useState } from "react";

import { type AnimeSearchItem, searchAnime } from "../lib/anime";

function titleFor(anime: AnimeSearchItem) {
  return anime.title.english ?? anime.title.romaji;
}

export function SearchAnime() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AnimeSearchItem[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    if (normalized.length < 2) {
      setState("error");
      setMessage("Enter at least two characters.");
      return;
    }

    setState("loading");
    setMessage("");
    try {
      const results = await searchAnime(normalized);
      setItems(results);
      setState("success");
      if (!results.length) setMessage("No anime matched that title.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Search failed.");
    }
  }

  return (
    <section className="discovery" id="discover" aria-labelledby="discover-heading">
      <div className="sectionHeading">
        <div>
          <span className="eyebrow">AniList discovery</span>
          <h2 id="discover-heading">Search the anime catalogue</h2>
        </div>
        <p>Find canonical titles and metadata now. Official YouTube episode mapping comes next.</p>
      </div>

      <form className="searchForm" onSubmit={submit}>
        <label className="srOnly" htmlFor="anime-query">Anime title</label>
        <input
          id="anime-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Frieren, One Piece, or Spy x Family"
          autoComplete="off"
        />
        <button disabled={state === "loading"} type="submit">
          {state === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      {message && <p className={state === "error" ? "status error" : "status"}>{message}</p>}
      {state === "loading" && <div className="resultGrid" aria-label="Loading results">
        {[1, 2, 3, 4].map((item) => <div className="animeCard skeleton" key={item} />)}
      </div>}
      {state !== "loading" && items.length > 0 && (
        <div className="resultGrid">
          {items.map((anime) => (
            <article className="animeCard" key={anime.anilistId}>
              <a href={anime.anilistUrl} target="_blank" rel="noreferrer" aria-label={`View ${titleFor(anime)} on AniList`}>
                <div className="cover" style={{ backgroundColor: anime.coverColor ?? "#202635" }}>
                  {anime.coverImageUrl && <img src={anime.coverImageUrl} alt="" />}
                  <span>{anime.status?.replaceAll("_", " ") ?? "ANIME"}</span>
                </div>
                <div className="cardBody">
                  <h3>{titleFor(anime)}</h3>
                  <p className="meta">
                    {[anime.seasonYear, anime.episodeCount ? `${anime.episodeCount} episodes` : null]
                      .filter(Boolean)
                      .join(" · ") || "Details available on AniList"}
                  </p>
                  <div className="genres">{anime.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div>
                </div>
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
