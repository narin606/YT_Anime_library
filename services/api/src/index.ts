import { createHash, randomBytes, randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError, z } from "zod";

import { AniListError, discoverAnime, fetchAnimeById, searchAnime } from "./anilist.js";
import { animeCreateData, animeUpdateData, publicAnime } from "./catalog.js";
import { syncTrustedChannel, TRUSTED_CHANNELS } from "./channels.js";
import { loadConfig } from "./config.js";
import { isMalformedJsonError } from "./requestErrors.js";
import { fetchApprovedPlaylist } from "./youtube.js";

const config = loadConfig();
const prisma = new PrismaClient();
const app = express();
const sessionCookie = "yt_anime_session";
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "64kb" }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });

function parseCookies(header: string | undefined) {
  return Object.fromEntries((header ?? "").split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]));
}
function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function publicAccount(account: { id: string; email: string; profiles: Array<{ id: string; name: string; avatar: string | null }> }) {
  return { id: account.id, email: account.email, profiles: account.profiles };
}
function cookieOptions() {
  return { httpOnly: true, secure: config.NODE_ENV === "production", sameSite: "lax" as const, domain: config.COOKIE_DOMAIN || undefined, path: "/" };
}
async function currentAccount(req: express.Request) {
  const token = parseCookies(req.headers.cookie)[sessionCookie];
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { account: { include: { profiles: { orderBy: { createdAt: "asc" } } } } } });
  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.account;
}
async function createSession(res: express.Response, accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await prisma.session.create({ data: { tokenHash: tokenHash(token), accountId, expiresAt } });
  res.cookie(sessionCookie, token, { ...cookieOptions(), expires: expiresAt });
}

const credentialsSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(12).max(128) });
const registrationSchema = credentialsSchema.extend({ name: z.string().trim().min(1).max(32) });

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", service: "yt-anime-library-api", database: "ok" });
  } catch {
    res.status(503).json({ status: "error", service: "yt-anime-library-api", database: "unavailable" });
  }
});

app.post("/api/v1/auth/register", authLimiter, async (req, res, next) => {
  try {
    const input = registrationSchema.parse(req.body);
    if (await prisma.account.findUnique({ where: { email: input.email } })) {
      res.status(409).json({ error: { code: "email_in_use", message: "An account already exists for this email." } });
      return;
    }
    const account = await prisma.account.create({
      data: { authProviderUserId: randomUUID(), email: input.email, passwordHash: await hash(input.password, 12), profiles: { create: { name: input.name } } },
      include: { profiles: true }
    });
    await createSession(res, account.id);
    res.status(201).json({ account: publicAccount(account) });
  } catch (error) { next(error); }
});

app.post("/api/v1/auth/login", authLimiter, async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    const account = await prisma.account.findUnique({ where: { email: input.email }, include: { profiles: true } });
    if (!account || !(await compare(input.password, account.passwordHash))) {
      res.status(401).json({ error: { code: "invalid_credentials", message: "Email or password is incorrect." } });
      return;
    }
    await createSession(res, account.id);
    res.json({ account: publicAccount(account) });
  } catch (error) { next(error); }
});

app.post("/api/v1/auth/logout", async (req, res) => {
  const token = parseCookies(req.headers.cookie)[sessionCookie];
  if (token) await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  res.clearCookie(sessionCookie, cookieOptions());
  res.status(204).end();
});

app.get("/api/v1/auth/me", async (req, res, next) => {
  try {
    const account = await currentAccount(req);
    if (!account) {
      res.status(401).json({ error: { code: "unauthenticated", message: "Sign in to continue." } });
      return;
    }
    res.json({ account: publicAccount(account) });
  } catch (error) { next(error); }
});

app.get("/api/v1/anime", async (_req, res, next) => {
  try {
    const items = await prisma.anime.findMany({ orderBy: { updatedAt: "desc" }, take: 60 });
    res.json({ items: items.map((item) => publicAnime(item)), nextCursor: null });
  } catch (error) { next(error); }
});

