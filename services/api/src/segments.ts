import type { PrismaClient } from "@prisma/client";
import { fetchApprovedPlaylist } from "./youtube.js";

export type PlaylistSegmentInput = { animeId: string; sourceEpisodeStart: number; sourceEpisodeEnd: number; animeEpisodeStart: number };

export function validatePlaylistSegments(segments: PlaylistSegmentInput[]) {
  const ordered = [...segments].sort((a,b)=>a.sourceEpisodeStart-b.sourceEpisodeStart);
  for (let i=0;i<ordered.length;i++) {
    const item=ordered[i];
    if (item.sourceEpisodeStart<1||item.sourceEpisodeEnd<item.sourceEpisodeStart||item.animeEpisodeStart<1) throw new Error("Invalid playlist segment range");
    if (i>0&&ordered[i-1].sourceEpisodeEnd>=item.sourceEpisodeStart) throw new Error("Playlist segment ranges overlap");
  }
  return ordered;
}

export function localEpisodeNumber(sourceEpisodeNumber:number, segment:PlaylistSegmentInput){
  return segment.animeEpisodeStart+(sourceEpisodeNumber-segment.sourceEpisodeStart);
}

export async function ingestSegmentedPlaylist(prisma:PrismaClient,youtubeKey:string,playlistId:string,segments:PlaylistSegmentInput[]){
  const discovered=await prisma.discoveredPlaylist.findUnique({where:{externalPlaylistId:playlistId},include:{approvedChannel:true}});
  if(!discovered) throw new Error("Playlist is not in the approved inventory");
  const ordered=validatePlaylistSegments(segments);
  const animeCount=await prisma.anime.count({where:{id:{in:ordered.map(x=>x.animeId)}}});
  if(animeCount!==ordered.length) throw new Error("One or more segment anime records do not exist");
  const playlist=await fetchApprovedPlaylist(youtubeKey,playlistId,discovered.approvedChannel.externalChannelId);
  const covered=playlist.episodes.filter(item=>ordered.some(s=>item.episodeNumber>=s.sourceEpisodeStart&&item.episodeNumber<=s.sourceEpisodeEnd));
  if(covered.length!==playlist.episodes.length) throw new Error("Playlist segments do not cover every valid numbered episode");
  const provider=await prisma.videoProvider.upsert({where:{type_externalChannelId:{type:"YOUTUBE",externalChannelId:discovered.approvedChannel.externalChannelId}},create:{type:"YOUTUBE",name:"YouTube",externalChannelId:discovered.approvedChannel.externalChannelId,externalChannelName:discovered.approvedChannel.name},update:{externalChannelName:discovered.approvedChannel.name,enabled:true}});
  await prisma.$transaction(async tx=>{
    await tx.playlistAnimeSegment.deleteMany({where:{discoveredPlaylistId:discovered.id}});
    for(const segment of ordered){
      await tx.playlistAnimeSegment.create({data:{discoveredPlaylistId:discovered.id,...segment}});
      for(const item of playlist.episodes.filter(x=>x.episodeNumber>=segment.sourceEpisodeStart&&x.episodeNumber<=segment.sourceEpisodeEnd)){
        const number=localEpisodeNumber(item.episodeNumber,segment);
        const episode=await tx.episode.upsert({where:{animeId_seasonNumber_episodeNumber:{animeId:segment.animeId,seasonNumber:1,episodeNumber:number}},create:{animeId:segment.animeId,seasonNumber:1,episodeNumber:number,title:`Episode ${number}`,durationSeconds:item.durationSeconds},update:{durationSeconds:item.durationSeconds}});
        await tx.videoSource.upsert({where:{externalVideoId:item.id},create:{episodeId:episode.id,providerId:provider.id,discoveredPlaylistId:discovered.id,externalVideoId:item.id,titleRaw:item.title,thumbnailUrl:item.thumbnailUrl,publishedAt:item.publishedAt?new Date(item.publishedAt):null,language:discovered.language??"English",audioType:discovered.audioType??"Sub",region:discovered.region??"Asia",embeddable:true,availabilityStatus:"AVAILABLE",lastCheckedAt:new Date()},update:{episodeId:episode.id,providerId:provider.id,discoveredPlaylistId:discovered.id,titleRaw:item.title,thumbnailUrl:item.thumbnailUrl,language:discovered.language??"English",audioType:discovered.audioType??"Sub",region:discovered.region??"Asia",embeddable:true,availabilityStatus:"AVAILABLE",lastCheckedAt:new Date()}});
      }
    }
    await tx.discoveredPlaylist.update({where:{id:discovered.id},data:{animeId:null,language:discovered.language??"English",audioType:discovered.audioType??"Sub",region:discovered.region??"Asia",matchConfidence:1,matchReason:"Manually segmented across multiple AniList entries"}});
  },{timeout:120000});
  return {playlistId,sourceEpisodeCount:playlist.episodes.length,segments:ordered.length};
}
