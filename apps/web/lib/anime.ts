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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("The catalogue API is not configured.");

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
