import { FilteredFloat, allLevelsInWindow } from "@/services/dataService";
import { AnalysisSummary, ParsedQuery } from "@/types/argo";
import { buildAverageProfile } from "./averageProfile";
import { runQc } from "./qc";
import { findSalinityGradient } from "./salinityGradient";
import { findThermocline } from "./thermocline";

export { buildAverageProfile } from "./averageProfile";
export { runQc } from "./qc";
export { findThermocline } from "./thermocline";
export { findSalinityGradient } from "./salinityGradient";

export function buildAnalysisSummary(
  filtered: FilteredFloat[],
  query: ParsedQuery
): AnalysisSummary {
  const rawLevels = allLevelsInWindow(filtered, query.depthRange);
  const qc = runQc(rawLevels);
  const profile = buildAverageProfile(qc.clean);

  const thermocline = findThermocline(profile);
  const salinity = findSalinityGradient(profile);

  const cycleCount = filtered.reduce((sum, f) => sum + f.cyclesInWindow.length, 0);

  return {
    floatCount: filtered.length,
    cycleCount,
    qc,
    thermocline,
    salinity,
    avgSurfaceTemp: profile[0]?.temperature ?? null,
    avgDeepTemp: profile[profile.length - 1]?.temperature ?? null,
    avgSurfaceSalinity: profile[0]?.salinity ?? null,
    avgDeepSalinity: profile[profile.length - 1]?.salinity ?? null,
    maxDepthSampled: profile[profile.length - 1]?.depth ?? null,
    profile,
  };
}
