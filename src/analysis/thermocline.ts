import { ThermoclineResult } from "@/types/argo";
import { AveragedLevel } from "./averageProfile";

// Identifies the thermocline as the depth interval with the steepest
// negative temperature gradient (dT/dz) in the averaged profile.
export function findThermocline(profile: AveragedLevel[]): ThermoclineResult {
  if (profile.length < 2) {
    return { found: false, depth: null, gradientPer10m: null };
  }

  let steepestGradient = 0;
  let steepestMidDepth: number | null = null;

  for (let i = 0; i < profile.length - 1; i++) {
    const upper = profile[i];
    const lower = profile[i + 1];
    const dz = lower.depth - upper.depth;
    if (dz <= 0) continue;

    const dT = lower.temperature - upper.temperature;
    const gradient = dT / dz;

    if (gradient < steepestGradient) {
      steepestGradient = gradient;
      steepestMidDepth = (upper.depth + lower.depth) / 2;
    }
  }

  if (steepestMidDepth === null || steepestGradient > -0.01) {
    return { found: false, depth: null, gradientPer10m: null };
  }

  return {
    found: true,
    depth: Math.round(steepestMidDepth),
    gradientPer10m: Number((steepestGradient * 10).toFixed(2)),
  };
}
