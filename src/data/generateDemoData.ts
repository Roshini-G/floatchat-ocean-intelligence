import { ArgoCycle, ArgoFloat, DepthLevel } from "@/types/argo";
import { REGIONS } from "./regions";

// Fixed anchor so the "demo present day" is stable across server and client renders.
export const ANCHOR_DATE = new Date("2026-09-06T00:00:00Z");

export const DEPTH_LEVELS = [
  0, 10, 20, 30, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 600, 700, 850,
  1000, 1200, 1500, 1800, 2000,
];

const FLOATS_PER_REGION = 3;
const CYCLES_PER_FLOAT = 12;
const CYCLE_SPACING_DAYS = 10;

// Deterministic pseudo-random hash in [-1, 1], seeded by arbitrary numbers.
function seededNoise(...seeds: number[]): number {
  const seed = seeds.reduce((acc, s) => acc * 37.719 + s * 12.9898, 1.0);
  const x = Math.sin(seed) * 43758.5453;
  const frac = x - Math.floor(x);
  return frac * 2 - 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateProfile(
  regionIndex: number,
  floatIndex: number,
  cycleIndex: number,
  region: (typeof REGIONS)[number]
): DepthLevel[] {
  return DEPTH_LEVELS.map((depth, depthIndex) => {
    const tShape = 1 / (1 + Math.pow(depth / region.thermoclineDepth, 4));
    let temperature =
      region.deepTemp + (region.surfaceTemp - region.deepTemp) * tShape;

    const haloclineDepth = region.thermoclineDepth * 1.4;
    const sShape = 1 / (1 + Math.pow(depth / haloclineDepth, 4));
    let salinity =
      region.deepSalinity + (region.surfaceSalinity - region.deepSalinity) * sShape;

    const noiseSeed = [regionIndex, floatIndex, cycleIndex, depthIndex];
    temperature += seededNoise(...noiseSeed, 1) * 0.2;
    salinity += seededNoise(...noiseSeed, 2) * 0.04;

    temperature = Number(temperature.toFixed(2));
    salinity = Number(salinity.toFixed(3));

    let qc: "good" | "bad" = "good";

    // Deliberately inject a handful of out-of-range sensor spikes so the
    // QC filter has real (synthetic) bad data to catch.
    const isInjectedFault =
      floatIndex === 1 && cycleIndex === 3 && (depthIndex === 5 || depthIndex === 6);
    if (isInjectedFault) {
      temperature = depthIndex === 5 ? 58.4 : temperature;
      salinity = depthIndex === 6 ? 0.6 : salinity;
      qc = "bad";
    }
    if (temperature < -2 || temperature > 40 || salinity < 2 || salinity > 42) {
      qc = "bad";
    }

    return { depth, temperature, salinity, qc };
  });
}

function generateFloat(
  region: (typeof REGIONS)[number],
  regionIndex: number,
  floatIndex: number
): ArgoFloat {
  const latSpan = region.latRange[1] - region.latRange[0];
  const lonSpan = region.lonRange[1] - region.lonRange[0];

  const startLat =
    region.latRange[0] + latSpan * (0.25 + 0.25 * floatIndex) +
    seededNoise(regionIndex, floatIndex, 10) * latSpan * 0.05;
  const startLon =
    region.lonRange[0] + lonSpan * (0.25 + 0.25 * floatIndex) +
    seededNoise(regionIndex, floatIndex, 20) * lonSpan * 0.05;

  const driftLat = seededNoise(regionIndex, floatIndex, 30) * 0.06;
  const driftLon = seededNoise(regionIndex, floatIndex, 40) * 0.08;

  const cycles: ArgoCycle[] = [];
  for (let cycleIndex = 0; cycleIndex < CYCLES_PER_FLOAT; cycleIndex++) {
    const daysBeforeAnchor =
      (CYCLES_PER_FLOAT - 1 - cycleIndex) * CYCLE_SPACING_DAYS;
    const date = new Date(ANCHOR_DATE);
    date.setUTCDate(date.getUTCDate() - daysBeforeAnchor);

    const lat = clamp(
      startLat +
        driftLat * cycleIndex +
        seededNoise(regionIndex, floatIndex, cycleIndex, 50) * 0.15,
      region.latRange[0] - 1,
      region.latRange[1] + 1
    );
    const lon = clamp(
      startLon +
        driftLon * cycleIndex +
        seededNoise(regionIndex, floatIndex, cycleIndex, 60) * 0.15,
      region.lonRange[0] - 1,
      region.lonRange[1] + 1
    );

    cycles.push({
      cycleNumber: cycleIndex + 1,
      date: date.toISOString(),
      lat: Number(lat.toFixed(3)),
      lon: Number(lon.toFixed(3)),
      levels: generateProfile(regionIndex, floatIndex, cycleIndex, region),
    });
  }

  const wmoId = `29${(regionIndex + 1).toString().padStart(2, "0")}${(
    floatIndex + 1
  )
    .toString()
    .padStart(2, "0")}${(regionIndex * FLOATS_PER_REGION + floatIndex)
    .toString()
    .padStart(2, "0")}`;

  return {
    id: `ARGO_${wmoId}`,
    wmoId,
    regionId: region.id,
    regionName: region.name,
    cycles,
  };
}

function generateAllFloats(): ArgoFloat[] {
  const floats: ArgoFloat[] = [];
  REGIONS.forEach((region, regionIndex) => {
    for (let floatIndex = 0; floatIndex < FLOATS_PER_REGION; floatIndex++) {
      floats.push(generateFloat(region, regionIndex, floatIndex));
    }
  });
  return floats;
}

export const ARGO_FLOATS: ArgoFloat[] = generateAllFloats();
