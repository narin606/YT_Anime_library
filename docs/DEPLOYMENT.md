# Deployment

## Target layout

```text
anime.kaehana.com
    |
  Vercel
    |
    | HTTPS
    v
anime-api.kaehana.com
    |
 Cloudflare
    |
 Cloudflare Tunnel
    |
 Mini PC
  +-- API
  +-- PostgreSQL
  +-- optional worker
```

The subdomain names above are examples until finalized.

## Mini PC

Preferred pattern: Docker Compose, unless inspection shows an existing clean convention worth preserving.

Suggested application path: `/opt/yt-anime-library/`.

PostgreSQL must not be internet-facing. The API is currently bound to `127.0.0.1:3001` in Docker Compose so Cloudflare/reverse-proxy infrastructure can expose only the intended service.

## Vercel

Frontend-safe variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://anime-api.kaehana.com
```

Do not place database credentials, YouTube server keys, auth secrets or tunnel tokens in frontend variables.

## Cloudflare

Prefer Cloudflare Tunnel over router port forwarding. Route only the chosen API hostname to the backend service.

## Deployment flow

Initial simple flow:

```text
push GitHub
  +-> Vercel deploys frontend
  +-> mini PC pulls backend changes manually or via controlled deploy script
```

Automated server deployment can be added after the host layout is understood.

## Backups

Before production use:

- scheduled PostgreSQL dumps,
- multiple-day retention,
- copies stored away from the live database volume,
- documented restore test.

## Monitoring

Start with `GET /health`, then add uptime monitoring, structured logs, disk-space alerts and backup verification.
