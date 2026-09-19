export const EXAMPLE_QUERIES = [
  "Show temperature and salinity profiles for ARGO floats in the Arabian Sea during the last 30 days",
  "Compare salinity in the Bay of Bengal over the last 60 days at shallow depth",
  "Temperature profile in the Equatorial Indian Ocean for the last 90 days",
  "Deep water salinity trend in the Southern Indian Ocean, last 120 days",
  "Andaman Sea temperature between 0 and 200 m in the last 30 days",
];

interface Props {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

export default function ExampleQueries({ onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLE_QUERIES.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(q)}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100 hover:shadow-[0_0_16px_rgba(45,212,191,0.15)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          title={q}
        >
          {q.length > 56 ? `${q.slice(0, 56)}…` : q}
        </button>
      ))}
    </div>
  );
}
