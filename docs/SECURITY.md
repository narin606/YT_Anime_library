# Security Notes

## Secrets

Never commit or expose in the browser:

- database credentials
- backend YouTube API keys
- authentication signing secrets
- Cloudflare tunnel tokens
- admin credentials

## Network

- Do not expose PostgreSQL publicly.
- Prefer Cloudflare Tunnel for the home-hosted API.
- Restrict CORS to known frontend origins.
- Keep the mini PC patched.

## Authorization

Profile-specific writes must verify profile ownership server-side. Admin routes need explicit admin authorization.

## Input

Validate IDs, pagination, playback positions, external API payloads and admin matching actions. Treat YouTube/AniList text as untrusted content and do not render arbitrary HTML.

## Logging

Do not log auth tokens, passwords, API keys, tunnel secrets or full sensitive headers.