function currentAnimeSeason(date = new Date()) {
  const month = date.getUTCMonth() + 1;
  return { season: month <= 3 ? "WINTER" : month <= 6 ? "SPRING" : month <= 9 ? "SUMMER" : "FALL", seasonYear: date.getUTCFullYear() } as const;
}

app.get("/api/v1/discovery", async (_req, res, next) => {
  try {
    const stored = await prisma.anime.findMany({
      orderBy: { updatedAt: "desc" }, take: 12,
      include: { episodes: { include: { videoSources: { where: { availabilityStatus: "AVAILABLE", embeddable: true }, include: { provider: true } } } } }
    });
    const playable = stored.filter(anime => anime.episodes.some(episode => episode.videoSources.length > 0)).map(publicAnime);
    const { season, seasonYear } = currentAnimeSeason();
    const popular = await discoverAnime(config.ANILIST_API_URL, season, seasonYear, 12);
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
    res.json({ playable, recent: stored.map(publicAnime), popular: popular.items, season, seasonYear });
  } catch (error) { next(error); }
});

const importAnimeSchema = z.object({ anilistId: z.number().int().positive() });
app.post("/api/v1/anime/import", async (req, res, next) => {
  try {
    const { anilistId } = importAnimeSchema.parse(req.body);
    const item = await fetchAnimeById(config.ANILIST_API_URL, anilistId);
    if (!item) { res.status(404).json({ error: { code: "anime_not_found", message: "AniList anime not found." } }); return; }
    const syncedAt = new Date();
    const anime = await prisma.anime.upsert({ where: { anilistId }, create: animeCreateData(item, syncedAt), update: animeUpdateData(item, syncedAt) });
    res.status(201).json({ anime: publicAnime(anime) });
  } catch (error) { next(error); }
});

app.get("/api/v1/anime/:id", async (req, res, next) => {
  try {
    const anime = await prisma.anime.findUnique({ where: { id: String(req.params.id) }, include: { episodes: { orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }], include: { videoSources: { where: { availabilityStatus: "AVAILABLE", embeddable: true }, include: { provider: true } } } } } });
    if (!anime) { res.status(404).json({ error: { code: "anime_not_found", message: "Anime not found." } }); return; }
    res.json({ anime: publicAnime(anime) });
  } catch (error) { next(error); }
});

app.post("/api/v1/admin/youtube/channels/sync", async (req, res, next) => {
  try {
    if (!config.ADMIN_API_KEY || req.get("authorization") !== `Bearer ${config.ADMIN_API_KEY}`) { res.status(401).json({ error: { code: "unauthorized", message: "Valid administrator credentials are required." } }); return; }
    if (!config.YOUTUBE_API_KEY) { res.status(503).json({ error: { code: "youtube_not_configured", message: "YouTube ingestion is not configured." } }); return; }
    const input = z.object({ handle: z.enum(["MuseAsia", "AniOneAsia", "TropicsAnimeAsia"]) }).parse(req.body);
    const trusted = TRUSTED_CHANNELS.find(item => item.handle === input.handle);
    if (!trusted) { res.status(400).json({ error: { code: "invalid_channel", message: "Channel is not approved." } }); return; }
    res.json(await syncTrustedChannel(prisma, config.YOUTUBE_API_KEY, trusted));
  } catch (error) { next(error); }
});

