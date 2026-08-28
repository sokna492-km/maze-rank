import { createFileRoute, redirect } from "@tanstack/react-router";
import { MAZE_RANK_HOME } from "@/lib/rank-path";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: MAZE_RANK_HOME });
  },
});
