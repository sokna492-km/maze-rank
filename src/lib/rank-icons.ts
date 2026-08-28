import type { ComponentType } from "react";
import {
  WarriorBadge,
  EliteBadge,
  MasterBadge,
  GrandmasterBadge,
  EpicBadge,
  LegendBadge,
  MythicBadge,
  MythicalHonorBadge,
  MythicalGloryBadge,
  MythicalImmortalBadge,
} from "@/components/rank-icons/badges";
import type { RankBadgeIconProps } from "@/components/rank-icons/types";

export type RankBadgeComponent = ComponentType<RankBadgeIconProps>;

export const RANK_BADGES: RankBadgeComponent[] = [
  WarriorBadge,
  EliteBadge,
  MasterBadge,
  GrandmasterBadge,
  EpicBadge,
  LegendBadge,
  MythicBadge,
  MythicalHonorBadge,
  MythicalGloryBadge,
  MythicalImmortalBadge,
];

export function getRankBadge(index: number): RankBadgeComponent {
  return RANK_BADGES[index] ?? RANK_BADGES[0]!;
}
