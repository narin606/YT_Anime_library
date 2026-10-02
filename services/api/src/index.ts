import { createHash, randomBytes, randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError, z } from "zod";

import { AniListError, discoverAnime, fetchAnimeById, searchAnime } from "./anilist.js";
import { autoLinkAnime, matchNextPlaylists } from "./autolink.js";
import { animeCreateData, animeUpdateData, publicAnime } from "./catalog.js";
import { syncTrustedChannel, TRUSTED_CHANNELS } from "./channels.js";
import { loadConfig } from "./config.js";
import { isMalformedJsonError } from "./requestErrors.js";
import { ingestSegmentedPlaylist } from "./segments.js";
import { resendDelivery } from "./email.js";
import { createOpaqueToken, hashOpaqueToken, RESET_TTL_MS, validCsrf, VERIFICATION_TTL_MS } from "./security.js";
import { fetchApprovedPlaylist } from "./youtube.js";

const config = loadConfig();
const prisma = new PrismaClient();
const app = express();
const sessionCookie = "yt_anime_session";
const csrfCookie = "yt_anime_csrf";
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "64kb" }));
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false });
const recoveryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const publicApiLimiter=rateLimit({windowMs:60*1000,limit:180,standardHeaders:"draft-8",legacyHeaders:false,skip:req=>req.path==="/health"});
const privilegedLimiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:"draft-8",legacyHeaders:false});
const emailDelivery=config.RESEND_API_KEY&&config.RESEND_FROM?resendDelivery({apiKey:config.RESEND_API_KEY,from:config.RESEND_FROM,frontendUrl:config.FRONTEND_ORIGIN}):null;
app.use("/api/",publicApiLimiter);

function parseCookies(header: string | undefined) {
  return Object.fromEntries((header ?? "").split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]));
}
function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function publicAccount(account: { id: string; email: string; isAdmin: boolean; profiles: Array<{ id: string; name: string; avatar: string | null }> }) {
  return { id: account.id, email: account.email, isAdmin: account.isAdmin, profiles: account.profiles };
}
function cookieOptions() {
  return { httpOnly: true, secure: config.NODE_ENV === "production", sameSite: "lax" as const, domain: config.COOKIE_DOMAIN || undefined, path: "/" };
}
async function currentAccount(req: express.Request) {
  const token = parseCookies(req.headers.cookie)[sessionCookie];
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { account: { include: { profiles: { orderBy: { createdAt: "asc" } } } } } });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.account;
}
async function createSession(req: express.Request,res: express.Response, accountId: string) {
  const token = randomBytes(32).toString("base64url"),csrf=createOpaqueToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await prisma.$transaction(async tx=>{const old=parseCookies(req.headers.cookie)[sessionCookie];if(old)await tx.session.updateMany({where:{tokenHash:tokenHash(old),revokedAt:null},data:{revokedAt:new Date()}});await tx.session.create({ data: { tokenHash: tokenHash(token), accountId, expiresAt,userAgent:req.get("user-agent")?.slice(0,500),ipAddress:req.ip } });});
  res.cookie(sessionCookie, token, { ...cookieOptions(), expires: expiresAt });
  res.cookie(csrfCookie,csrf,{secure:config.NODE_ENV==="production",sameSite:"lax",domain:config.COOKIE_DOMAIN||undefined,path:"/",expires:expiresAt});
}
async function requireAdmin(req: express.Request, res: express.Response) {
  const account = await currentAccount(req);
  if (!account) { res.status(401).json({ error: { code: "unauthenticated", message: "Sign in to continue." } }); return null; }
  if (!account.isAdmin) { res.status(403).json({ error: { code: "admin_required", message: "Administrator access is required." } }); return null; }
  return account;
}
function parsePlaylistId(value: string) {
  try { const url = new URL(value); const id = url.searchParams.get("list"); if (id && /^PL[A-Za-z0-9_-]+$/.test(id)) return id; } catch { /* accept a raw ID below */ }
  return /^PL[A-Za-z0-9_-]+$/.test(value) ? value : null;
}
function parseAniListId(value: string) {
  const raw=value.trim(); if (/^\d+$/.test(raw)) return Number(raw);
  const match=raw.match(/anilist\.co\/anime\/(\d+)/i); return match ? Number(match[1]) : null;
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
    if (!emailDelivery) { await prisma.account.delete({where:{id:account.id}}); res.status(503).json({error:{code:"email_not_configured",message:"Email verification is temporarily unavailable."}}); return; }
    const verificationToken=createOpaqueToken();
    await prisma.emailVerificationToken.create({data:{accountId:account.id,tokenHash:hashOpaqueToken(verificationToken),expiresAt:new Date(Date.now()+VERIFICATION_TTL_MS)}});
    try { await emailDelivery.sendVerification(account.email,verificationToken); } catch { await prisma.account.delete({where:{id:account.id}}); res.status(503).json({error:{code:"email_delivery_failed",message:"Unable to send verification email. Please try again later."}}); return; }
    res.status(202).json({ message:"Check your inbox to verify your email." });
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
    if (!account.emailVerifiedAt) { res.status(403).json({error:{code:"email_unverified",message:"Verify your email before signing in."}}); return; }
    await createSession(req,res, account.id);
    res.json({ account: publicAccount(account) });
  } catch (error) { next(error); }
});

