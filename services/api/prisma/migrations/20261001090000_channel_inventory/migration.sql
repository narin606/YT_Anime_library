CREATE TYPE "PlaylistClassification" AS ENUM ('LIKELY_SERIES', 'REVIEW', 'EXCLUDED');

CREATE TABLE "ApprovedChannel" (
  "id" TEXT NOT NULL,
  "externalChannelId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "uploadsPlaylistId" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovedChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscoveredPlaylist" (
  "id" TEXT NOT NULL,
  "approvedChannelId" TEXT NOT NULL,
  "externalPlaylistId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "itemCount" INTEGER NOT NULL,
  "thumbnailUrl" TEXT,
  "publishedAt" TIMESTAMP(3),
  "classification" "PlaylistClassification" NOT NULL DEFAULT 'REVIEW',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiscoveredPlaylist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApprovedChannel_externalChannelId_key" ON "ApprovedChannel"("externalChannelId");
CREATE UNIQUE INDEX "ApprovedChannel_handle_key" ON "ApprovedChannel"("handle");
CREATE UNIQUE INDEX "DiscoveredPlaylist_externalPlaylistId_key" ON "DiscoveredPlaylist"("externalPlaylistId");
CREATE INDEX "DiscoveredPlaylist_approvedChannelId_classification_idx" ON "DiscoveredPlaylist"("approvedChannelId", "classification");
CREATE INDEX "DiscoveredPlaylist_active_idx" ON "DiscoveredPlaylist"("active");
ALTER TABLE "DiscoveredPlaylist" ADD CONSTRAINT "DiscoveredPlaylist_approvedChannelId_fkey" FOREIGN KEY ("approvedChannelId") REFERENCES "ApprovedChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
