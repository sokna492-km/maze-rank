import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BADGE_VIEWBOX, type RankBadgeIconProps } from "../types";

function BadgeSvg({
  size = 24,
  className,
  children,
}: RankBadgeIconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={BADGE_VIEWBOX}
      fill="currentColor"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Warrior — simple shield + chevron */
export function WarriorBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path d="M12 2 5 5v6.5c0 4.2 3 8.1 7 9.5 4-1.4 7-5.3 7-9.5V5L12 2Z" opacity="0.35" />
      <path d="M12 3.5 6.5 6v5.5c0 3.4 2.4 6.6 5.5 7.8 3.1-1.2 5.5-4.4 5.5-7.8V6L12 3.5Z" />
      <path d="M12 8 9.5 12h1.7L11 15.2 12 17l1-1.8-1.2-3.2h1.7L12 8Z" />
    </BadgeSvg>
  );
}

/** Elite — shield + single star */
export function EliteBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path d="M12 2 5 5v6.5c0 4.2 3 8.1 7 9.5 4-1.4 7-5.3 7-9.5V5L12 2Z" opacity="0.35" />
      <path d="M12 3.5 6.5 6v5.5c0 3.4 2.4 6.6 5.5 7.8 3.1-1.2 5.5-4.4 5.5-7.8V6L12 3.5Z" />
      <path d="M12 7.5 13.1 10h2.7l-2.2 1.6.8 2.6L12 12.8l-2.4 1.4.8-2.6-2.2-1.6h2.7L12 7.5Z" />
    </BadgeSvg>
  );
}

/** Master — shield + small crown */
export function MasterBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path d="M12 2 5 5v6.5c0 4.2 3 8.1 7 9.5 4-1.4 7-5.3 7-9.5V5L12 2Z" opacity="0.35" />
      <path d="M12 3.5 6.5 6v5.5c0 3.4 2.4 6.6 5.5 7.8 3.1-1.2 5.5-4.4 5.5-7.8V6L12 3.5Z" />
      <path d="M8 8.5 9.2 10l1-1.8 1.8 3.2 1.8-3.2 1 1.8L16 8.5V11H8V8.5Z" />
    </BadgeSvg>
  );
}

/** Grandmaster — winged shield */
export function GrandmasterBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path
        d="M2.5 10c1.8-1.2 3.5-1.8 5-2v3.5C5 13.5 3.5 15 2.5 17 2 15.5 2 12.5 2.5 10Z"
        opacity="0.5"
      />
      <path
        d="M21.5 10c-1.8-1.2-3.5-1.8-5-2v3.5C19 13.5 20.5 15 21.5 17 22 15.5 22 12.5 21.5 10Z"
        opacity="0.5"
      />
      <path d="M12 3 7 5.5v5.5c0 3.5 2.2 6.8 5 8 2.8-1.2 5-4.5 5-8V5.5L12 3Z" />
      <path d="M12 8.5 10.5 11h3L12 13.5 10.5 11h3L12 8.5Z" opacity="0.85" />
    </BadgeSvg>
  );
}

/** Epic — diamond / gem crest */
export function EpicBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path d="M12 2 4 8.5 12 22l8-13.5L12 2Z" opacity="0.3" />
      <path d="M12 3.5 5.5 9 12 20l6.5-11L12 3.5Z" />
      <path d="M12 3.5 5.5 9h13L12 3.5Z" opacity="0.55" />
      <path d="M12 9 8.5 14h7L12 9Z" opacity="0.75" />
    </BadgeSvg>
  );
}

/** Legend — flame-wreathed medallion */
export function LegendBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path
        d="M6 14c-1-2.5-.5-5 1.5-7 0 2.5 1.5 4 3 5.5C9 10 8.5 7.5 10 5c0 3 2 5.5 2 8.5 0-2 1-3.5 2.5-4.5-1 2.5-.5 5.5-2.5 7.5C10.5 19 8 18 6 14Z"
        opacity="0.45"
      />
      <path d="M8 14c-.8-2-.3-4 1.2-5.5 0 2 1.2 3.2 2.3 4.5-.5-1.5-.8-3 .5-4.5 0 2.5 1.5 4.5 1.5 7 0-1.5.8-2.8 1.8-3.5-.8 2-2 3.5-3.8 4.5-1.2-.8-2.2-2-3.5-2.5Z" />
      <circle cx="12" cy="13" r="4.5" opacity="0.25" />
      <circle cx="12" cy="13" r="3" />
    </BadgeSvg>
  );
}

/** Mythic — crescent / arc emblem */
export function MythicBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path d="M14 4.5a7 7 0 1 0 0 15 5.5 5.5 0 0 1 0-15Z" />
      <circle cx="15.5" cy="9" r="1" opacity="0.7" />
      <path
        d="M10 18.5a6.5 6.5 0 0 1 0-13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
      />
    </BadgeSvg>
  );
}

/** Mythical Honor — winged badge + laurel hints */
export function MythicalHonorBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path
        d="M3 11c1.5-.8 3-1.2 4.5-1.3v2.8C5.5 13.8 4 15.2 3 17c-.3-1.8-.2-4 .2-6Z"
        opacity="0.45"
      />
      <path
        d="M21 11c-1.5-.8-3-1.2-4.5-1.3v2.8c2 1.3 3.5 2.7 4.5 4.5.3-1.8.2-4-.2-6Z"
        opacity="0.45"
      />
      <path d="M12 4 8 6.5v5c0 3 2.5 5.8 4 7 1.5-1.2 4-4 4-7v-5L12 4Z" />
      <path
        d="M7.5 19c1.5-1 3.5-1.5 4.5-1.5s3 .5 4.5 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path d="M12 8.5 10.8 11h2.4L12 13.2 10.8 11h2.4L12 8.5Z" opacity="0.8" />
    </BadgeSvg>
  );
}

/** Mythical Glory — radiant star burst */
export function MythicalGloryBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path
        d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path d="M12 6 13.8 10.5H18.5l-3.8 2.8 1.5 4.5L12 15.5 7.8 17.8l1.5-4.5L5.5 10.5h4.7L12 6Z" />
      <circle cx="12" cy="12" r="2.2" opacity="0.55" />
    </BadgeSvg>
  );
}

/** Mythical Immortal — ornate phoenix / infinity crest */
export function MythicalImmortalBadge(props: RankBadgeIconProps) {
  return (
    <BadgeSvg {...props}>
      <path
        d="M4 14c2-4 4.5-7 8-9 3.5 2 6 5 8 9-2.5 1.5-5.5 2.5-8 2.5S6.5 15.5 4 14Z"
        opacity="0.35"
      />
      <path d="M6 13.5c1.8-3.2 3.8-5.5 6-7 2.2 1.5 4.2 3.8 6 7-2 1.2-4.2 2-6 2s-4-.8-6-2Z" />
      <path
        d="M8 13.5c1.2-2 2.5-3.3 4-4 1.5.7 2.8 2 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M9.5 14.5c.8-1.2 1.6-2 2.5-2.5.9.5 1.7 1.3 2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </BadgeSvg>
  );
}
