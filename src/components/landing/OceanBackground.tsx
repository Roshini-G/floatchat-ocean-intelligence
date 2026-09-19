"use client";

import { useMemo } from "react";

// Deterministic seeded particles so server and client render identical markup.
function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export default function OceanBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => ({
      left: `${(seeded(i, 1) * 100).toFixed(3)}%`,
      size: `${(2 + seeded(i, 2) * 5).toFixed(3)}px`,
      duration: `${(14 + seeded(i, 3) * 18).toFixed(3)}s`,
      delay: `${(-(seeded(i, 4) * 30)).toFixed(3)}s`,
      opacity: (0.15 + seeded(i, 5) * 0.45).toFixed(3),
    }));
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0c2a3f_0%,_#03070d_60%)]" />
      <div
        className="caustic-layer absolute -inset-1/4 bg-[radial-gradient(ellipse_at_center,_rgba(45,212,191,0.10)_0%,_transparent_60%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(3,7,13,0.6)_70%,#03070d_100%)]" />
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle absolute bottom-0 rounded-full bg-cyan-200/70 blur-[0.5px]"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              "--particle-opacity": p.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
