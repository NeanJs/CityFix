# CityFix client

Vue 3 + TypeScript + Vite static frontend.

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
