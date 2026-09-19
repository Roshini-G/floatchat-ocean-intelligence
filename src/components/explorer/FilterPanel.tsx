"use client";

import { REGIONS } from "@/data";
import { DEPTH_PRESETS } from "@/services/queryParser";
import { ParameterChoice } from "@/types/argo";

const TIME_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 60 days", value: 60 },
  { label: "Last 90 days", value: 90 },
  { label: "Last 120 days", value: 120 },
];

export interface FilterValues {
  regionId: string | null;
  days: number;
  depthRange: [number, number];
  parameter: ParameterChoice;
}

interface Props {
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  disabled?: boolean;
}

export default function FilterPanel({ values, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Region
        <select
          disabled={disabled}
          value={values.regionId ?? "all"}
          onChange={(e) =>
            onChange({
              ...values,
              regionId: e.target.value === "all" ? null : e.target.value,
            })
          }
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-white/20 focus:border-cyan-400/50 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.12)] disabled:opacity-40"
        >
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Time range
        <select
          disabled={disabled}
          value={values.days}
          onChange={(e) => onChange({ ...values, days: Number(e.target.value) })}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-white/20 focus:border-cyan-400/50 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.12)] disabled:opacity-40"
        >
          {TIME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Depth range
        <select
          disabled={disabled}
          value={values.depthRange.join("-")}
          onChange={(e) => {
            const preset = DEPTH_PRESETS.find(
              (p) => p.range.join("-") === e.target.value
            );
            if (preset) onChange({ ...values, depthRange: preset.range });
          }}
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-white/20 focus:border-cyan-400/50 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.12)] disabled:opacity-40"
        >
          {DEPTH_PRESETS.map((p) => (
            <option key={p.label} value={p.range.join("-")}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-400">
        Parameter
        <select
          disabled={disabled}
          value={values.parameter}
          onChange={(e) =>
            onChange({ ...values, parameter: e.target.value as ParameterChoice })
          }
          className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-slate-100 outline-none transition-all duration-200 hover:border-white/20 focus:border-cyan-400/50 focus:shadow-[0_0_0_3px_rgba(45,212,191,0.12)] disabled:opacity-40"
        >
          <option value="both">Temperature & Salinity</option>
          <option value="temperature">Temperature</option>
          <option value="salinity">Salinity</option>
        </select>
      </label>
    </div>
  );
}
