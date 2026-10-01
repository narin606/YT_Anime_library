ALTER TABLE "VideoSource" ADD COLUMN "discoveredPlaylistId" TEXT;
CREATE INDEX "VideoSource_discoveredPlaylistId_idx" ON "VideoSource"("discoveredPlaylistId");
ALTER TABLE "VideoSource" ADD CONSTRAINT "VideoSource_discoveredPlaylistId_fkey" FOREIGN KEY ("discoveredPlaylistId") REFERENCES "DiscoveredPlaylist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
