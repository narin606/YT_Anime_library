import { z } from "zod";

export interface YouTubeVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  duration: string;
  embeddable: boolean;
  privacyStatus: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
}

export interface YouTubeEpisode extends YouTubeVideo {
  episodeNumber: number;
  durationSeconds: number;
}

export function parseEpisodeNumber(title: string): number | null {
  const match = title.match(/\bepisode\s*0*(\d{1,4})\b/i) ?? title.match(/#0*(\d{1,4})(?!\d)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function parseIsoDurationSeconds(value: string): number {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) throw new Error("YouTube returned an invalid duration");
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

export function validatePlaylistEpisodes(videos: YouTubeVideo[], approvedChannelId: string): YouTubeEpisode[] {
  if (videos.some(video => video.channelId !== approvedChannelId)) throw new Error("Playlist contains a video from an unexpected channel");
  const episodes = videos.flatMap(video => {
    if (/\b(previews?|trailers?|teasers?|promos?|promotional|pvs?)\b/i.test(video.title)) return [];
    const episodeNumber = parseEpisodeNumber(video.title);
    if (episodeNumber === null) return [];
    if (video.privacyStatus !== "public" || !video.embeddable) return [];
    const durationSeconds = parseIsoDurationSeconds(video.duration);
    if (durationSeconds <= 0) return [];
    return [{ ...video, episodeNumber, durationSeconds }];
  }).sort((a, b) => a.episodeNumber - b.episodeNumber);
  if (new Set(episodes.map(episode => episode.episodeNumber)).size !== episodes.length) throw new Error("Playlist contains duplicate episode numbers");
  return episodes;
}

export type PlaylistClassification = "LIKELY_SERIES" | "REVIEW" | "EXCLUDED";
export interface ChannelPlaylist { id: string; title: string; channelId: string; channelTitle: string; itemCount: number; publishedAt: string | null; thumbnailUrl: string | null; classification: PlaylistClassification }

export function classifyPlaylist(title: string, itemCount: number): PlaylistClassification {
  const normalized = title.toLowerCase();
  if (/\b(trailers?|teasers?|promos?|promotional|pvs?|clips?|shorts?|openings?|endings?|ost|songs?|highlights?|recaps?|compilations?|marathons?|livestreams?|live streams?)\b/.test(normalized)) return "EXCLUDED";
  if (itemCount >= 4 && /\b(english sub|eng sub|episode|episodes|full|season|anime)\b/i.test(title)) return "LIKELY_SERIES";
  if (itemCount >= 6) return "LIKELY_SERIES";
  return "REVIEW";
}

const channelResponseSchema = z.object({ items: z.array(z.object({ id: z.string(), snippet: z.object({ title: z.string(), customUrl: z.string().optional() }), contentDetails: z.object({ relatedPlaylists: z.object({ uploads: z.string() }) }) })) });
const channelPlaylistsResponseSchema = z.object({ nextPageToken: z.string().optional(), items: z.array(z.object({ id: z.string(), snippet: z.object({ title: z.string(), channelId: z.string(), channelTitle: z.string(), publishedAt: z.string().optional(), thumbnails: z.record(z.string(), z.object({ url: z.string().url() })).optional() }), contentDetails: z.object({ itemCount: z.number().int().nonnegative() }), status: z.object({ privacyStatus: z.string() }) })) });
const playlistResponseSchema = z.object({ items: z.array(z.object({ snippet: z.object({ title: z.string(), channelId: z.string(), channelTitle: z.string() }), contentDetails: z.object({ itemCount: z.number().int() }), status: z.object({ privacyStatus: z.string() }) })) });
const playlistItemsSchema = z.object({ nextPageToken: z.string().optional(), items: z.array(z.object({ contentDetails: z.object({ videoId: z.string() }) })) });
const videosResponseSchema = z.object({ items: z.array(z.object({ id: z.string(), snippet: z.object({ title: z.string(), channelId: z.string(), channelTitle: z.string(), publishedAt: z.string().optional(), thumbnails: z.record(z.string(), z.object({ url: z.string().url() })).optional() }), contentDetails: z.object({ duration: z.string().optional() }), status: z.object({ embeddable: z.boolean(), privacyStatus: z.string() }) })) });

async function youtubeGet(apiKey: string, resource: string, params: Record<string, string>, fetcher: typeof fetch) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetcher(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`YouTube API request failed with HTTP ${response.status}`);
  return response.json();
}

export async function fetchChannelInventory(credential: string, channelId: string, fetcher: typeof fetch = fetch) {
  const channelItems = channelResponseSchema.parse(await youtubeGet(credential, "channels", { part: "snippet,contentDetails", id: channelId }, fetcher)).items;
  const channel = channelItems.find(item => item.id === channelId);
  if (!channel) throw new Error("YouTube channel was not found or did not match the approved identity");
  const playlists: ChannelPlaylist[] = [];
  let pageToken: string | undefined;
  do {
    const page = channelPlaylistsResponseSchema.parse(await youtubeGet(credential, "playlists", { part: "snippet,contentDetails,status", channelId, maxResults: "50", ...(pageToken ? { pageToken } : {}) }, fetcher));
    playlists.push(...page.items.filter(item => item.snippet.channelId === channelId && item.status.privacyStatus === "public").map(item => ({
      id: item.id, title: item.snippet.title, channelId: item.snippet.channelId, channelTitle: item.snippet.channelTitle,
      itemCount: item.contentDetails.itemCount, publishedAt: item.snippet.publishedAt ?? null,
      thumbnailUrl: item.snippet.thumbnails?.maxres?.url ?? item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? null,
      classification: classifyPlaylist(item.snippet.title, item.contentDetails.itemCount)
    })));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return { channel: { id: channel.id, title: channel.snippet.title, customUrl: channel.snippet.customUrl ?? null, uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads }, playlists };
}

export async function fetchApprovedPlaylist(credential: string, playlistId: string, approvedChannelId: string, fetcher: typeof fetch = fetch) {
  const playlist = playlistResponseSchema.parse(await youtubeGet(credential, "playlists", { part: "snippet,contentDetails,status", id: playlistId }, fetcher)).items[0];
  if (!playlist) throw new Error("YouTube playlist was not found");
  if (playlist.snippet.channelId !== approvedChannelId) throw new Error("Playlist belongs to an unexpected channel");
  if (playlist.status.privacyStatus !== "public") throw new Error("YouTube playlist is not public");
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = playlistItemsSchema.parse(await youtubeGet(credential, "playlistItems", { part: "contentDetails", playlistId, maxResults: "50", ...(pageToken ? { pageToken } : {}) }, fetcher));
    ids.push(...page.items.map(item => item.contentDetails.videoId));
    pageToken = page.nextPageToken;
  } while (pageToken);
  const videos: YouTubeVideo[] = [];
  for (let index = 0; index < ids.length; index += 50) {
    const page = videosResponseSchema.parse(await youtubeGet(credential, "videos", { part: "snippet,contentDetails,status", id: ids.slice(index, index + 50).join(",") }, fetcher));
    videos.push(...page.items.filter(video => video.contentDetails.duration).map(video => ({ id: video.id, title: video.snippet.title, channelId: video.snippet.channelId, channelTitle: video.snippet.channelTitle, duration: video.contentDetails.duration!, embeddable: video.status.embeddable, privacyStatus: video.status.privacyStatus, thumbnailUrl: video.snippet.thumbnails?.maxres?.url ?? video.snippet.thumbnails?.high?.url ?? video.snippet.thumbnails?.medium?.url ?? null, publishedAt: video.snippet.publishedAt ?? null })));
  }
  return { playlistTitle: playlist.snippet.title, channelTitle: playlist.snippet.channelTitle, episodes: validatePlaylistEpisodes(videos, approvedChannelId) };
}
