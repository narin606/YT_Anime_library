import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError, z } from "zod";

import { AniListError, searchAnime } from "./anilist.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "yt-anime-library-api" });
});

app.get("/api/v1/anime", (_req, res) => {
  res.json({ items: [], nextCursor: null });
});

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  page: z.coerce.number().int().min(1).max(100).default(1),
  perPage: z.coerce.number().int().min(1).max(24).default(12)
});

app.get("/api/v1/search", async (req, res, next) => {
  try {
    const query = searchQuerySchema.parse(req.query);
    const result = await searchAnime(
      config.ANILIST_API_URL,
      query.q,
      query.page,
      query.perPage
    );
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: { code: "not_found", message: "Route not found." } });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "invalid_request",
        message: "Check the request and try again.",
        details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
      }
    });
    return;
  }
  if (error instanceof AniListError) {
    res.status(error.status).json({ error: { code: "metadata_provider_error", message: error.message } });
    return;
  }
  console.error("Unhandled request error", error);
  res.status(500).json({ error: { code: "internal_error", message: "An unexpected error occurred." } });
});

app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`YT Anime Library API listening on port ${config.PORT}`);
});
