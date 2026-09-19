"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { FilteredFloat } from "@/services/dataService";
import { REGIONS } from "@/data";
import type { Data, Layout } from "plotly.js";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

const REGION_COLORS: Record<string, string> = {
  arabian_sea: "#38bdf8",
  bay_of_bengal: "#a78bfa",
  equatorial_indian_ocean: "#34d399",
  andaman_sea: "#fbbf24",
  southern_indian_ocean: "#fb7185",
};

const FULL_LON_RANGE: [number, number] = [40, 105];
const FULL_LAT_RANGE: [number, number] = [-42, 30];
const REGION_PADDING = 6;

interface Props {
  floats: FilteredFloat[];
  selectedFloatId: string | null;
  onSelectFloat: (id: string) => void;
  regionId: string | null;
}

export default function FloatMap({ floats, selectedFloatId, onSelectFloat, regionId }: Props) {
  const { data, layout } = useMemo(() => {
    const traces: Data[] = [];

    for (const f of floats) {
      const color = REGION_COLORS[f.float.regionId] ?? "#38bdf8";
      const isSelected = f.float.id === selectedFloatId;

      traces.push({
        type: "scattergeo",
        mode: "lines+markers",
        lon: f.cyclesInWindow.map((c) => c.lon),
        lat: f.cyclesInWindow.map((c) => c.lat),
        line: { color, width: isSelected ? 3 : 1.5 },
        marker: {
          color,
          size: isSelected ? 10 : 6,
          opacity: isSelected ? 1 : 0.85,
          line: { color: "#03070d", width: 1 },
        },
        customdata: f.cyclesInWindow.map(() => f.float.id),
        hovertemplate:
          `<b>${f.float.id}</b><br>${f.float.regionName}<br>%{lat:.2f}°, %{lon:.2f}°<extra></extra>`,
        name: f.float.id,
        showlegend: false,
      } as Data);
    }

    const region = REGIONS.find((r) => r.id === regionId);
    const lonRange: [number, number] = region
      ? [region.lonRange[0] - REGION_PADDING, region.lonRange[1] + REGION_PADDING]
      : FULL_LON_RANGE;
    const latRange: [number, number] = region
      ? [region.latRange[0] - REGION_PADDING, region.latRange[1] + REGION_PADDING]
      : FULL_LAT_RANGE;

    const geoLayout: Partial<Layout> = {
      geo: {
        scope: "world",
        projection: { type: "natural earth" },
        lonaxis: { range: lonRange, showgrid: true, gridcolor: "rgba(94,234,212,0.12)" },
        lataxis: { range: latRange, showgrid: true, gridcolor: "rgba(94,234,212,0.12)" },
        showland: true,
        landcolor: "#16303f",
        showocean: true,
        oceancolor: "#04283f",
        showcoastlines: true,
        coastlinecolor: "rgba(226,232,240,0.55)",
        showcountries: true,
        countrycolor: "rgba(226,232,240,0.25)",
        bgcolor: "rgba(0,0,0,0)",
        showframe: false,
      },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 0, r: 0, t: 0, b: 0 },
      font: { color: "#cbd5e1", size: 11 },
      autosize: true,
    };

    return { data: traces, layout: geoLayout };
  }, [floats, selectedFloatId, regionId]);

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
      onClick={(event) => {
        const point = event.points?.[0] as unknown as { customdata?: string };
        if (point?.customdata) onSelectFloat(point.customdata);
      }}
    />
  );
}
