import { findRegionByQuery } from "@/data/regions";
import { ParameterChoice, ParsedQuery } from "@/types/argo";

export const DEFAULT_DAYS = 120;

export const DEPTH_PRESETS: { label: string; range: [number, number]; keywords: string[] }[] = [
  { label: "Surface (0-50 m)", range: [0, 50], keywords: ["surface"] },
  { label: "Shallow (0-200 m)", range: [0, 200], keywords: ["shallow", "upper ocean", "near surface"] },
  { label: "Intermediate (200-1000 m)", range: [200, 1000], keywords: ["intermediate", "mid depth", "mid-depth"] },
  { label: "Deep (1000-2000 m)", range: [1000, 2000], keywords: ["deep", "abyssal"] },
  { label: "Full depth (0-2000 m)", range: [0, 2000], keywords: ["full depth", "all depths", "entire column"] },
];

function parseDays(text: string): number {
  const lower = text.toLowerCase();

  const numericDaysMatch = lower.match(/last\s+(\d+)\s+day/);
  if (numericDaysMatch) return Number(numericDaysMatch[1]);

  const numericWeeksMatch = lower.match(/last\s+(\d+)\s+week/);
  if (numericWeeksMatch) return Number(numericWeeksMatch[1]) * 7;

  const numericMonthsMatch = lower.match(/last\s+(\d+)\s+month/);
  if (numericMonthsMatch) return Number(numericMonthsMatch[1]) * 30;

  if (lower.includes("today")) return 1;
  if (lower.includes("this week") || lower.includes("past week") || lower.includes("last week"))
    return 7;
  if (lower.includes("this month") || lower.includes("past month") || lower.includes("last month"))
    return 30;
  if (lower.includes("last quarter") || lower.includes("3 months") || lower.includes("past quarter"))
    return 90;
  if (lower.includes("last year") || lower.includes("past year")) return 365;

  return DEFAULT_DAYS;
}

function parseExplicitDepthRange(text: string): [number, number] | null {
  const lower = text.toLowerCase();

  const between = lower.match(/between\s+(\d+)\s*(?:m|meters)?\s+and\s+(\d+)\s*(?:m|meters)?/);
  if (between) {
    const a = Number(between[1]);
    const b = Number(between[2]);
    return [Math.min(a, b), Math.max(a, b)];
  }

  const rangeDash = lower.match(/(\d+)\s*-\s*(\d+)\s*m\b/);
  if (rangeDash) {
    const a = Number(rangeDash[1]);
    const b = Number(rangeDash[2]);
    return [Math.min(a, b), Math.max(a, b)];
  }

  const below = lower.match(/below\s+(\d+)\s*(?:m|meters)?/);
  if (below) return [Number(below[1]), 2000];

  const above = lower.match(/above\s+(\d+)\s*(?:m|meters)?/);
  if (above) return [0, Number(above[1])];

  return null;
}

function parseDepth(text: string): { label: string; range: [number, number] } {
  const explicit = parseExplicitDepthRange(text);
  if (explicit) {
    return { label: `${explicit[0]}-${explicit[1]} m`, range: explicit };
  }

  const lower = text.toLowerCase();
  for (const preset of DEPTH_PRESETS) {
    if (preset.keywords.some((kw) => lower.includes(kw))) {
      return { label: preset.label, range: preset.range };
    }
  }

  return { label: DEPTH_PRESETS[4].label, range: DEPTH_PRESETS[4].range };
}

function parseParameter(text: string): ParameterChoice {
  const lower = text.toLowerCase();
  const hasTemp = lower.includes("temperature") || lower.includes("temp ");
  const hasSalinity = lower.includes("salinity") || lower.includes("salt");

  if (hasTemp && hasSalinity) return "both";
  if (hasTemp) return "temperature";
  if (hasSalinity) return "salinity";
  return "both";
}

export function parseQuery(raw: string): ParsedQuery {
  const region = findRegionByQuery(raw);
  const days = parseDays(raw);
  const depth = parseDepth(raw);
  const parameter = parseParameter(raw);

  return {
    raw,
    regionId: region?.id ?? null,
    regionName: region?.name ?? null,
    days,
    depthLabel: depth.label,
    depthRange: depth.range,
    parameter,
  };
}
