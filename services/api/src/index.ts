import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const origin = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(helmet());
app.use(cors({ origin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "yt-anime-library-api" });
});

app.get("/api/v1/anime", (_req, res) => {
  res.json({ items: [], nextCursor: null });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`YT Anime Library API listening on port ${port}`);
});
