# Repository Working Rules

Read `PROGRESS.md` before starting work.

## Rules

1. Do not silently change architecture decisions. Record meaningful changes in `PROGRESS.md`.
2. Keep frontend and backend responsibilities separated.
3. Never put secrets in frontend code or committed files.
4. Do not download, proxy, restream or store YouTube video content.
5. Keep source/provider/channel information internally even if the normal UI hides it.
6. Prefer small, reviewable commits.
7. Validate external API responses before persistence.
8. Design catalogue ingestion to be idempotent.
9. Treat automated anime/episode matching as probabilistic. Uncertain matches go to review.
10. Store timestamps in UTC.
11. Never commit credentials, cookies, tokens or Cloudflare tunnel secrets.
12. Before ending a work session, update `PROGRESS.md`.

## Definition of done

A task is done when implementation exists, error paths are handled, relevant checks pass, configuration is documented, and `PROGRESS.md` has been updated.
