import type { PrismaClient } from "@prisma/client";
import { fetchChannelInventory } from "./youtube.js";

export const TRUSTED_CHANNELS = [
  { handle: "MuseAsia", name: "Muse Asia", channelId: "UCGbshtvS9t-8CW11W7TooQg" },
  { handle: "AniOneAsia", name: "Ani-One Asia", channelId: "UC0wNSTMWIL3qaorLx0jie6A" },
  { handle: "TropicsAnimeAsia", name: "Tropics Anime Asia", channelId: "UCC-g5hWSvCbdB8HQQIA0_pg" }
] as const;

export async function syncTrustedChannel(prisma: PrismaClient, apiKey: string, trusted: typeof TRUSTED_CHANNELS[number]) {
  const inventory = await fetchChannelInventory(apiKey, trusted.channelId);
  if (inventory.channel.title !== trusted.name) throw new Error(`Approved channel identity changed for ${trusted.handle}`);
  const syncedAt = new Date();
  const channel = await prisma.approvedChannel.upsert({
    where: { externalChannelId: trusted.channelId },
    create: { externalChannelId: trusted.channelId, name: trusted.name, handle: trusted.handle, uploadsPlaylistId: inventory.channel.uploadsPlaylistId, lastSyncedAt: syncedAt },
    update: { name: trusted.name, handle: trusted.handle, uploadsPlaylistId: inventory.channel.uploadsPlaylistId, enabled: true, lastSyncedAt: syncedAt }
  });
  await prisma.$transaction(async tx => {
    await tx.discoveredPlaylist.updateMany({ where: { approvedChannelId: channel.id }, data: { active: false } });
    for (const item of inventory.playlists) await tx.discoveredPlaylist.upsert({
      where: { externalPlaylistId: item.id },
      create: { approvedChannelId: channel.id, externalPlaylistId: item.id, title: item.title, itemCount: item.itemCount, thumbnailUrl: item.thumbnailUrl, publishedAt: item.publishedAt ? new Date(item.publishedAt) : null, classification: item.classification, lastSeenAt: syncedAt },
      update: { approvedChannelId: channel.id, title: item.title, itemCount: item.itemCount, thumbnailUrl: item.thumbnailUrl, publishedAt: item.publishedAt ? new Date(item.publishedAt) : null, classification: item.classification, active: true, lastSeenAt: syncedAt }
    });
  });
  const counts = inventory.playlists.reduce((result, item) => ({ ...result, [item.classification]: result[item.classification] + 1 }), { LIKELY_SERIES: 0, REVIEW: 0, EXCLUDED: 0 });
  return { channelId: trusted.channelId, name: trusted.name, playlistCount: inventory.playlists.length, counts };
}
