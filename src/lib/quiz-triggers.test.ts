import { describe, expect, it } from "vitest";
import {
  milestoneThresholds,
  shuffleMilestoneThresholds,
} from "@/lib/quiz-triggers";

describe("quiz-triggers shuffle", () => {
  it("shuffleMilestoneThresholds keeps the same values", () => {
    const level = 4;
    const base = milestoneThresholds(level).sort((a, b) => a - b);
    const shuffled = shuffleMilestoneThresholds(level, 12345).sort((a, b) => a - b);
    expect(shuffled).toEqual(base);
  });

  it("shuffleMilestoneThresholds changes order for multi-quiz levels", () => {
    const defaultOrder = milestoneThresholds(3);
    let sawDifferent = false;
    for (let seed = 0; seed < 50; seed++) {
      const shuffled = shuffleMilestoneThresholds(3, seed);
      if (shuffled.join(",") !== defaultOrder.join(",")) {
        sawDifferent = true;
        break;
      }
    }
    expect(sawDifferent).toBe(true);
  });

  it("shuffleMilestoneThresholds is stable for the same seed", () => {
    expect(shuffleMilestoneThresholds(2, 7)).toEqual(shuffleMilestoneThresholds(2, 7));
  });
});
