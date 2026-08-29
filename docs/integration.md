# KruMath integration — Maze Rank

App slug: **`maze-rank`**  
Public URL (after Cloudflare route): **https://krumath.com/maze-rank**

This repo owns the feature Worker and auth gate. Do **not** edit the KruMath monorepo from this project.

## Auth

- **Hard gate** — unsigned or anonymous Supabase users redirect to `/sign-in?returnUrl=/maze-rank` (and deep paths under that base).
- Gate is skipped in `import.meta.env.DEV` so localhost works without shared cookies.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same project as KruMath). Optional: `VITE_KRUMATH_ORIGIN` for local sign-in/home redirects.

## Phase B — Operator (Cloudflare)

1. Set `VITE_SUPABASE_*` for the production build (same values as KruMath `NEXT_PUBLIC_SUPABASE_*`).
   - Put them in `.env` (gitignored). Do **not** leave leftover `VITE_SUPABASE_*` in the shell —
     Vite prefers process env over `.env`, so a stale placeholder (e.g. from a test build) will
     bake the wrong project into the Worker and signed-in KruMath users will always look logged out.
2. Deploy:

   ```sh
   npm run deploy
   ```

   Worker name: `maze-rank` (see `wrangler.toml`).
   After deploy, confirm the client bundle contains your real `*.supabase.co` host (not `example.supabase.co`).

3. Add a hostname route **more specific** than the main `krumath` Worker:

   ```text
   krumath.com/maze-rank*  →  maze-rank
   ```

4. Smoke-test on production:
   - Signed out → `/sign-in?returnUrl=/maze-rank` (or a deeper return path under `/maze-rank/...`)
   - After sign-in → returns to the app
   - Assets load from `/maze-rank/assets/...` (not `/assets/...` on the main site)
   - Header “Home” goes to `https://krumath.com/home`

## Phase C — Maintainer only (KruMath monorepo)

After the URL works, in a **separate** KruMath PR:

1. Add a home entry on `/home` linking to `/maze-rank`.
2. No auth/middleware changes needed for a normal `/sign-in?returnUrl=/maze-rank` flow.

Feature-repo agents: **skip Phase C**.