function requireCsrf(req:express.Request,res:express.Response){const cookies=parseCookies(req.headers.cookie);if(!validCsrf(req.get("origin"),config.FRONTEND_ORIGIN,cookies[csrfCookie],req.get("x-csrf-token"))){res.status(403).json({error:{code:"csrf_invalid",message:"Security token is invalid. Refresh and try again."}});return false}return true}
app.post("/api/v1/auth/logout", async (req, res) => {
  if(!requireCsrf(req,res))return;const token = parseCookies(req.headers.cookie)[sessionCookie];
  if (token) await prisma.session.updateMany({ where: { tokenHash: tokenHash(token),revokedAt:null },data:{revokedAt:new Date()} });
  res.clearCookie(sessionCookie, cookieOptions());res.clearCookie(csrfCookie,{...cookieOptions(),httpOnly:false});
  res.status(204).end();
});
app.post("/api/v1/auth/verify-email",recoveryLimiter,async(req,res,next)=>{try{const {token}=z.object({token:z.string().min(1).max(512)}).parse(req.body),now=new Date();const row=await prisma.emailVerificationToken.findFirst({where:{tokenHash:hashOpaqueToken(token),consumedAt:null,expiresAt:{gt:now}}});if(!row){res.status(400).json({error:{code:"invalid_token",message:"Invalid or expired verification link."}});return;}await prisma.$transaction([prisma.emailVerificationToken.update({where:{id:row.id},data:{consumedAt:now}}),prisma.account.update({where:{id:row.accountId},data:{emailVerifiedAt:now}})]);res.json({message:"Email verified. You can now sign in."});}catch(error){next(error)}});
app.post("/api/v1/auth/forgot-password",recoveryLimiter,async(req,res,next)=>{try{const {email}=z.object({email:z.string().trim().toLowerCase().email()}).parse(req.body),account=await prisma.account.findUnique({where:{email}});if(account?.emailVerifiedAt&&emailDelivery){const raw=createOpaqueToken();await prisma.passwordResetToken.deleteMany({where:{accountId:account.id,consumedAt:null}});await prisma.passwordResetToken.create({data:{accountId:account.id,tokenHash:hashOpaqueToken(raw),expiresAt:new Date(Date.now()+RESET_TTL_MS)}});try{await emailDelivery.sendPasswordReset(account.email,raw)}catch{await prisma.passwordResetToken.deleteMany({where:{accountId:account.id,tokenHash:hashOpaqueToken(raw)}});throw new Error("email_delivery_failed")}}res.status(202).json({message:"If an eligible account exists, password reset instructions will be sent."});}catch(error){next(error)}});
app.post("/api/v1/auth/reset-password",recoveryLimiter,async(req,res,next)=>{try{const {token,password}=z.object({token:z.string().min(1).max(512),password:z.string().min(12).max(128)}).parse(req.body),now=new Date();const row=await prisma.passwordResetToken.findFirst({where:{tokenHash:hashOpaqueToken(token),consumedAt:null,expiresAt:{gt:now}}});if(!row){res.status(400).json({error:{code:"invalid_token",message:"Invalid or expired password reset link."}});return;}await prisma.$transaction(async tx=>{const consumed=await tx.passwordResetToken.updateMany({where:{id:row.id,consumedAt:null,expiresAt:{gt:now}},data:{consumedAt:now}});if(consumed.count!==1)throw new Error("reset_consumed");await tx.account.update({where:{id:row.accountId},data:{passwordHash:await hash(password,12)}});await tx.session.updateMany({where:{accountId:row.accountId,revokedAt:null},data:{revokedAt:now}})});res.json({message:"Password reset. You can now sign in."});}catch(error){next(error)}});

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

