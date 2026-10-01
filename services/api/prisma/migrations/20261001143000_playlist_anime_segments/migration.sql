CREATE TABLE "PlaylistAnimeSegment" (
  "id" TEXT NOT NULL,
  "discoveredPlaylistId" TEXT NOT NULL,
  "animeId" TEXT NOT NULL,
  "sourceEpisodeStart" INTEGER NOT NULL,
  "sourceEpisodeEnd" INTEGER NOT NULL,
  "animeEpisodeStart" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlaylistAnimeSegment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PlaylistAnimeSegment_discoveredPlaylistId_animeId_key" ON "PlaylistAnimeSegment"("discoveredPlaylistId", "animeId");
CREATE INDEX "PlaylistAnimeSegment_discoveredPlaylistId_sourceEpisodeStart_sourceEpisodeEnd_idx" ON "PlaylistAnimeSegment"("discoveredPlaylistId", "sourceEpisodeStart", "sourceEpisodeEnd");
CREATE INDEX "PlaylistAnimeSegment_animeId_idx" ON "PlaylistAnimeSegment"("animeId");
ALTER TABLE "PlaylistAnimeSegment" ADD CONSTRAINT "PlaylistAnimeSegment_discoveredPlaylistId_fkey" FOREIGN KEY ("discoveredPlaylistId") REFERENCES "DiscoveredPlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaylistAnimeSegment" ADD CONSTRAINT "PlaylistAnimeSegment_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;