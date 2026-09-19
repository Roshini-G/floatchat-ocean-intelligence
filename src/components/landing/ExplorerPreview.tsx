"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { temperatureToColor } from "@/components/explorer/colorScale";

function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildArc(seed: number, count = 24) {
  const points: [number, number, number][] = [];
  const startAngle = seeded(seed, 1) * Math.PI * 2;
  const radius = 2.2 + seeded(seed, 2) * 1.4;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angle = startAngle + t * (0.9 + seeded(seed, 3) * 0.6);
    const depth = -t * (3 + seeded(seed, 4) * 2.5);
    points.push([Math.cos(angle) * radius, depth, Math.sin(angle) * radius]);
  }
  return points;
}

function RotatingScene() {
  const group = useRef<THREE.Group>(null);

  const arcs = useMemo(
    () =>
      [0, 1, 2].map((seed) => ({
        points: buildArc(seed),
        color: temperatureToColor(6 + seed * 10),
      })),
    []
  );

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={group} position={[0, 1, 0]}>
      {arcs.map((arc, i) => (
        <group key={i}>
          <Line points={arc.points} color={arc.color} lineWidth={2} transparent opacity={0.85} />
          <mesh position={arc.points[arc.points.length - 1]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshBasicMaterial color={arc.color} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <gridHelper args={[8, 8, "#134152", "#0b2635"]} />
    </group>
  );
}

export default function ExplorerPreview() {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_0_80px_rgba(8,30,45,0.6)] backdrop-blur-xl">
      <div className="flex items-center gap-1.5 border-b border-white/5 bg-black/20 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 text-xs text-slate-400">FloatChat Explorer</span>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3">
        <div className="relative h-56 overflow-hidden rounded-xl bg-[#020a12] sm:col-span-2 sm:h-64">
          <Canvas camera={{ position: [5, 3, 6], fov: 45 }}>
            <ambientLight intensity={1} />
            <RotatingScene />
          </Canvas>
          <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/50 px-2 py-1 text-[10px] text-slate-400">
            X = Lon · Y = Lat · Z = Depth · T = Time
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wide text-slate-500">
              Temperature vs Depth
            </div>
            <svg viewBox="0 0 100 40" className="h-10 w-full">
              <polyline
                points="2,4 15,6 28,10 40,22 52,30 65,34 78,36 95,37"
                fill="none"
                stroke="#fb923c"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wide text-cyan-400">
              Insight
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Thermocline near 68 m · salinity rising with depth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
