import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  base: "/maze-rank/",
  plugins: [
    command === "serve" ? devtools() : undefined,
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
    command === "build"
      ? nitro({
          preset: "cloudflare-module",
          baseURL: "/maze-rank/",
        })
      : undefined,
  ].filter(Boolean),
  test: {
    globals: true,
  },
}));
