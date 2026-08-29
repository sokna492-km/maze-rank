# Integrate a Separate App Repo with krumath.com

Use this document when shipping a **new feature or game in its own repository** and mounting it under **krumath.com** (same pattern as Quick Brain Racer and Poster Studio).

Copy this file into the new app repo so developers (and coding agents) know the full process.

---

## Hard rule: do not touch the KruMath monorepo

When working in **this** (feature) repo:

- **Do not** open, edit, commit, or PR the **KruMath monorepo**.
- **Do not** “helpfully” add the home Play / feature card yourself.
- **Do not** change KruMath middleware, auth, sign-in, or shared packages.

Auth and `/sign-in?returnUrl=...` already work on krumath.com. Your job is the **feature repo + Cloudflare Worker**. The home-page link is a **separate, last step** done by a KruMath maintainer (or the product owner) in their own PR.

If the task is “integrate with krumath.com”, complete **Phases A–B** in this repo, document the operator checklist for Cloudflare + home link, and **stop**. Do not cross into KruMath source.

---

## Goal

| Piece                | Responsibility                                                      |
| -------------------- | ------------------------------------------------------------------- |
| **Feature repo**     | App code, Cloudflare Worker deploy, auth gate (hard or soft)      |
| **Cloudflare**       | Route `krumath.com/<app-slug>*` to the feature Worker               |
| **KruMath monorepo** | Home entry link only — **out of scope** for feature-repo work       |

Do **not** merge the feature into the KruMath monorepo unless explicitly asked.

Do **not** put the feature on `learn.krumath.com` unless the product owner asks for that.

---

## Architecture (mental model)

```
User → krumath.com/home  (KruMath Worker: Next.js / OpenNext)
         │
         │ clicks feature card  ← added later in KruMath (not by this repo)
         ▼
       krumath.com/<app-slug>   ← Cloudflare route → Feature Worker (this repo)
         │
         ├─ hard gate: no / anonymous session? → /sign-in?returnUrl=/<app-slug>
         └─ soft gate: studio/app usable; gated actions (e.g. Export) → same redirect
                                  │
                                  └─ after sign-in → back to /<app-slug>
```

- **Main site Worker** name: `krumath` (apps/web).
- **Learn platform** is a different Worker (`krumath-learn` on learn.krumath.com). Ignore it for this flow.
- **Auth source of truth**: Supabase Auth (`@supabase/ssr` cookies), domain `.krumath.com`.
- **Firebase**: only used by KruMath for **phone SMS OTP**. Feature apps must **not** use Firebase for session.

Replace `<app-slug>` everywhere (examples: `quick-brain-racer`, `poster-canvas`).

---

## Auth rules (must match KruMath)

### Session

- Same Supabase project as KruMath.
- Browser + server clients via `@supabase/ssr`.
- Cookie options when hostname ends with `krumath.com`:

```ts
{ domain: ".krumath.com", path: "/", sameSite: "lax", secure: true }
```

- On `localhost`, leave `domain` unset (cookies do **not** share across different ports).

### Who counts as signed in

Treat as **not logged in** if:

- no user, **or**
- `user.is_anonymous === true`

(Same idea as KruMath `RequireLoggedIn`.)

### Gate styles

Pick one (product decision) and document it in the feature repo:

| Style        | Behavior                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| **Hard gate** | Route `beforeLoad` blocks the whole app until signed in (e.g. QBR)     |
| **Soft gate** | App loads for everyone; only specific actions redirect (e.g. Poster Studio: Export / Add Logo) |

Both use the same redirect URL and the same “not anonymous” rule.

### Redirect when blocked

Send the browser to:

```text
/sign-in?returnUrl=/<app-slug>
```

- Prefer a **relative** URL on production (`krumath.com`) so it stays same-origin.
- KruMath already validates `returnUrl` and sends the user back after sign-in. **Do not rebuild sign-in** in the feature app.
- Optional local override: `VITE_KRUMATH_ORIGIN=http://localhost:3000` so redirects hit the local KruMath web app.
- In **DEV**, skip the gate (or allow unsigned) so localhost works without shared cookies — match QBR / Poster Studio.

### Env names

| Feature repo (Vite)              | KruMath (Next)                  |
| -------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`              | `NEXT_PUBLIC_SUPABASE_URL`      |
| `VITE_SUPABASE_ANON_KEY`         | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `VITE_KRUMATH_ORIGIN` (optional) | —                               |

**Vite embeds `VITE_*` at build time.** Changing keys requires rebuild + redeploy. Never commit secrets.

---

## End-to-end process

### Phase A — Feature repository (do this here)

1. **Keep the app in its own git repo** (its own `.git` / GitHub remote). Do not nest work under the KruMath monorepo as the source of truth.
2. **Choose a URL path** on the main site: `/<app-slug>` (kebab-case, unique).
3. **Serve under that path:**
   - Vite: `base: "/<app-slug>/"`
   - Nitro: `baseURL: "/<app-slug>/"` so assets land at `/<app-slug>/assets/...`
   - Router file routes must be **in-app paths only** (`/`, `/live`, …), **not** `/<app-slug>/...`. Vite `base` already mounts the app. Using both produces `/<app-slug>/<app-slug>`.
4. **Add Supabase auth gate** (hard or soft):
   - Prefer `createIsomorphicFn` / `createClientOnlyFn` so `.server.ts` and `.client.ts` are not mixed incorrectly.
   - Soft-gate helpers that call `supabase.client` must be **client-only** (TanStack Start import protection will fail the build if a `.client` module is pulled into the SSR graph).
   - Reject missing / anonymous users for gated surfaces.
   - Redirect to `/sign-in?returnUrl=/<app-slug>`.
5. **Point “Go home”** at `https://krumath.com/home` (or `/home` on same origin via `VITE_KRUMATH_ORIGIN`).
6. **Deploy target**: Cloudflare Worker (Nitro `cloudflare-module` or equivalent). Match KruMath’s Cloudflare setup, not Firebase Hosting / Cloud Run.
7. Document `.env.example` with the `VITE_SUPABASE_*` vars.
8. Leave a short **operator checklist** (Cloudflare route + home link) for humans — do not implement the home link yourself.

