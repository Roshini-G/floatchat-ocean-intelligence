"use client";

import Link from "next/link";
import OceanBackground from "@/components/landing/OceanBackground";
import FeatureCards from "@/components/landing/FeatureCards";
import MagneticButton from "@/components/landing/MagneticButton";
import ExplorerPreview from "@/components/landing/ExplorerPreview";
import { useReveal } from "@/hooks/useReveal";

export default function Home() {
  const { ref: previewRef, visible: previewVisible } = useReveal<HTMLDivElement>();
  const { ref: capabilitiesRef, visible: capabilitiesVisible } = useReveal<HTMLDivElement>();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <OceanBackground />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌊</span>
          <span className="text-lg font-semibold tracking-tight">FloatChat</span>
        </div>
        <Link
          href="/explorer"
          className="rounded-full border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/10"
        >
          Launch Explorer
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 py-16 text-center sm:px-10">
        <div className="animate-[fadeUp_0.9s_ease-out] flex flex-col items-center">
          <span className="mb-6 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-cyan-300">
            ARGO Ocean Intelligence
          </span>

          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Explore the Ocean.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-teal-200 bg-clip-text text-transparent">
              Ask the Data.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Multi-modal intelligence for exploring, analysing and visualising ARGO
            oceanographic data.
          </p>

          <div className="mt-10">
            <MagneticButton href="/explorer">
              Launch Explorer
              <span aria-hidden>→</span>
            </MagneticButton>
          </div>
        </div>

        <div
          ref={previewRef}
          className={`mt-20 w-full transition-all duration-1000 ease-out ${
            previewVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <ExplorerPreview />
        </div>

        <div
          ref={capabilitiesRef}
          className={`mt-20 w-full max-w-5xl transition-all duration-1000 ease-out ${
            capabilitiesVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <FeatureCards />
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center text-xs text-slate-500 sm:px-10">
        FloatChat prototype · Demo ARGO data for evaluation purposes only
      </footer>
    </div>
  );
}
