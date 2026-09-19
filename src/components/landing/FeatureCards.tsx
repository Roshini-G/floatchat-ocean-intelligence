"use client";

import { useReveal } from "@/hooks/useReveal";

const FEATURES = [
  {
    title: "Natural Language Intelligence",
    description:
      "Ask for exactly the ocean data you need — region, time window, depth and parameter — in plain English.",
    icon: "💬",
  },
  {
    title: "Scientific Ocean Analysis",
    description:
      "Automatic thermocline detection, salinity-gradient calculation and QC filtering on every query.",
    icon: "📈",
  },
  {
    title: "4D Ocean Visualization",
    description:
      "Rotate and inspect float trajectories in longitude, latitude, depth and time with an interactive 3D scene.",
    icon: "🌐",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      className={`group rounded-2xl border border-cyan-500/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-700 ease-out hover:-translate-y-1.5 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(45,212,191,0.12)] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      <div className="mb-4 text-3xl">{feature.icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-100">{feature.title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
    </div>
  );
}

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {FEATURES.map((feature, index) => (
        <FeatureCard key={feature.title} feature={feature} index={index} />
      ))}
    </div>
  );
}
