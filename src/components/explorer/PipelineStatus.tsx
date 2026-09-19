export const PIPELINE_STAGES = ["Query", "Interpret", "Filter", "Analyze", "Visualize"] as const;

interface Props {
  stage: number;
}

export default function PipelineStatus({ stage }: Props) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      {PIPELINE_STAGES.map((label, i) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors duration-300 ${
              i < stage
                ? "bg-cyan-400/15 text-cyan-200"
                : i === stage
                  ? "bg-cyan-400/25 text-cyan-100"
                  : "bg-white/[0.03] text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                i === stage
                  ? "animate-pulse bg-cyan-300"
                  : i < stage
                    ? "bg-cyan-400/70"
                    : "bg-slate-600"
              }`}
            />
            {label}
          </span>
          {i < PIPELINE_STAGES.length - 1 && (
            <span className={`h-px w-3 ${i < stage ? "bg-cyan-400/40" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