const adminPlaylistSchema=z.object({playlist:z.string().trim().min(1).max(300),anilist:z.string().trim().min(1).max(300),language:z.string().trim().min(1).max(80),audioType:z.enum(["Sub","Dub","Original"]),region:z.string().trim().min(1).max(80),expectedEpisodes:z.number().int().positive().max(2000).optional()});
async function inspectAdminPlaylist(input:z.infer<typeof adminPlaylistSchema>){
  const playlistId=parsePlaylistId(input.playlist),anilistId=parseAniListId(input.anilist);
  if(!playlistId||!anilistId) return {error:{code:"invalid_reference",message:!playlistId?"Enter a valid YouTube playlist URL or ID.":"Enter a valid AniList URL or ID."}} as const;
  const discovered=await prisma.discoveredPlaylist.findUnique({where:{externalPlaylistId:playlistId},include:{approvedChannel:true}});
  if(!discovered) return {error:{code:"playlist_not_in_inventory",message:"This playlist is not in the approved distributor inventory."}} as const;
  const anime=await fetchAnimeById(config.ANILIST_API_URL,anilistId); if(!anime)return {error:{code:"anime_not_found",message:"AniList anime not found."}} as const;
  let source;try{source=await fetchApprovedPlaylist(config.YOUTUBE_API_KEY!,playlistId,discovered.approvedChannel.externalChannelId);}catch(error){return {error:{code:"playlist_requires_review",message:error instanceof Error?error.message:"Playlist validation failed."}} as const;}
  const warnings:string[]=[];if(input.expectedEpisodes&&source.episodes.length!==input.expectedEpisodes)warnings.push(`Expected ${input.expectedEpisodes} episodes but validated ${source.episodes.length}.`);if(anime.episodeCount&&source.episodes.length!==anime.episodeCount)warnings.push(`AniList lists ${anime.episodeCount} episodes but the playlist has ${source.episodes.length} validated episodes.`);
  return {playlistId,discovered,anime,source,warnings} as const;
}
app.post("/api/v1/admin/console/preview",async(req,res,next)=>{try{if(!await requireAdmin(req,res))return;if(!requireCsrf(req,res))return;if(!config.YOUTUBE_API_KEY){res.status(503).json({error:{code:"youtube_not_configured",message:"YouTube ingestion is not configured."}});return;}const input=adminPlaylistSchema.parse(req.body),result=await inspectAdminPlaylist(input);if("error" in result){res.status(400).json(result);return;}res.json({preview:{playlistId:result.playlistId,playlistTitle:result.source.playlistTitle,channelName:result.discovered.approvedChannel.name,anime:{anilistId:result.anime.anilistId,title:result.anime.title,episodeCount:result.anime.episodeCount,coverImageUrl:result.anime.coverImageUrl},validatedEpisodes:result.source.episodes.length,firstEpisode:result.source.episodes[0]?.episodeNumber??null,lastEpisode:result.source.episodes.at(-1)?.episodeNumber??null,warnings:result.warnings}});}catch(error){next(error);}});
app.post("/api/v1/admin/console/publish",async(req,res,next)=>{try{if(!await requireAdmin(req,res))return;if(!requireCsrf(req,res))return;if(!config.YOUTUBE_API_KEY){res.status(503).json({error:{code:"youtube_not_configured",message:"YouTube ingestion is not configured."}});return;}const input=adminPlaylistSchema.parse(req.body),result=await inspectAdminPlaylist(input);if("error" in result){res.status(400).json(result);return;}if(result.warnings.length){res.status(409).json({error:{code:"confirmation_mismatch",message:"Resolve episode-count warnings before publishing.",details:result.warnings}});return;}const syncedAt=new Date(),anime=await prisma.anime.upsert({where:{anilistId:result.anime.anilistId},create:animeCreateData(result.anime,syncedAt),update:animeUpdateData(result.anime,syncedAt)});const provider=await prisma.videoProvider.upsert({where:{type_externalChannelId:{type:"YOUTUBE",externalChannelId:result.discovered.approvedChannel.externalChannelId}},create:{type:"YOUTUBE",name:"YouTube",externalChannelId:result.discovered.approvedChannel.externalChannelId,externalChannelName:result.discovered.approvedChannel.name},update:{externalChannelName:result.discovered.approvedChannel.name,enabled:true}});await prisma.$transaction(async tx=>{for(const item of result.source.episodes){const episode=await tx.episode.upsert({where:{animeId_seasonNumber_episodeNumber:{animeId:anime.id,seasonNumber:1,episodeNumber:item.episodeNumber}},create:{animeId:anime.id,seasonNumber:1,episodeNumber:item.episodeNumber,title:`Episode ${item.episodeNumber}`,durationSeconds:item.durationSeconds},update:{durationSeconds:item.durationSeconds}});await tx.videoSource.upsert({where:{externalVideoId:item.id},create:{episodeId:episode.id,providerId:provider.id,discoveredPlaylistId:result.discovered.id,externalVideoId:item.id,titleRaw:item.title,thumbnailUrl:item.thumbnailUrl,publishedAt:item.publishedAt?new Date(item.publishedAt):null,language:input.language,audioType:input.audioType,region:input.region,embeddable:true,availabilityStatus:"AVAILABLE",lastCheckedAt:new Date()},update:{episodeId:episode.id,providerId:provider.id,discoveredPlaylistId:result.discovered.id,language:input.language,audioType:input.audioType,region:input.region,embeddable:true,availabilityStatus:"AVAILABLE",lastCheckedAt:new Date()}});}await tx.discoveredPlaylist.update({where:{id:result.discovered.id},data:{animeId:anime.id,language:input.language,audioType:input.audioType,region:input.region,matchConfidence:1,matchReason:"Published through administrator catalogue console"}});},{timeout:120000});res.json({animeId:anime.id,episodeCount:result.source.episodes.length});}catch(error){next(error);}});

