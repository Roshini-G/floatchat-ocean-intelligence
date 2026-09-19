import { Region } from "@/types/argo";

export const REGIONS: Region[] = [
  {
    id: "arabian_sea",
    name: "Arabian Sea",
    latRange: [8, 24],
    lonRange: [52, 72],
    surfaceTemp: 29,
    deepTemp: 4,
    thermoclineDepth: 80,
    surfaceSalinity: 36.4,
    deepSalinity: 35.0,
    aliases: ["arabian sea", "arabian"],
  },
  {
    id: "bay_of_bengal",
    name: "Bay of Bengal",
    latRange: [6, 20],
    lonRange: [80, 94],
    surfaceTemp: 29.5,
    deepTemp: 4.5,
    thermoclineDepth: 60,
    surfaceSalinity: 33.0,
    deepSalinity: 35.0,
    aliases: ["bay of bengal", "bengal"],
  },
  {
    id: "equatorial_indian_ocean",
    name: "Equatorial Indian Ocean",
    latRange: [-5, 5],
    lonRange: [62, 90],
    surfaceTemp: 29,
    deepTemp: 3.5,
    thermoclineDepth: 100,
    surfaceSalinity: 34.8,
    deepSalinity: 34.9,
    aliases: ["equatorial indian ocean", "equator", "equatorial"],
  },
  {
    id: "andaman_sea",
    name: "Andaman Sea",
    latRange: [6, 15],
    lonRange: [93, 98],
    surfaceTemp: 29.8,
    deepTemp: 5,
    thermoclineDepth: 50,
    surfaceSalinity: 32.5,
    deepSalinity: 34.8,
    aliases: ["andaman sea", "andaman"],
  },
  {
    id: "southern_indian_ocean",
    name: "Southern Indian Ocean",
    latRange: [-38, -18],
    lonRange: [60, 100],
    surfaceTemp: 18,
    deepTemp: 2,
    thermoclineDepth: 150,
    surfaceSalinity: 35.5,
    deepSalinity: 34.6,
    aliases: ["southern indian ocean", "southern ocean"],
  },
];

export const INDIAN_OCEAN_ALIASES = ["indian ocean", "all floats", "all regions"];

export function findRegionByQuery(text: string): Region | null {
  const lower = text.toLowerCase();
  for (const region of REGIONS) {
    if (region.aliases.some((alias) => lower.includes(alias))) {
      return region;
    }
  }
  return null;
}
