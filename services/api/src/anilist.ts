import { z } from "zod";

const MEDIA_FIELDS = `
  id
  title { english romaji native }
  description(asHtml: false)
  season
  seasonYear
  status
  episodes
  genres
  studios(isMain: true) { nodes { name } }
  coverImage { extraLarge large color }
  bannerImage
  siteUrl
`;
const ANIME_SEARCH_QUERY = `query AnimeSearch($search: String!, $page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) { pageInfo { currentPage hasNextPage } media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} } }
}`;
const ANIME_BY_ID_QUERY = `query AnimeById($id: Int!) {
  Page(page: 1, perPage: 1) { pageInfo { currentPage hasNextPage } media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }
}`;

const animeSchema = z.object({
  id: z.number().int().positive(),
  title: z.object({
    english: z.string().nullable(),
    romaji: z.string().min(1),
    native: z.string().nullable()
  }),
  description: z.string().nullable(),
  season: z.string().nullable(),
  seasonYear: z.number().int().nullable(),
  status: z.string().nullable(),
  episodes: z.number().int().positive().nullable(),
  genres: z.array(z.string()),
  studios: z.object({ nodes: z.array(z.object({ name: z.string() })) }),
  coverImage: z.object({
    extraLarge: z.string().url().nullable(),
    large: z.string().url().nullable(),
    color: z.string().nullable()
  }),
  bannerImage: z.string().url().nullable(),
  siteUrl: z.string().url()
});

const responseSchema = z.object({
  data: z.object({
    Page: z.object({
      pageInfo: z.object({ currentPage: z.number().int(), hasNextPage: z.boolean() }),
      media: z.array(animeSchema)
    })
  }).nullable(),
  errors: z.array(z.object({ message: z.string() })).optional()
});

export interface AnimeSearchItem {
  anilistId: number;
  title: { english: string | null; romaji: string; native: string | null };
  synopsis: string | null;
  season: string | null;
  seasonYear: number | null;
  status: string | null;
  episodeCount: number | null;
  genres: string[];
  studios: string[];
  coverImageUrl: string | null;
  coverColor: string | null;
  bannerImageUrl: string | null;
  anilistUrl: string;
}

export interface AnimeSearchResult {
  items: AnimeSearchItem[];
  pageInfo: { currentPage: number; hasNextPage: boolean };
}

export class AniListError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "AniListError";
  }
}

function normalizeAnime(anime: z.infer<typeof animeSchema>): AnimeSearchItem {
  return {
    anilistId: anime.id,
    title: anime.title,
    synopsis: anime.description,
    season: anime.season,
    seasonYear: anime.seasonYear,
    status: anime.status,
    episodeCount: anime.episodes,
    genres: anime.genres,
    studios: anime.studios.nodes.map((studio) => studio.name),
    coverImageUrl: anime.coverImage.extraLarge ?? anime.coverImage.large,
    coverColor: anime.coverImage.color,
    bannerImageUrl: anime.bannerImage,
    anilistUrl: anime.siteUrl
  };
}

export async function searchAnime(
  apiUrl: string,
  search: string,
  page = 1,
  perPage = 12,
  fetcher: typeof fetch = fetch
): Promise<AnimeSearchResult> {
  let response: Response;
  try {
    response = await fetcher(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: ANIME_SEARCH_QUERY, variables: { search, page, perPage } }),
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    throw new AniListError("AniList could not be reached. Try again shortly.");
  }

  if (!response.ok) {
    throw new AniListError(`AniList returned HTTP ${response.status}.`, response.status === 429 ? 503 : 502);
  }

  let parsed: z.infer<typeof responseSchema>;
  try {
    parsed = responseSchema.parse(await response.json());
  } catch {
    throw new AniListError("AniList returned an unexpected response.");
  }

  if (parsed.errors?.length || !parsed.data) {
    throw new AniListError(parsed.errors?.[0]?.message ?? "AniList search failed.");
  }

  const pageData = parsed.data.Page;
  return {
    pageInfo: pageData.pageInfo,
    items: pageData.media.map(normalizeAnime)
  };
}

export async function fetchAnimeById(apiUrl: string, id: number, fetcher: typeof fetch = fetch): Promise<AnimeSearchItem | null> {
  let response: Response;
  try {
    response = await fetcher(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: ANIME_BY_ID_QUERY, variables: { id } }),
      signal: AbortSignal.timeout(10_000)
    });
  } catch { throw new AniListError("AniList could not be reached. Try again shortly."); }
  if (!response.ok) throw new AniListError(`AniList returned HTTP ${response.status}.`, response.status === 429 ? 503 : 502);
  let parsed: z.infer<typeof responseSchema>;
  try { parsed = responseSchema.parse(await response.json()); }
  catch { throw new AniListError("AniList returned an unexpected response."); }
  if (parsed.errors?.length || !parsed.data) throw new AniListError(parsed.errors?.[0]?.message ?? "AniList lookup failed.");
  const anime = parsed.data.Page.media[0];
  return anime ? normalizeAnime(anime) : null;
}