app.get("/api/v1/auth/sessions",async(req,res,next)=>{try{const account=await currentAccount(req);if(!account){res.status(401).json({error:{code:"unauthenticated",message:"Sign in to continue."}});return;}const current=tokenHash(parseCookies(req.headers.cookie)[sessionCookie]);const sessions=await prisma.session.findMany({where:{accountId:account.id,revokedAt:null,expiresAt:{gt:new Date()}},orderBy:{createdAt:"desc"}});res.json({sessions:sessions.map(s=>({id:s.id,current:s.tokenHash===current,createdAt:s.createdAt,expiresAt:s.expiresAt,userAgent:s.userAgent}))});}catch(error){next(error)}});
app.delete("/api/v1/auth/sessions/:id",async(req,res,next)=>{try{if(!requireCsrf(req,res))return;const account=await currentAccount(req);if(!account){res.status(401).json({error:{code:"unauthenticated",message:"Sign in to continue."}});return;}await prisma.session.updateMany({where:{id:String(req.params.id),accountId:account.id,revokedAt:null},data:{revokedAt:new Date()}});res.status(204).end();}catch(error){next(error)}});
app.delete("/api/v1/admin/console/anime/:id",async(req,res,next)=>{try{if(!await requireAdmin(req,res))return;if(!requireCsrf(req,res))return;const id=String(req.params.id),anime=await prisma.anime.findUnique({where:{id},select:{id:true}});if(!anime){res.status(404).json({error:{code:"anime_not_found",message:"Anime not found."}});return;}await prisma.$transaction(async tx=>{await tx.discoveredPlaylist.updateMany({where:{animeId:id},data:{animeId:null,matchConfidence:null,matchReason:"Removed through administrator console; requires remapping"}});await tx.anime.delete({where:{id}})});res.status(204).end();}catch(error){next(error)}});

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
      orderBy: { updatedAt: "desc" }, take: 60,
      include: { episodes: { include: { videoSources: { where: { availabilityStatus: "AVAILABLE", embeddable: true }, include: { provider: true } } } } }
    });
    const playableRecords = stored.filter(anime => anime.episodes.some(episode => episode.videoSources.length > 0));
    const playable = playableRecords.slice(0, 20).map(publicAnime);
    const { season, seasonYear } = currentAnimeSeason();
    const popular = await discoverAnime(config.ANILIST_API_URL, season, seasonYear, 12).catch(() => ({ items: [], pageInfo: { currentPage: 1, hasNextPage: false } }));
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=1800");
    const byDistributor = Object.fromEntries(TRUSTED_CHANNELS.map(channel => [channel.name, playableRecords.filter(anime => anime.episodes.some(episode => episode.videoSources.some(source => source.provider.externalChannelId === channel.channelId))).map(publicAnime)]));
    res.json({ playable, recent: stored.map(publicAnime), popular: popular.items, byDistributor, season, seasonYear });
  } catch (error) { next(error); }
});

