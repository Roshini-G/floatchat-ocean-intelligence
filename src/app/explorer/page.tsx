"use client";

import Link from "next/link";
import { ReactNode, useMemo, useRef, useState } from "react";
import QueryBox from "@/components/explorer/QueryBox";
import ExampleQueries from "@/components/explorer/ExampleQueries";
import FilterPanel, { FilterValues } from "@/components/explorer/FilterPanel";
import FloatMap from "@/components/explorer/FloatMap";
import DepthProfileChart from "@/components/explorer/DepthProfileChart";
import Trajectory3D from "@/components/explorer/Trajectory3D";
import InsightsPanel from "@/components/explorer/InsightsPanel";
import EmptyState from "@/components/explorer/EmptyState";
import SkeletonBlock from "@/components/explorer/SkeletonBlock";
import PipelineStatus, { PIPELINE_STAGES } from "@/components/explorer/PipelineStatus";
import { parseQuery, DEPTH_PRESETS, DEFAULT_DAYS } from "@/services/queryParser";
import { filterFloats } from "@/services/dataService";
import { buildAnalysisSummary } from "@/analysis";
import { buildInsight } from "@/analysis/insight";
import { REGIONS } from "@/data";
import { ParsedQuery } from "@/types/argo";

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-colors duration-300 hover:border-white/15 ${className}`}
    >
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

function mergeFilterValues(base: ParsedQuery, values: FilterValues): ParsedQuery {
  const region = REGIONS.find((r) => r.id === values.regionId) ?? null;
  const depthPreset = DEPTH_PRESETS.find(
    (p) => p.range[0] === values.depthRange[0] && p.range[1] === values.depthRange[1]
  );

  return {
    ...base,
    regionId: values.regionId,
    regionName: region?.name ?? null,
    days: values.days,
    depthRange: values.depthRange,
    depthLabel: depthPreset?.label ?? `${values.depthRange[0]}-${values.depthRange[1]} m`,
    parameter: values.parameter,
  };
}

const STAGE_STEP_MS = 160;

export default function ExplorerPage() {
  const [queryText, setQueryText] = useState("");
  const [activeQuery, setActiveQuery] = useState<ParsedQuery | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFloatId, setSelectedFloatId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  function runStagedPipeline(onDone: () => void, fromStage = 0) {
    clearTimers();
    setLoading(true);
    setStage(fromStage);
    for (let i = fromStage; i < PIPELINE_STAGES.length; i++) {
      const id = window.setTimeout(() => setStage(i), (i - fromStage) * STAGE_STEP_MS);
      timers.current.push(id);
    }
    const finalId = window.setTimeout(
      () => {
        onDone();
        setLoading(false);
      },
      (PIPELINE_STAGES.length - fromStage) * STAGE_STEP_MS
    );
    timers.current.push(finalId);
  }

  function runQuery(text: string) {
    setError(null);
    setQueryText(text);

    runStagedPipeline(() => {
      try {
        const parsed = parseQuery(text);
        setActiveQuery(parsed);
        setSelectedFloatId(null);
      } catch {
        setError("Could not interpret that query. Try one of the example queries below.");
      }
    }, 0);
  }

  const filteredFloats = useMemo(
    () => (activeQuery ? filterFloats(activeQuery) : []),
    [activeQuery]
  );

  const summary = useMemo(
    () => (activeQuery ? buildAnalysisSummary(filteredFloats, activeQuery) : null),
    [filteredFloats, activeQuery]
  );

  const insight = useMemo(
    () => (activeQuery && summary ? buildInsight(summary, activeQuery) : ""),
    [summary, activeQuery]
  );

  const filterValues: FilterValues = activeQuery
    ? {
        regionId: activeQuery.regionId,
        days: activeQuery.days,
        depthRange: activeQuery.depthRange,
        parameter: activeQuery.parameter,
      }
    : {
        regionId: null,
        days: DEFAULT_DAYS,
        depthRange: [0, 2000],
        parameter: "both",
      };

  function handleFilterChange(values: FilterValues) {
    // Filters skip straight to "Filter" — the query was already interpreted.
    runStagedPipeline(() => {
      setActiveQuery((prev) => {
        const base =
          prev ?? {
            raw: queryText || "All ARGO floats",
            regionId: null,
            regionName: null,
            days: DEFAULT_DAYS,
            depthLabel: "Full depth (0-2000 m)",
            depthRange: [0, 2000] as [number, number],
            parameter: "both" as const,
          };
        return mergeFilterValues(base, values);
      });
    }, 2);
  }

  const effectiveFloatId =
    selectedFloatId && filteredFloats.some((f) => f.float.id === selectedFloatId)
      ? selectedFloatId
      : filteredFloats[0]?.float.id ?? null;

  const showGrid = Boolean(activeQuery) || loading;

  return (
    <div className="flex min-h-screen flex-col bg-[#03070d]">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🌊</span>
          <span className="text-lg font-semibold tracking-tight text-slate-100">
            FloatChat
          </span>
          <span className="ml-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cyan-300">
            Explorer
          </span>
        </Link>
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          ← Back to home
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
          <QueryBox
            value={queryText}
            onChange={setQueryText}
            onSubmit={runQuery}
            loading={loading}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <ExampleQueries onSelect={runQuery} disabled={loading} />
            {loading && <PipelineStatus stage={stage} />}
          </div>
          {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          <div className="mt-4 border-t border-white/5 pt-4">
            <FilterPanel
              values={filterValues}
              onChange={handleFilterChange}
              disabled={loading || !activeQuery}
            />
          </div>
        </section>

        {!showGrid && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <EmptyState message='Enter a query above or pick an example, e.g. "Show temperature and salinity profiles for ARGO floats in the Arabian Sea during the last 30 days."' />
          </section>
        )}

        {showGrid && (
          <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel
              title="ARGO Float Map"
              subtitle="Trajectories for matched floats — click a marker to inspect"
              className="h-[420px] xl:col-span-2"
            >
              {loading ? (
                <SkeletonBlock />
              ) : filteredFloats.length === 0 ? (
                <EmptyState message="No ARGO floats matched this query. Try a wider time range, a different region, or a broader depth range." />
              ) : (
                <FloatMap
                  floats={filteredFloats}
                  selectedFloatId={effectiveFloatId}
                  onSelectFloat={setSelectedFloatId}
                  regionId={activeQuery?.regionId ?? null}
                />
              )}
            </Panel>

            <Panel
              title="Insights"
              subtitle={activeQuery?.depthLabel ?? ""}
              className="h-[420px]"
            >
              {loading ? (
                <SkeletonBlock />
              ) : (
                summary && (
                  <InsightsPanel
                    insight={insight}
                    summary={summary}
                    floats={filteredFloats}
                    selectedFloatId={effectiveFloatId}
                    onSelectFloat={setSelectedFloatId}
                  />
                )
              )}
            </Panel>

            <Panel
              title="Temperature vs Depth"
              subtitle="DEMO ARGO DATA — dashed line marks the thermocline"
              className="h-[340px]"
            >
              {loading ? (
                <SkeletonBlock />
              ) : activeQuery?.parameter === "salinity" ? (
                <EmptyState message="Switch parameter to Temperature to view this chart." />
              ) : summary ? (
                <DepthProfileChart
                  profile={summary.profile}
                  kind="temperature"
                  referenceDepth={summary.thermocline.depth}
                  referenceLabel="Thermocline"
                />
              ) : null}
            </Panel>

            <Panel
              title="Salinity vs Depth"
              subtitle="DEMO ARGO DATA — dashed line marks the halocline"
              className="h-[340px]"
            >
              {loading ? (
                <SkeletonBlock />
              ) : activeQuery?.parameter === "temperature" ? (
                <EmptyState message="Switch parameter to Salinity to view this chart." />
              ) : summary ? (
                <DepthProfileChart
                  profile={summary.profile}
                  kind="salinity"
                  referenceDepth={summary.salinity.haloclineDepth}
                  referenceLabel="Halocline"
                />
              ) : null}
            </Panel>

            <Panel
              title="4D Trajectory Visualization"
              subtitle="X = Longitude · Y = Latitude · Z = Depth · T = Time"
              className="h-[420px] xl:col-span-1"
            >
              {loading ? (
                <SkeletonBlock />
              ) : (
                <Trajectory3D
                  floats={filteredFloats}
                  selectedFloatId={effectiveFloatId}
                  onSelectFloat={setSelectedFloatId}
                />
              )}
            </Panel>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 px-6 py-4 text-center text-[11px] text-slate-500">
        DEMO ARGO DATA — synthetic profiles generated for prototype demonstration only, not
        observational data.
      </footer>
    </div>
  );
}
