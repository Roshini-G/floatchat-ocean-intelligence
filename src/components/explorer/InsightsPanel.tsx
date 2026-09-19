import { AnalysisSummary } from "@/types/argo";
import { FilteredFloat } from "@/services/dataService";

interface Props {
  insight: string;
  summary: AnalysisSummary;
  floats: FilteredFloat[];
  selectedFloatId: string | null;
  onSelectFloat: (id: string) => void;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 transition-colors duration-200 hover:border-cyan-400/20 hover:bg-white/[0.04]">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export default function InsightsPanel({
  insight,
  summary,
  floats,
  selectedFloatId,
  onSelectFloat,
}: Props) {
  return (
    <div className="scrollbar-thin flex h-full flex-col gap-4 overflow-y-auto pr-1">
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
          Natural-language insight
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{insight}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Floats matched" value={String(summary.floatCount)} />
        <StatTile label="Profile cycles" value={String(summary.cycleCount)} />
        <StatTile
          label="Thermocline"
          value={summary.thermocline.found ? `${summary.thermocline.depth} m` : "N/A"}
        />
        <StatTile
          label="Halocline"
          value={summary.salinity.found ? `${summary.salinity.haloclineDepth} m` : "N/A"}
        />
        <StatTile
          label="QC flagged"
          value={`${summary.qc.flaggedCount} / ${summary.qc.totalCount}`}
        />
        <StatTile
          label="Surface temp"
          value={summary.avgSurfaceTemp != null ? `${summary.avgSurfaceTemp.toFixed(1)}°C` : "N/A"}
        />
      </div>

      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Matched floats
        </div>
        <div className="space-y-1">
          {floats.map((f) => (
            <button
              key={f.float.id}
              onClick={() => onSelectFloat(f.float.id)}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-all duration-200 ${
                f.float.id === selectedFloatId
                  ? "bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_rgba(45,212,191,0.3)]"
                  : "text-slate-400 hover:bg-white/5"
              }`}
            >
              <span className="font-medium">{f.float.id}</span>
              <span className="text-slate-500">{f.float.regionName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
