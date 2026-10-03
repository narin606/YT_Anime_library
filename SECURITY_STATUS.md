# Security Status

Last verified: 2026-10-03 (Singapore time)

## Successful

- Public catalogue surfaces are read-only; catalogue imports and mutations require an administrator session plus CSRF validation.
- Email verification, password reset, revocable session management, session metadata, and privilege checks are implemented.
- `/manage` is authorized server-side before private HTML renders; `/admin` returns 404.
- Global and privileged-operation rate limits, constrained CORS, and browser security headers are enabled.
- API runs as an unprivileged user with read-only root filesystem, restricted `/tmp`, all Linux capabilities dropped, and no privilege escalation.
- Production dependency audit: 0 known vulnerabilities.
- Automated verification: 26/26 tests passed; API and web production builds passed.
- Live verification: homepage populated, unauthenticated management redirect works, `/admin` is absent, and privacy-enhanced YouTube playback remains permitted by CSP.

## Incomplete or blocked

- Catalogue backfill stopped safely after AniList HTTP 429; ambiguous and combined playlists still require review.
- Estate-wide DNS, TLS, Vercel, tunnel-client, and backup items are tracked outside this repository.

## Production references

- Frontend: https://ani.kaehana.com
- API: https://ani-api.kaehana.com
- Latest full-stack security commit at time of verification: `bcfebdb`.
