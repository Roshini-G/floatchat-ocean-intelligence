import { AnalysisSummary, ParsedQuery } from "@/types/argo";

export function buildInsight(summary: AnalysisSummary, query: ParsedQuery): string {
  if (summary.floatCount === 0) {
    return `No DEMO ARGO floats matched "${query.raw}". Try a broader region, a longer time window, or a different depth range.`;
  }

  const region = query.regionName ?? "the Indian Ocean domain";
  const sentences: string[] = [];

  sentences.push(
    `DEMO ARGO DATA: found ${summary.floatCount} float${summary.floatCount === 1 ? "" : "s"} (${summary.cycleCount} profile cycle${summary.cycleCount === 1 ? "" : "s"}) in ${region} over the last ${query.days} days, sampled between ${query.depthRange[0]}-${query.depthRange[1]} m.`
  );

  if (query.parameter !== "salinity" && summary.avgSurfaceTemp !== null) {
    sentences.push(
      `Temperature averages ${summary.avgSurfaceTemp.toFixed(1)}°C near the top of the sampled range, cooling to ${summary.avgDeepTemp?.toFixed(1)}°C by ${summary.maxDepthSampled} m.`
    );
    if (summary.thermocline.found) {
      sentences.push(
        `A thermocline is identified near ${summary.thermocline.depth} m, where temperature drops roughly ${Math.abs(summary.thermocline.gradientPer10m ?? 0)}°C per 10 m.`
      );
    } else {
      sentences.push("No sharp thermocline was detected in this depth range.");
    }
  }

  if (query.parameter !== "temperature" && summary.avgSurfaceSalinity !== null) {
    const trendWord =
      summary.salinity.trend === "increasing"
        ? "increases"
        : summary.salinity.trend === "decreasing"
        ? "decreases"
        : "stays roughly uniform";
    sentences.push(
      `Salinity ${trendWord} from ${summary.avgSurfaceSalinity.toFixed(2)} PSU to ${summary.avgDeepSalinity?.toFixed(2)} PSU across the sampled column.`
    );
    if (summary.salinity.found) {
      sentences.push(
        `The steepest change (halocline) sits near ${summary.salinity.haloclineDepth} m, at about ${summary.salinity.gradientPer100m} PSU per 100 m.`
      );
    }
  }

  if (summary.qc.flaggedCount > 0) {
    sentences.push(
      `QC filtering flagged ${summary.qc.flaggedCount} of ${summary.qc.totalCount} raw measurements as out-of-range and excluded them from this analysis.`
    );
  } else {
    sentences.push(`All ${summary.qc.totalCount} raw measurements passed QC range checks.`);
  }

  return sentences.join(" ");
}
