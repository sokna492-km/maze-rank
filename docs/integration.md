# KruMath integration — Maze Rank

App slug: **`maze-rank`**  
Public URL: **https://krumath.com/maze-rank**

Standalone TanStack Start app deployed as a Cloudflare Worker and mounted under the KruMath hostname.

## Auth

- **Hard gate** — unsigned or anonymous Supabase users redirect to `/sign-in?returnUrl=/maze-rank` (and deep paths under that base).
- Gate is skipped in `import.meta.env.DEV` so localhost works without shared cookies.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same Supabase project as KruMath). Optional: `VITE_KRUMATH_ORIGIN` for local sign-in/home redirects.

## Deploy

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_*` for the production build.
   - Put them in `.env` (gitignored). Do **not** leave leftover `VITE_SUPABASE_*` in the shell —
     Vite prefers process env over `.env`, so a stale placeholder can bake the wrong project into the Worker.
2. Deploy:

   ```sh
   npm run deploy
   ```

   Worker name: `maze-rank` (see `wrangler.toml`).
   After deploy, confirm the client bundle contains your real `*.supabase.co` host (not `example.supabase.co`).

3. Add a hostname route more specific than the main site Worker:

   ```text
   krumath.com/maze-rank*  →  maze-rank
   ```

4. Smoke-test on production:
   - Signed out → `/sign-in?returnUrl=/maze-rank`
   - After sign-in → returns to the app
   - Assets load from `/maze-rank/assets/...`
   - Header “Home” goes to `https://krumath.com/home`

`wrangler.toml` sets `workers_dev = true`, so a `*.workers.dev` preview URL may also exist. The supported production path is `https://krumath.com/maze-rank`.