Reference helpers (names may vary by repo):

- `src/lib/krumathCookies.ts` — cookie domain helpers
- `src/lib/krumathUrls.ts` — home + sign-in URLs
- `src/lib/supabase.client.ts` / `supabase.server.ts` — clients
- Hard gate: route `beforeLoad` + `requirePlayableUser` (see Quick Brain Racer)
- Soft gate: `requireSignedInForAction` + gate Export / paid actions only (see Poster Studio)

### Phase B — Cloudflare (operator)

1. Build with Supabase env present: `npm run build` (or `npm run deploy`).
2. Deploy the Worker (e.g. name `poster-canvas` or `quick-brain-racer`).
3. Add a **hostname route** more specific than the main site Worker:

   ```text
   krumath.com/<app-slug>*  →  <feature-worker>
   ```

4. Leave the **`krumath`** Worker for `/`, `/home`, `/sign-in`, `/auth/*`, etc.
5. Smoke-test:
   - Hard gate: signed-out → `/sign-in?returnUrl=...`
   - Soft gate: app loads unsigned; gated actions → `/sign-in?returnUrl=...`
   - Sign-in → returns to the app
   - Assets load from `/<app-slug>/assets/...` (not `/assets/...` on the main site)

### Phase C — KruMath monorepo (maintainer only — not the feature-repo agent)

Do this **last**, after the URL works, in a **separate** KruMath PR:

1. **No auth changes** for a normal `/sign-in?returnUrl=/<app-slug>` flow (already supported).
2. Add a home entry on **`/home`** (e.g. `apps/web/src/components/dashboard/GameSection.tsx`) linking to `/<app-slug>`.
3. Only touch `apps/web/src/middleware.ts` if the path still hits the Next Worker. If Cloudflare routes the path to the feature Worker, the **feature app** owns auth.

Feature-repo agents and PRs: **skip Phase C entirely.** Document it for the maintainer.

---

## Order of work (do not reverse)

1. Feature repo ready (path + auth + Cloudflare build)
2. Deploy Worker + Cloudflare route
3. Verify URL + login / soft-gate loop on krumath.com
4. Maintainer adds home button on `/home`

Adding the home button first creates a dead or unlocked link. Editing KruMath from the feature repo creates confusion and wrong PRs.

---

## Checklist for a new app

```text
Feature repo (agent / developer)
[ ] App lives in a separate git repo
[ ] Path chosen: /<app-slug>
[ ] Vite base + Nitro baseURL = /<app-slug>/
[ ] Same Supabase project as KruMath (VITE_* = NEXT_PUBLIC_* values)
[ ] Cookie domain .krumath.com on production hosts
[ ] Hard or soft gate: block anonymous + unsigned → /sign-in?returnUrl=/<app-slug>
[ ] Go-home link points at krumath.com/home
[ ] .env.example documents VITE_SUPABASE_* (no secrets committed)
[ ] Did NOT edit the KruMath monorepo

Operator
[ ] Cloudflare Worker deployed
[ ] Route krumath.com/<app-slug>* → feature Worker (before main Worker)
[ ] Smoke-tested signed-out and signed-in (and soft-gate actions if used)

Maintainer (KruMath PR — last)
[ ] Home link added on krumath.com/home
```

---

## Common mistakes

| Mistake                                                                              | Result                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Editing KruMath from the feature-repo task                                           | Wrong repo, tangled PRs; home link before Worker is live                                |
| Assets at `/assets/...` without path base                                            | Main KruMath Worker serves wrong/missing files                                          |
| Router `basepath` **or** file routes under `/<slug>` **plus** Vite `base` `/<slug>/` | Double path (`/<slug>/<slug>`)                                                          |
| Importing `*.client.ts` into modules that SSR also loads                             | TanStack Start import-protection build failure                                          |
| Firebase Auth for the feature session                                                | Breaks SSO with KruMath                                                                 |
| Allowing anonymous Supabase users                                                    | Guests bypass real accounts                                                             |
| Open redirects after sign-in                                                         | Only allow KruMath origins / relative paths (KruMath already validates `returnUrl`)     |
| Expecting localhost:3000 cookies on localhost:5173                                   | Different origins; skip gate in DEV or test on the production path                      |
| Putting the app under learn.krumath.com by default                                   | Wrong product surface unless requested                                                  |
| Nested git: IDE shows parent `master` while feature repo uses `main`                 | Wrong repo for branch/commit/push — open the feature folder as the workspace root       |

---

## What to edit in this repo vs elsewhere

**Edit (feature repo):**

- App source, Vite/Nitro config, auth gate, `.env.example`, deploy scripts, this doc

**Do not edit from a feature-repo task:**

- The **KruMath monorepo** (home card is a maintainer Phase C)
- learn.krumath.com / `apps/learn`
- Firebase phone OTP flows
- Rewriting unrelated git history

When asked only to “integrate with krumath.com”, implement **Phases A–B**, document Phase B–C for operators/maintainers, and leave the KruMath codebase alone.
