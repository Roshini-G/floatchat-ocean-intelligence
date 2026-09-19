"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { AveragedLevel } from "@/analysis/averageProfile";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
      Loading chart…
    </div>
  ),
});

interface Props {
  profile: AveragedLevel[];
  kind: "temperature" | "salinity";
  referenceDepth?: number | null;
  referenceLabel?: string;
}

export default function DepthProfileChart({
  profile,
  kind,
  referenceDepth,
  referenceLabel,
}: Props) {
  const { data, layout } = useMemo(() => {
    const color = kind === "temperature" ? "#fb923c" : "#38bdf8";
    const xValues = profile.map((p) => (kind === "temperature" ? p.temperature : p.salinity));
    const yValues = profile.map((p) => p.depth);

    const traces: Data[] = [
      {
        type: "scatter",
        mode: "lines+markers",
        x: xValues,
        y: yValues,
        line: { color, width: 2, shape: "spline" },
        marker: { color, size: 5 },
        hovertemplate: `%{x:.2f} @ %{y} m<extra></extra>`,
      },
    ];

    const shapes =
      referenceDepth != null
        ? [
            {
              type: "line" as const,
              x0: 0,
              x1: 1,
              xref: "paper" as const,
              y0: referenceDepth,
              y1: referenceDepth,
              line: { color: "#94a3b8", width: 1, dash: "dot" as const },
            },
          ]
        : [];

    const annotations =
      referenceDepth != null
        ? [
            {
              x: 1,
              xref: "paper" as const,
              y: referenceDepth,
              xanchor: "right" as const,
              yanchor: "bottom" as const,
              text: referenceLabel ?? `${referenceDepth} m`,
              showarrow: false,
              font: { color: "#94a3b8", size: 10 },
            },
          ]
        : [];

    const chartLayout: Partial<Layout> = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 44, r: 16, t: 8, b: 36 },
      font: { color: "#cbd5e1", size: 11 },
      xaxis: {
        title: { text: kind === "temperature" ? "Temperature (°C)" : "Salinity (PSU)" },
        gridcolor: "rgba(148,163,184,0.12)",
        zeroline: false,
      },
      yaxis: {
        title: { text: "Depth (m)" },
        autorange: "reversed",
        gridcolor: "rgba(148,163,184,0.12)",
        zeroline: false,
      },
      shapes,
      annotations,
      autosize: true,
    };

    return { data: traces, layout: chartLayout };
  }, [profile, kind, referenceDepth, referenceLabel]);

  if (profile.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        No clean data points in this range.
      </div>
    );
  }

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
    />
  );
}
