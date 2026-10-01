import { animeCreateData, animeUpdateData } from "./catalog.js";
import { searchAnime, type AnimeSearchItem } from "./anilist.js";
import type { PrismaClient } from "@prisma/client";
import { matchPlaylistToAnime, playlistSearchTitle } from "./matching.js";
import { fetchApprovedPlaylist } from "./youtube.js";

export async function autoLinkAnime(prisma: PrismaClient, youtubeKey: string, animeId: string, item: AnimeSearchItem) {
  const candidates = await prisma.discoveredPlaylist.findMany({ where: { active: true, classification: "LIKELY_SERIES", approvedChannel: { enabled: true } }, include: { approvedChannel: true } });
  const matches = candidates.map(playlist => ({ playlist, match: matchPlaylistToAnime(playlist.title, playlist.itemCount, item) })).filter(result => result.match.publishable);
  const results: Array<{ playlistId: string; channelName: string; episodeCount: number }> = [];
  for (const { playlist, match } of matches) {
    const source = await fetchApprovedPlaylist(youtubeKey, playlist.externalPlaylistId, playlist.approvedChannel.externalChannelId);
    if (source.episodes.length < 4) { await prisma.discoveredPlaylist.update({ where: { id: playlist.id }, data: { classification: "REVIEW", matchConfidence: match.confidence, matchReason: "Fewer than four valid numbered episodes" } }); continue; }
    await prisma.$transaction(async tx => {
      const provider = await tx.videoProvider.upsert({ where: { type_externalChannelId: { type: "YOUTUBE", externalChannelId: playlist.approvedChannel.externalChannelId } }, create: { type: "YOUTUBE", name: "YouTube", externalChannelId: playlist.approvedChannel.externalChannelId, externalChannelName: playlist.approvedChannel.name }, update: { externalChannelName: playlist.approvedChannel.name, enabled: true } });
      for (const sourceItem of source.episodes) {
        const episode = await tx.episode.upsert({ where: { animeId_seasonNumber_episodeNumber: { animeId, seasonNumber: 1, episodeNumber: sourceItem.episodeNumber } }, create: { animeId, seasonNumber: 1, episodeNumber: sourceItem.episodeNumber, title: `Episode ${sourceItem.episodeNumber}`, durationSeconds: sourceItem.durationSeconds }, update: { durationSeconds: sourceItem.durationSeconds } });
        await tx.videoSource.upsert({ where: { externalVideoId: sourceItem.id }, create: { episodeId: episode.id, providerId: provider.id, externalVideoId: sourceItem.id, titleRaw: sourceItem.title, thumbnailUrl: sourceItem.thumbnailUrl, publishedAt: sourceItem.publishedAt ? new Date(sourceItem.publishedAt) : null, embeddable: true, availabilityStatus: "AVAILABLE", lastCheckedAt: new Date() }, update: { episodeId: episode.id, providerId: provider.id, titleRaw: sourceItem.title, thumbnailUrl: sourceItem.thumbnailUrl, embeddable: true, availabilityStatus: "AVAILABLE", lastCheckedAt: new Date() } });
      }
      await tx.discoveredPlaylist.update({ where: { id: playlist.id }, data: { animeId, matchConfidence: match.confidence, matchReason: match.reason } });
    });
    results.push({ playlistId: playlist.externalPlaylistId, channelName: playlist.approvedChannel.name, episodeCount: source.episodes.length });
  }
  return results;
}

export async function matchNextPlaylists(prisma: PrismaClient, anilistUrl: string, youtubeKey: string, limit = 20) {
  const playlists = await prisma.discoveredPlaylist.findMany({ where: { active: true, classification: "LIKELY_SERIES", animeId: null, matchConfidence: null }, include: { approvedChannel: true }, orderBy: [{ publishedAt: "desc" }, { id: "asc" }], take: limit });
  const output=[];
  for(const playlist of playlists){
    const query=playlistSearchTitle(playlist.title);
    const found=await searchAnime(anilistUrl,query,1,5);
    const ranked=found.items.map(item=>({item,match:matchPlaylistToAnime(playlist.title,playlist.itemCount,item)})).sort((a,b)=>b.match.confidence-a.match.confidence);
    const best=ranked[0];
    if(!best?.match.publishable){await prisma.discoveredPlaylist.update({where:{id:playlist.id},data:{matchConfidence:best?.match.confidence??0,matchReason:best?.match.reason??"No AniList candidates"}});output.push({playlistId:playlist.externalPlaylistId,title:query,status:"REVIEW"});continue;}
    const syncedAt=new Date();const anime=await prisma.anime.upsert({where:{anilistId:best.item.anilistId},create:animeCreateData(best.item,syncedAt),update:animeUpdateData(best.item,syncedAt)});
    const linked=await autoLinkAnime(prisma,youtubeKey,anime.id,best.item);
    output.push({playlistId:playlist.externalPlaylistId,title:query,status:linked.length?"LINKED":"REVIEW",animeId:anime.id,linked});
  }
  return output;
}
