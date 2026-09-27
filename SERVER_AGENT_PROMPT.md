# Mini-PC Server Handoff Prompt

You are working directly on the mini PC that will host the backend for `narin606/YT_Anime_library`.

The frontend is intended for Vercel. The backend and PostgreSQL will run on the mini PC and should be exposed through Cloudflare Tunnel rather than direct inbound port forwarding.

## Before changing anything

Read:

1. `README.md`
2. `PROGRESS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DEPLOYMENT.md`
5. `docs/DATA_MODEL.md`
6. `AGENTS.md`

Then inspect the current machine before installing or replacing anything.

Run:

```bash
hostnamectl
uname -a
cat /etc/os-release
ip -br addr
lsblk -f
df -h
free -h
nproc
node --version || true
npm --version || true
docker --version || true
docker compose version || true
git --version || true
systemctl --failed || true
ss -lntup || true
```

Inspect whether Docker, Docker Compose, PostgreSQL, Nginx, Caddy, cloudflared, PM2 or existing application directories/tunnels already exist. Prefer read-only inspection first. Do not replace working infrastructure without a reason.

## Intended topology

```text
Internet
  |
Cloudflare
  |
Cloudflare Tunnel
  |
Mini PC
  |
Docker Compose
  +-- api
  +-- postgres
  +-- optional worker
```

PostgreSQL must not be exposed publicly.

## Backend responsibilities

- catalogue API
- AniList metadata sync
- YouTube metadata/source sync
- anime/video/episode matching
- watch progress
- profiles/accounts
- favourites/watchlists
- health endpoints
- scheduled source availability checks

## Deployment priorities

- Keep the existing server stable.
- Prefer Docker Compose unless the machine already has a better established pattern.
- Use durable storage for PostgreSQL.
- Put secrets in local environment files or secret management only.
- Add restart policies and health checks.
- Restrict CORS to the final frontend domain.
- Set up database backups before production use.
- Record exact production paths and commands in `PROGRESS.md`.

Suggested application path: `/opt/yt-anime-library/`, unless the server already has a clean convention.

## Git workflow

```bash
git clone https://github.com/narin606/YT_Anime_library.git
cd YT_Anime_library
git checkout -b infra/mini-pc-bootstrap
```

Before ending the session, update `PROGRESS.md` with OS/version, Docker/Node versions, application path, ports, Cloudflare status, database status, start/stop/redeploy commands, pending work and blockers. Never place credentials in that file.
