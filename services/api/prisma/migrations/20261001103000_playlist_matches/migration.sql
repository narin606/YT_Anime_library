ALTER TABLE "DiscoveredPlaylist" ADD COLUMN "animeId" TEXT;
ALTER TABLE "DiscoveredPlaylist" ADD COLUMN "matchConfidence" DOUBLE PRECISION;
ALTER TABLE "DiscoveredPlaylist" ADD COLUMN "matchReason" TEXT;
CREATE INDEX "DiscoveredPlaylist_animeId_idx" ON "DiscoveredPlaylist"("animeId");
ALTER TABLE "DiscoveredPlaylist" ADD CONSTRAINT "DiscoveredPlaylist_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE SET NULL ON UPDATE CASCADE;
