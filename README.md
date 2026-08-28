# Neon Maze — Rank Climb

A minimalist, full-screen maze game built with React and TanStack Start. Navigate glowing labyrinths and climb through ten Mobile Legends–inspired ranks — from Warrior to Mythical Immortal.

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
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [Vite](https://vite.dev/) — Build tooling

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (or use [nvm](https://github.com/nvm-sh/nvm))
- npm, pnpm, or yarn

## Getting started

```sh
git clone https://github.com/sokna492-km/maze-rank.git
cd maze-rank
npm install
npm run dev
```

Open the URL printed in the terminal (typically `http://localhost:5173`).

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start the development server   |
| `npm run build`   | Production build               |
| `npm run preview` | Preview the production build   |
| `npm run lint`    | Run ESLint                     |
| `npm run format`  | Format code with Prettier      |

## Project structure

```
src/
├── routes/          # File-based routes (pages)
│   ├── __root.tsx   # Root layout and error boundaries
│   ├── index.tsx    # Level selection / landing page
│   └── play.$rank.tsx  # Gameplay screen
├── components/      # Shared UI components
├── lib/             # Game logic, maze generation, progress
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

Build the app for production:

```sh
npm run build
```

The output is suitable for deployment on any platform that supports Node.js or static hosting with SSR (e.g. Cloudflare Workers via Nitro).

## License

Private — all rights reserved unless otherwise specified.
