"use client";

import { FormEvent, useRef, useState } from "react";

import {
  episodeLabel,
  importAnime,
  type AnimeSearchItem,
  searchAnime,
  validateSearchQuery
} from "../lib/anime";
import { type ViewerAccount } from "../lib/auth";
import { loginPath } from "../lib/navigation";

function titleFor(anime: AnimeSearchItem) {
  return anime.title.english ?? anime.title.romaji;
}

export function SearchAnime({ viewer, authReady }: { viewer: ViewerAccount | null; authReady: boolean }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AnimeSearchItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "loadingMore" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  async function runSearch(normalized: string, nextPage: number, append: boolean) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setState(append ? "loadingMore" : "loading");
    setMessage(append ? `Loading page ${nextPage}…` : "Searching anime catalogue…");
    try {
      const result = await searchAnime(normalized, nextPage, controller.signal);
      setItems(current => append ? [...current, ...result.items] : result.items);
      setPage(result.pageInfo.currentPage);
      setHasNextPage(result.pageInfo.hasNextPage);
      setState("success");
      setMessage(result.items.length ? (append ? `Page ${nextPage} added.` : `${result.items.length} results found.`) : "No anime matched that title.");
    } catch (error) {
      if (controller.signal.aborted) return;
      if (!append) setItems([]);
      setState("error");
      setMessage(error instanceof Error ? error.message : "Search failed.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    const validation = validateSearchQuery(normalized);
    if (validation) {
      requestRef.current?.abort();
      setItems([]);
      setPage(0);
      setHasNextPage(false);
      setState("error");
      setMessage(validation);
      return;
    }
    await runSearch(normalized, 1, false);
  }

  async function addToLibrary(anime: AnimeSearchItem) {
    if (!authReady) return;
    if (!viewer) {
      window.location.assign(loginPath(`/?search=${encodeURIComponent(titleFor(anime))}`));
      return;
    }
    setAddingId(anime.anilistId);
    setMessage(`Adding ${titleFor(anime)} to the library…`);
    try {
      const stored = await importAnime(anime.anilistId);
      window.location.assign(`/anime/${stored.id}`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Could not add this anime.");
      setAddingId(null);
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
        <span className="srOnly" id="search-limits">Use between 2 and 120 characters.</span>
        <input
          id="anime-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Frieren, One Piece, or Spy x Family"
          autoComplete="off"
          aria-describedby="search-limits search-status"
        />
        <button disabled={state === "loading" || state === "loadingMore"} type="submit">
          {state === "loading" ? "Searching…" : "Search"}
        </button>
      </form>

      <p id="search-status" className={state === "error" ? "status error" : "status"} role="status" aria-live="polite" aria-atomic="true">
        {message}
      </p>
      {state === "loading" && <div className="resultGrid" aria-label="Loading results">
        {[1, 2, 3, 4].map((item) => <div className="animeCard skeleton" key={item} />)}
      </div>}
      {state !== "loading" && items.length > 0 && (
        <>
          <div className="resultGrid" aria-label="Anime search results">
            {items.map((anime) => (
              <article className="animeCard" key={anime.anilistId}>
                <button className="animeCardAction" type="button" disabled={!authReady || addingId !== null} onClick={() => addToLibrary(anime)} aria-label={viewer ? `Add ${titleFor(anime)} to the library` : `Sign in to view ${titleFor(anime)}`}>
                  <div className="cover" style={{ backgroundColor: anime.coverColor ?? "#202635" }}>
                    {anime.coverImageUrl && <img src={anime.coverImageUrl} alt="" />}
                    <span>{anime.status?.replaceAll("_", " ") ?? "ANIME"}</span>
                  </div>
                  <div className="cardBody">
                    <h3>{titleFor(anime)}</h3>
                    <p className="meta">
                      {[anime.seasonYear, episodeLabel(anime.episodeCount)]
                        .filter(Boolean)
                        .join(" · ") || "Details available on AniList"}
                    </p>
                    <div className="genres">{anime.genres.slice(0, 3).map((genre) => <span key={genre}>{genre}</span>)}</div>
                  </div>
                </button>
              </article>
            ))}
          </div>
          {hasNextPage && <div className="paginationActions">
            <button type="button" disabled={state === "loadingMore"} onClick={() => runSearch(query.trim(), page + 1, true)}>
              {state === "loadingMore" ? "Loading more…" : "Load more anime"}
            </button>
          </div>}
        </>
      )}
    </section>
  );
}