const importAnimeSchema = z.object({ anilistId: z.number().int().positive() });
app.post("/api/v1/anime/import", privilegedLimiter, async (req, res, next) => {
  try {
    if(!await requireAdmin(req,res))return;
    if(!requireCsrf(req,res))return;
    const { anilistId } = importAnimeSchema.parse(req.body);
    const item = await fetchAnimeById(config.ANILIST_API_URL, anilistId);
    if (!item) { res.status(404).json({ error: { code: "anime_not_found", message: "AniList anime not found." } }); return; }
    const syncedAt = new Date();
    const anime = await prisma.anime.upsert({ where: { anilistId }, create: animeCreateData(item, syncedAt), update: animeUpdateData(item, syncedAt) });
    const linkedSources = config.YOUTUBE_API_KEY ? await autoLinkAnime(prisma, config.YOUTUBE_API_KEY, anime.id, item) : [];
    const hydrated = linkedSources.length ? await prisma.anime.findUniqueOrThrow({ where: { id: anime.id }, include: { episodes: { orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }], include: { videoSources: { where: { availabilityStatus: "AVAILABLE", embeddable: true }, include: { provider: true } } } } } }) : anime;
    res.status(201).json({ anime: publicAnime(hydrated), linkedSources });
  } catch (error) { next(error); }
});

app.get("/api/v1/anime/:id", async (req, res, next) => {
  try {
    const anime = await prisma.anime.findUnique({ where: { id: String(req.params.id) }, include: { episodes: { orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }], include: { videoSources: { where: { availabilityStatus: "AVAILABLE", embeddable: true }, include: { provider: true } } } } } });
    if (!anime) { res.status(404).json({ error: { code: "anime_not_found", message: "Anime not found." } }); return; }
    res.json({ anime: publicAnime(anime) });
  } catch (error) { next(error); }
});

app.post("/api/v1/admin/youtube/channels/sync", privilegedLimiter, async (req, res, next) => {
  try {
    if (!config.ADMIN_API_KEY || req.get("authorization") !== `Bearer ${config.ADMIN_API_KEY}`) { res.status(401).json({ error: { code: "unauthorized", message: "Valid administrator credentials are required." } }); return; }
    if (!config.YOUTUBE_API_KEY) { res.status(503).json({ error: { code: "youtube_not_configured", message: "YouTube ingestion is not configured." } }); return; }
    const input = z.object({ handle: z.enum(["MuseAsia", "AniOneAsia", "TropicsAnimeAsia"]) }).parse(req.body);
    const trusted = TRUSTED_CHANNELS.find(item => item.handle === input.handle);
    if (!trusted) { res.status(400).json({ error: { code: "invalid_channel", message: "Channel is not approved." } }); return; }
    res.json(await syncTrustedChannel(prisma, config.YOUTUBE_API_KEY, trusted));
  } catch (error) { next(error); }
});

app.post("/api/v1/admin/youtube/matches/run", privilegedLimiter, async (req, res, next) => {
  try {
    if (!config.ADMIN_API_KEY || req.get("authorization") !== `Bearer ${config.ADMIN_API_KEY}`) { res.status(401).json({ error: { code: "unauthorized", message: "Valid administrator credentials are required." } }); return; }
    if (!config.YOUTUBE_API_KEY) { res.status(503).json({ error: { code: "youtube_not_configured", message: "YouTube ingestion is not configured." } }); return; }
    const { limit }=z.object({limit:z.number().int().min(1).max(50).default(20)}).parse(req.body);
    const results=await matchNextPlaylists(prisma,config.ANILIST_API_URL,config.YOUTUBE_API_KEY,limit);
    res.json({results});
  } catch(error){next(error);}
});

const segmentedPlaylistSchema=z.object({playlistId:z.string().regex(/^PL[A-Za-z0-9_-]+$/),segments:z.array(z.object({animeId:z.string().min(1),sourceEpisodeStart:z.number().int().positive(),sourceEpisodeEnd:z.number().int().positive(),animeEpisodeStart:z.number().int().positive().default(1)})).min(2).max(20)});
app.post("/api/v1/admin/youtube/playlists/segment",privilegedLimiter,async(req,res,next)=>{
  try{
    if(!config.ADMIN_API_KEY||req.get("authorization")!==`Bearer ${config.ADMIN_API_KEY}`){res.status(401).json({error:{code:"unauthorized",message:"Valid administrator credentials are required."}});return;}
    if(!config.YOUTUBE_API_KEY){res.status(503).json({error:{code:"youtube_not_configured",message:"YouTube ingestion is not configured."}});return;}
    const input=segmentedPlaylistSchema.parse(req.body);
    res.json(await ingestSegmentedPlaylist(prisma,config.YOUTUBE_API_KEY,input.playlistId,input.segments));
  }catch(error){next(error);}
});

