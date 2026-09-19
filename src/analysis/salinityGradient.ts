import { SalinityGradientResult } from "@/types/argo";
import { AveragedLevel } from "./averageProfile";

// Identifies the halocline as the depth interval with the steepest
// salinity gradient (|dS/dz|) and reports the overall trend with depth.
export function findSalinityGradient(profile: AveragedLevel[]): SalinityGradientResult {
  if (profile.length < 2) {
    return { found: false, haloclineDepth: null, gradientPer100m: null, trend: "uniform" };
  }

  let steepestAbsGradient = 0;
  let steepestMidDepth: number | null = null;

  for (let i = 0; i < profile.length - 1; i++) {
    const upper = profile[i];
    const lower = profile[i + 1];
    const dz = lower.depth - upper.depth;
    if (dz <= 0) continue;

    const dS = lower.salinity - upper.salinity;
    const gradient = Math.abs(dS / dz);

    if (gradient > steepestAbsGradient) {
      steepestAbsGradient = gradient;
      steepestMidDepth = (upper.depth + lower.depth) / 2;
    }
  }

  const first = profile[0];
  const last = profile[profile.length - 1];
  const overallDelta = last.salinity - first.salinity;

  let trend: SalinityGradientResult["trend"] = "uniform";
  if (overallDelta > 0.05) trend = "increasing";
  else if (overallDelta < -0.05) trend = "decreasing";

  if (steepestMidDepth === null || steepestAbsGradient < 0.0005) {
    return { found: false, haloclineDepth: null, gradientPer100m: null, trend };
  }

  return {
    found: true,
    haloclineDepth: Math.round(steepestMidDepth),
    gradientPer100m: Number((steepestAbsGradient * 100).toFixed(3)),
    trend,
  };
}
