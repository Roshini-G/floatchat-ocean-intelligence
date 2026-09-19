"use client";

import { FormEvent, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading?: boolean;
}

export default function QueryBox({ value, onChange, onSubmit, loading }: Props) {
  const [localValue, setLocalValue] = useState(value);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!localValue.trim()) return;
    onSubmit(localValue.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder='Ask about ocean data, e.g. "Salinity profiles in the Arabian Sea over the last 30 days"'
        className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(45,212,191,0.12)]"
      />
      <button
        type="submit"
        disabled={loading || !localValue.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(45,212,191,0.2)] transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
            Analyzing
          </>
        ) : (
          <>Ask FloatChat</>
        )}
      </button>
    </form>
  );
}
