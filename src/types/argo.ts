export type QcFlag = "good" | "bad";

export interface DepthLevel {
  depth: number;
  temperature: number;
  salinity: number;
  qc: QcFlag;
}

export interface ArgoCycle {
  cycleNumber: number;
  date: string;
  lat: number;
  lon: number;
  levels: DepthLevel[];
}

export interface ArgoFloat {
  id: string;
  wmoId: string;
  regionId: string;
  regionName: string;
  cycles: ArgoCycle[];
}

export interface Region {
  id: string;
  name: string;
  latRange: [number, number];
  lonRange: [number, number];
  surfaceTemp: number;
  deepTemp: number;
  thermoclineDepth: number;
  surfaceSalinity: number;
  deepSalinity: number;
  aliases: string[];
}

export type ParameterChoice = "temperature" | "salinity" | "both";

export interface DepthRangeChoice {
  label: string;
  range: [number, number];
}

export interface ParsedQuery {
  raw: string;
  regionId: string | null;
  regionName: string | null;
  days: number;
  depthLabel: string;
  depthRange: [number, number];
  parameter: ParameterChoice;
}

export interface QcResult {
  clean: DepthLevel[];
  flagged: DepthLevel[];
  totalCount: number;
  flaggedCount: number;
}

export interface ThermoclineResult {
  found: boolean;
  depth: number | null;
  gradientPer10m: number | null;
}

export interface SalinityGradientResult {
  found: boolean;
  haloclineDepth: number | null;
  gradientPer100m: number | null;
  trend: "increasing" | "decreasing" | "uniform";
}

export interface AveragedLevelLike {
  depth: number;
  temperature: number;
  salinity: number;
  sampleCount: number;
}

export interface AnalysisSummary {
  floatCount: number;
  cycleCount: number;
  qc: QcResult;
  thermocline: ThermoclineResult;
  salinity: SalinityGradientResult;
  avgSurfaceTemp: number | null;
  avgDeepTemp: number | null;
  avgSurfaceSalinity: number | null;
  avgDeepSalinity: number | null;
  maxDepthSampled: number | null;
  profile: AveragedLevelLike[];
}
