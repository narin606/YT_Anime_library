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

interface SearchResponse {
  items: AnimeSearchItem[];
}

export async function searchAnime(query: string): Promise<AnimeSearchItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("The catalogue API is not configured.");
  }

  const response = await fetch(`${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}`);
  const payload = (await response.json().catch(() => null)) as SearchResponse | { error?: { message?: string } } | null;
  if (!response.ok) {
    throw new Error(payload && "error" in payload ? payload.error?.message ?? "Search failed." : "Search failed.");
  }
  if (!payload || !("items" in payload) || !Array.isArray(payload.items)) {
    throw new Error("The catalogue returned an unexpected response.");
  }
  return payload.items;
}
