import { DepthLevel } from "@/types/argo";

export interface AveragedLevel {
  depth: number;
  temperature: number;
  salinity: number;
  sampleCount: number;
}

// Groups clean depth levels by depth and averages temperature/salinity,
// producing a single representative profile for the filtered selection.
export function buildAverageProfile(levels: DepthLevel[]): AveragedLevel[] {
  const byDepth = new Map<number, { tempSum: number; salSum: number; count: number }>();

  for (const level of levels) {
    const bucket = byDepth.get(level.depth) ?? { tempSum: 0, salSum: 0, count: 0 };
    bucket.tempSum += level.temperature;
    bucket.salSum += level.salinity;
    bucket.count += 1;
    byDepth.set(level.depth, bucket);
  }

  return Array.from(byDepth.entries())
    .map(([depth, { tempSum, salSum, count }]) => ({
      depth,
      temperature: Number((tempSum / count).toFixed(2)),
      salinity: Number((salSum / count).toFixed(3)),
      sampleCount: count,
    }))
    .sort((a, b) => a.depth - b.depth);
}
