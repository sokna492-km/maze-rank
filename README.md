# Neon Maze — Rank Climb

A minimalist, full-screen maze game built with React and TanStack Start. Navigate glowing labyrinths and climb through ten ranked difficulty tiers — from Warrior to Mythical Immortal.

## Features

- **Rank progression** — Ten difficulty tiers with a visual progression map; complete a level to unlock the next.
- **Full-screen gameplay** — Maze fills the viewport with no scrolling (`100vw` × `100vh`).
- **Responsive controls** — Touch-friendly on mobile; keyboard navigation on desktop.
- **Local progress** — Unlocked ranks and player name persist in the browser.
- **Leaderboard** — Track your best times per rank.

## Tech stack

- [TanStack Start](https://tanstack.com/start) — Full-stack React framework with SSR
- [TanStack Router](https://tanstack.com/router) — File-based routing
- [Tailwind CSS v4](https://tailwindcss.com/) — Styling
- Lightweight UI primitives (drawer, scroll area)
- [Vite](https://vite.dev/) — Build tooling
- [Supabase](https://supabase.com/) — Auth (shared with KruMath)

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (or use [nvm](https://github.com/nvm-sh/nvm))
- npm

## Getting started

```sh
git clone https://github.com/sokna492-km/maze-rank.git
cd maze-rank
npm install
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173/maze-rank/`). Copy `.env.example` to `.env` if you need production-like Supabase values; the auth gate is skipped in development.

## KruMath.com

Mounted at **https://krumath.com/maze-rank**. See [docs/integration.md](docs/integration.md) for Cloudflare deploy and auth gate details.

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the development server             |
| `npm run build`   | Production build (Cloudflare Worker)     |
| `npm run deploy`  | Build and deploy with Nitro to Cloudflare |
| `npm run preview` | Preview the production build             |
| `npm run lint`    | Run ESLint                               |
| `npm run format`  | Format code with Prettier                |
| `npm run test`    | Run Vitest                               |

## Project structure

```
src/
├── routes/          # File-based routes (in-app paths; Vite base mounts /maze-rank/)
│   ├── __root.tsx   # Root layout and error boundaries
│   ├── index.tsx    # Level selection
│   └── live.$rank.tsx  # Gameplay screen
├── components/      # Game UI (leaderboard, quiz, theme, rank icons)
│   └── ui/          # Drawer and scroll-area primitives
├── lib/             # Maze, quiz, progress, auth, theme helpers
├── server.ts        # SSR entry with error handling
└── styles.css       # Global styles and Tailwind imports
```

## Gameplay

1. Start on the **level selection** screen — Warrior is unlocked by default.
2. Tap or click a rank to play its maze.
3. Move through the glowing paths to reach the goal.
4. Completing a rank unlocks the next one.

### Controls

- **Desktop** — Arrow keys or WASD
- **Mobile** — On-screen directional pad

## Deployment

```sh
# Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time
npm run deploy
```

Then add Cloudflare route `krumath.com/maze-rank*` → Worker `maze-rank`. Details: [docs/integration.md](docs/integration.md).

## License

[MIT](LICENSE)
