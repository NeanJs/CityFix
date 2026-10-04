# CityFix client

Vue 3 + TypeScript + Vite static frontend.

## Environment variables

Copy `.env.example` to `.env` (and/or set the same keys in your host’s build environment). All `VITE_` values are public client config — never put secrets in them.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_APP_NAME` | No | `CityFix` | App display name (document title, branding). |
| `VITE_APP_TAGLINE` | No | `Report and track civic issues in your city.` | Short tagline used in meta description. |
| `VITE_MAP_STYLE` | No | `liberty` | OpenFreeMap style id: `liberty`, `bright`, `positron`, `dark`, `fiord`, or `3d`. |
| `VITE_MAP_STYLE_URL` | No | — | Optional full MapLibre style JSON URL; overrides `VITE_MAP_STYLE`. |
| `VITE_MAP_DEFAULT_LAT` | No | `49.2827` | Default map center latitude. |
| `VITE_MAP_DEFAULT_LNG` | No | `-123.1207` | Default map center longitude. |
| `VITE_MAP_DEFAULT_ZOOM` | No | `12` | Default map zoom. |
| `VITE_API_BASE_URL` | Yes* | — | Public API origin (no trailing slash). Files reports with `POST /api/reports` and loads them with `GET /api/reports/track/:trackingId`. Leave empty until the backend is available. |
| `VITE_REPORT_INGEST_URL` | No | `{VITE_API_BASE_URL}/reports/analyze` | Optional full URL override for the photo and voice read step. |

\*Required for saving reports on the server. The UI still builds and runs without it, and keeps the report on this device.

## Scripts

- `pnpm dev` — local dev server
- `pnpm build` — production build to `dist/`
- `pnpm preview` — serve the production build locally

## Deploy (Netlify)

Set the site **base directory** to `client` (if deploying from the monorepo root). Build command and publish directory are defined in `netlify.toml`.

## Deploy (Cloudflare Pages)

| Setting | Value |
|--------|--------|
| Root directory | `client` |
| Build command | `pnpm install && pnpm build` |
| Build output | `dist` |
| Node version | 20 |

SPA fallback: add a redirect rule `/* /index.html 200` in the Pages dashboard (same as `public/_redirects`).
