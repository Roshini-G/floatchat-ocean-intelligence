import { DepthLevel, QcResult } from "@/types/argo";

// Basic ARGO-style real-time QC range checks (simplified for the prototype).
const TEMP_MIN = -2;
const TEMP_MAX = 40;
const SALINITY_MIN = 2;
const SALINITY_MAX = 42;

export function isLevelGood(level: DepthLevel): boolean {
  return (
    level.temperature >= TEMP_MIN &&
    level.temperature <= TEMP_MAX &&
    level.salinity >= SALINITY_MIN &&
    level.salinity <= SALINITY_MAX
  );
}

export function runQc(levels: DepthLevel[]): QcResult {
  const clean: DepthLevel[] = [];
  const flagged: DepthLevel[] = [];

  for (const level of levels) {
    if (isLevelGood(level) && level.qc === "good") {
      clean.push(level);
    } else {
      flagged.push(level);
    }
  }

  return {
    clean,
    flagged,
    totalCount: levels.length,
    flaggedCount: flagged.length,
  };
}