const sourceImportSchema = z.object({ animeId: z.string().min(1), playlistId: z.string().regex(/^PL[A-Za-z0-9_-]+$/), channelId: z.string().regex(/^UC[A-Za-z0-9_-]+$/), channelName: z.string().trim().min(1).max(200), language: z.string().trim().min(1).max(80).optional(), audioType: z.enum(["Sub", "Dub", "Original"]).optional(), region: z.string().trim().min(1).max(80).optional() });
app.post("/api/v1/admin/youtube/playlists/import", privilegedLimiter, async (req, res, next) => {
  try {
    if (!config.ADMIN_API_KEY || req.get("authorization") !== `Bearer ${config.ADMIN_API_KEY}`) { res.status(401).json({ error: { code: "unauthorized", message: "Valid administrator credentials are required." } }); return; }
    if (!config.YOUTUBE_API_KEY) { res.status(503).json({ error: { code: "youtube_not_configured", message: "YouTube ingestion is not configured." } }); return; }
    const input = sourceImportSchema.parse(req.body);
    if (!await prisma.anime.findUnique({ where: { id: input.animeId }, select: { id: true } })) { res.status(404).json({ error: { code: "anime_not_found", message: "Anime not found." } }); return; }
    const discovered = await prisma.discoveredPlaylist.findUnique({ where: { externalPlaylistId: input.playlistId }, include: { approvedChannel: true } });
    if (!discovered || discovered.approvedChannel.externalChannelId !== input.channelId) { res.status(400).json({ error: { code: "unapproved_playlist", message: "Playlist is not in the approved channel inventory." } }); return; }
    let playlist;
    try {
      playlist = await fetchApprovedPlaylist(config.YOUTUBE_API_KEY, input.playlistId, input.channelId);
    } catch (error) {
      if (error instanceof Error && error.message === "Playlist contains duplicate episode numbers") {
        res.status(400).json({ error: { code: "duplicate_episode_numbers", message: "Playlist contains multiple videos for the same episode number and requires review." } });
        return;
      }
      throw error;
    }
    if (playlist.episodes.length < 4) { res.status(400).json({ error: { code: "insufficient_episodes", message: "Playlist has fewer than four valid numbered episodes." } }); return; }
    const language = input.language ?? discovered.language;
    const audioType = input.audioType ?? discovered.audioType;
    const region = input.region ?? discovered.region;
    const result = await prisma.$transaction(async tx => {
      const provider = await tx.videoProvider.upsert({ where: { type_externalChannelId: { type: "YOUTUBE", externalChannelId: input.channelId } }, create: { type: "YOUTUBE", name: "YouTube", externalChannelId: input.channelId, externalChannelName: input.channelName }, update: { externalChannelName: input.channelName, enabled: true } });
      for (const item of playlist.episodes) {
        const episode = await tx.episode.upsert({ where: { animeId_seasonNumber_episodeNumber: { animeId: input.animeId, seasonNumber: 1, episodeNumber: item.episodeNumber } }, create: { animeId: input.animeId, seasonNumber: 1, episodeNumber: item.episodeNumber, title: `Episode ${item.episodeNumber}`, durationSeconds: item.durationSeconds }, update: { durationSeconds: item.durationSeconds } });
        await tx.videoSource.upsert({ where: { externalVideoId: item.id }, create: { episodeId: episode.id, providerId: provider.id, discoveredPlaylistId: discovered.id, externalVideoId: item.id, titleRaw: item.title, thumbnailUrl: item.thumbnailUrl, publishedAt: item.publishedAt ? new Date(item.publishedAt) : null, language, audioType, region, embeddable: true, availabilityStatus: "AVAILABLE", lastCheckedAt: new Date() }, update: { episodeId: episode.id, providerId: provider.id, discoveredPlaylistId: discovered.id, titleRaw: item.title, thumbnailUrl: item.thumbnailUrl, publishedAt: item.publishedAt ? new Date(item.publishedAt) : null, language, audioType, region, embeddable: true, availabilityStatus: "AVAILABLE", lastCheckedAt: new Date() } });
      }
      await tx.discoveredPlaylist.update({ where: { id: discovered.id }, data: { animeId: input.animeId, language, audioType, region, matchConfidence: 1, matchReason: "Manual AniList mapping confirmed in review workbook" } });
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