const sourceImportSchema = z.object({ animeId: z.string().min(1), playlistId: z.string().regex(/^PL[A-Za-z0-9_-]+$/), channelId: z.string().regex(/^UC[A-Za-z0-9_-]+$/), channelName: z.string().trim().min(1).max(200) });
app.post("/api/v1/admin/youtube/playlists/import", async (req, res, next) => {
  try {
    if (!config.ADMIN_API_KEY || req.get("authorization") !== `Bearer ${config.ADMIN_API_KEY}`) { res.status(401).json({ error: { code: "unauthorized", message: "Valid administrator credentials are required." } }); return; }
    if (!config.YOUTUBE_API_KEY) { res.status(503).json({ error: { code: "youtube_not_configured", message: "YouTube ingestion is not configured." } }); return; }
    const input = sourceImportSchema.parse(req.body);
    if (!await prisma.anime.findUnique({ where: { id: input.animeId }, select: { id: true } })) { res.status(404).json({ error: { code: "anime_not_found", message: "Anime not found." } }); return; }
    const playlist = await fetchApprovedPlaylist(config.YOUTUBE_API_KEY, input.playlistId, input.channelId);
    const result = await prisma.$transaction(async tx => {
      const provider = await tx.videoProvider.upsert({ where: { type_externalChannelId: { type: "YOUTUBE", externalChannelId: input.channelId } }, create: { type: "YOUTUBE", name: "YouTube", externalChannelId: input.channelId, externalChannelName: input.channelName }, update: { externalChannelName: input.channelName, enabled: true } });
      for (const item of playlist.episodes) {
        const episode = await tx.episode.upsert({ where: { animeId_seasonNumber_episodeNumber: { animeId: input.animeId, seasonNumber: 1, episodeNumber: item.episodeNumber } }, create: { animeId: input.animeId, seasonNumber: 1, episodeNumber: item.episodeNumber, title: `Episode ${item.episodeNumber}`, durationSeconds: item.durationSeconds }, update: { durationSeconds: item.durationSeconds } });
        await tx.videoSource.upsert({ where: { externalVideoId: item.id }, create: { episodeId: episode.id, providerId: provider.id, externalVideoId: item.id, titleRaw: item.title, thumbnailUrl: item.thumbnailUrl, publishedAt: item.publishedAt ? new Date(item.publishedAt) : null, embeddable: true, availabilityStatus: "AVAILABLE", lastCheckedAt: new Date() }, update: { episodeId: episode.id, providerId: provider.id, titleRaw: item.title, thumbnailUrl: item.thumbnailUrl, publishedAt: item.publishedAt ? new Date(item.publishedAt) : null, embeddable: true, availabilityStatus: "AVAILABLE", lastCheckedAt: new Date() } });
      }
      return { episodeCount: playlist.episodes.length, providerId: provider.id };
    });
    res.json({ playlist: { id: input.playlistId, title: playlist.playlistTitle, channelId: input.channelId, channelName: input.channelName }, ...result });
  } catch (error) { next(error); }
});

const searchQuerySchema = z.object({ q: z.string().trim().min(2).max(120), page: z.coerce.number().int().min(1).max(100).default(1), perPage: z.coerce.number().int().min(1).max(24).default(12) });
app.get("/api/v1/search", async (req, res, next) => {
  try {
    const query = searchQuerySchema.parse(req.query);
    const result = await searchAnime(config.ANILIST_API_URL, query.q, query.page, query.perPage);
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(result);
  } catch (error) { next(error); }
});

app.use((_req, res) => res.status(404).json({ error: { code: "not_found", message: "Route not found." } }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (isMalformedJsonError(error)) {
    res.status(400).json({ error: { code: "invalid_json", message: "Request body must contain valid JSON." } });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: "invalid_request", message: "Check the request and try again.", details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) } });
    return;
  }
  if (error instanceof AniListError) {
    res.status(error.status).json({ error: { code: "metadata_provider_error", message: error.message } });
    return;
  }
  console.error("Unhandled request error", error);
  res.status(500).json({ error: { code: "internal_error", message: "An unexpected error occurred." } });
});

const server = app.listen(config.PORT, "0.0.0.0", () => console.log(`YT Anime Library API listening on port ${config.PORT}`));
async function shutdown() { server.close(); await prisma.$disconnect(); }
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
