export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 120;

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

export interface CatalogueAnime extends Omit<AnimeSearchItem, "coverColor" | "anilistUrl"> {
  id: string;
  episodes: Array<{ id: string; seasonNumber: number; episodeNumber: number; title: string | null; durationSeconds: number | null; sources: Array<{ provider: "YOUTUBE"; videoId: string; thumbnailUrl: string | null; channelName: string | null; embeddable: boolean | null; availabilityStatus: string }> }>;
}

function apiBaseUrl(override?: string) {
  const value = override ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!value) throw new Error("The catalogue API is not configured.");
  return value.replace(/\/$/, "");
}

export function validateSearchQuery(query: string): string | null {
  const length = query.trim().length;
  if (length < MIN_SEARCH_LENGTH) return "Enter at least two characters.";
  if (length > MAX_SEARCH_LENGTH) return "Use 120 characters or fewer.";
  return null;
}

export function episodeLabel(count: number | null): string | null {
  if (count === null) return null;
  return `${count} ${count === 1 ? "episode" : "episodes"}`;
}

export async function searchAnime(query: string, page = 1, signal?: AbortSignal): Promise<AnimeSearchResult> {
  const baseUrl = apiBaseUrl();

  const params = new URLSearchParams({ q: query, page: String(page), perPage: "12" });
  const response = await fetch(`${baseUrl}/api/v1/search?${params}`, { signal });
  const payload = (await response.json().catch(() => null)) as AnimeSearchResult | { error?: { message?: string } } | null;
  if (!response.ok) {
    throw new Error(payload && "error" in payload ? payload.error?.message ?? "Search failed." : "Search failed.");
  }
  if (!payload || !("items" in payload) || !Array.isArray(payload.items) || !("pageInfo" in payload)) {
    throw new Error("The catalogue returned an unexpected response.");
  }
  if (!Number.isInteger(payload.pageInfo.currentPage) || typeof payload.pageInfo.hasNextPage !== "boolean") {
    throw new Error("The catalogue returned invalid pagination data.");
  }
  return payload;
}

export async function importAnime(anilistId: number, fetcher: typeof fetch = fetch, baseUrl?: string): Promise<CatalogueAnime> {
  const response = await fetcher(`${apiBaseUrl(baseUrl)}/api/v1/anime/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anilistId })
  });
  const payload = await response.json().catch(() => null) as { anime?: CatalogueAnime; error?: { message?: string } } | null;
  if (!response.ok || !payload?.anime) throw new Error(payload?.error?.message ?? "Could not add this anime.");
  return payload.anime;
}

export async function getAnime(id: string): Promise<CatalogueAnime> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/anime/${encodeURIComponent(id)}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as { anime?: CatalogueAnime; error?: { message?: string } } | null;
  if (!response.ok || !payload?.anime) throw new Error(payload?.error?.message ?? "Anime not found.");
  return payload.anime;
}

export interface DiscoveryResult {
  playable: CatalogueAnime[];
  recent: CatalogueAnime[];
  popular: AnimeSearchItem[];
  byDistributor: Record<"Muse Asia" | "Ani-One Asia" | "Tropics Anime Asia", CatalogueAnime[]>;
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL";
  seasonYear: number;
}

export async function getDiscovery(fetcher: typeof fetch = fetch, baseUrl?: string): Promise<DiscoveryResult> {
  const response = await fetcher(`${apiBaseUrl(baseUrl)}/api/v1/discovery`);
  const payload = await response.json().catch(() => null) as DiscoveryResult | { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(payload && "error" in payload ? payload.error?.message ?? "Discovery failed." : "Discovery failed.");
  if (!payload || !("playable" in payload)) throw new Error("Discovery returned an unexpected response.");
  if (!Array.isArray(payload.playable) || !Array.isArray(payload.recent) || !Array.isArray(payload.popular) || !payload.byDistributor || !["Muse Asia", "Ani-One Asia", "Tropics Anime Asia"].every(name => Array.isArray(payload.byDistributor[name as keyof typeof payload.byDistributor])) || !["WINTER","SPRING","SUMMER","FALL"].includes(payload.season) || !Number.isInteger(payload.seasonYear)) throw new Error("Discovery returned an unexpected response.");
  return payload;
}
