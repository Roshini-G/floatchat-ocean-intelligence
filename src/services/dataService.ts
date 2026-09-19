import { ANCHOR_DATE, ARGO_FLOATS } from "@/data";
import { ArgoCycle, ArgoFloat, DepthLevel, ParsedQuery } from "@/types/argo";

export interface FilteredFloat {
  float: ArgoFloat;
  cyclesInWindow: ArgoCycle[];
  latestCycle: ArgoCycle;
}

export function filterFloats(query: ParsedQuery): FilteredFloat[] {
  const cutoff = new Date(ANCHOR_DATE);
  cutoff.setUTCDate(cutoff.getUTCDate() - query.days);

  const results: FilteredFloat[] = [];

  for (const float of ARGO_FLOATS) {
    if (query.regionId && float.regionId !== query.regionId) continue;

    const cyclesInWindow = float.cycles.filter(
      (cycle) => new Date(cycle.date) >= cutoff
    );
    if (cyclesInWindow.length === 0) continue;

    results.push({
      float,
      cyclesInWindow,
      latestCycle: cyclesInWindow[cyclesInWindow.length - 1],
    });
  }

  return results;
}

export function levelsInDepthRange(
  levels: DepthLevel[],
  range: [number, number]
): DepthLevel[] {
  return levels.filter((l) => l.depth >= range[0] && l.depth <= range[1]);
}

export function allLevelsInWindow(
  filtered: FilteredFloat[],
  depthRange: [number, number]
): DepthLevel[] {
  const levels: DepthLevel[] = [];
  for (const f of filtered) {
    for (const cycle of f.cyclesInWindow) {
      levels.push(...levelsInDepthRange(cycle.levels, depthRange));
    }
  }
  return levels;
}
