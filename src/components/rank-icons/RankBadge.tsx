import { getRankBadge } from "@/lib/rank-icons";
import type { RankBadgeIconProps } from "./types";

type RankBadgeProps = RankBadgeIconProps & {
  index: number;
};

export function RankBadge({ index, size, className }: RankBadgeProps) {
  const Badge = getRankBadge(index);
  return <Badge size={size} className={className} />;
}
