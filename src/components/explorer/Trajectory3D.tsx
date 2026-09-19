"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Instance, Instances, Line, OrbitControls } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FilteredFloat } from "@/services/dataService";
import { temperatureToColor } from "./colorScale";
import { ANCHOR_DATE } from "@/data";

const ANCHOR_TIME = ANCHOR_DATE.getTime();

const LON_CENTER = 72.5;
const LAT_CENTER = -6;
const SCALE_XY = 0.4;
const SCALE_Z = 1 / 90;
const SAMPLE_DEPTHS = [0, 100, 300, 700, 1200, 2000];
const DEPTH_TICKS = [0, 500, 1000, 1500, 2000];
const PLAYBACK_SECONDS = 26; // real seconds to sweep the full time range at 1x
const SPEEDS = [0.5, 1, 2, 4] as const;
const TRAIL_SUBDIVISIONS = 6; // particles interpolated between each real cycle fix
const DIVE_MAX_DEPTH = 1100; // visual profiling excursion between surfacings

const REGION_COLORS: Record<string, string> = {
  arabian_sea: "#38bdf8",
  bay_of_bengal: "#a78bfa",
  equatorial_indian_ocean: "#34d399",
  andaman_sea: "#fbbf24",
  southern_indian_ocean: "#fb7185",
};

const DEPTH_LAYER_COLORS: Record<number, string> = {
  0: "#123c54",
  500: "#0c2c40",
  1000: "#082030",
  1500: "#051622",
  2000: "#030d15",
};

// --- Small hand-written GLSL, kept intentionally tiny: gives soft, glowing,
// per-vertex-faded particles/halos without pulling in a postprocessing stack.
const GLOW_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const GLOW_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * uIntensity);
  }
`;
const PARTICLE_VERTEX_SHADER = `
  attribute vec4 aColor;
  varying vec4 vColor;
  uniform float uSize;
  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (220.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const PARTICLE_FRAGMENT_SHADER = `
  varying vec4 vColor;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.05, d) * vColor.a;
    gl_FragColor = vec4(vColor.rgb, alpha);
  }
`;

function project(lon: number, lat: number, depth: number): [number, number, number] {
  return [(lon - LON_CENTER) * SCALE_XY, (lat - LAT_CENTER) * SCALE_XY, -depth * SCALE_Z];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Subdivides a sparse surface trail into a denser, fading particle stream —
// the "elegant particle trail" in place of a flat polyline.
function densifyTrail(
  fixes: [number, number, number][],
  color: THREE.Color,
  subdivisions: number
): { positions: [number, number, number][]; colors: [number, number, number, number][] } {
  const positions: [number, number, number][] = [];
  const colors: [number, number, number, number][] = [];
  const n = fixes.length;
  if (n === 0) return { positions, colors };

  const totalSteps = (n - 1) * subdivisions;
  for (let i = 0; i < n - 1; i++) {
    const a = fixes[i];
    const b = fixes[i + 1];
    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      const globalStep = i * subdivisions + s;
      const fade = totalSteps === 0 ? 1 : 0.12 + 0.88 * (globalStep / totalSteps);
      positions.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);
      colors.push([color.r, color.g, color.b, fade]);
    }
  }
  positions.push(fixes[n - 1]);
  colors.push([color.r, color.g, color.b, 1]);

  return { positions, colors };
}

function ParticleTrail({
  positions,
  colors,
  size,
}: {
  positions: [number, number, number][];
  colors: [number, number, number, number][];
  size: number;
}) {
  const { posArray, colorArray } = useMemo(() => {
    const posArray = new Float32Array(positions.length * 3);
    const colorArray = new Float32Array(colors.length * 4);
    positions.forEach((p, i) => {
      posArray[i * 3] = p[0];
      posArray[i * 3 + 1] = p[1];
      posArray[i * 3 + 2] = p[2];
    });
    colors.forEach((c, i) => {
      colorArray[i * 4] = c[0];
      colorArray[i * 4 + 1] = c[1];
      colorArray[i * 4 + 2] = c[2];
      colorArray[i * 4 + 3] = c[3];
    });
    return { posArray, colorArray };
  }, [positions, colors]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uSize: { value: size } },
        vertexShader: PARTICLE_VERTEX_SHADER,
        fragmentShader: PARTICLE_FRAGMENT_SHADER,
      }),
    [size]
  );

  if (positions.length === 0) return null;

  return (
    <points material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posArray, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colorArray, 4]} />
      </bufferGeometry>
    </points>
  );
}

function GlowBillboard({
  color,
  radius,
  intensity,
  pulse = false,
}: {
  color: string;
  radius: number;
  intensity: number;
  pulse?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
        },
        vertexShader: GLOW_VERTEX_SHADER,
        fragmentShader: GLOW_FRAGMENT_SHADER,
      }),
    [color, intensity]
  );

  useFrame(({ clock }) => {
    if (pulse && meshRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.12;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <Billboard>
      <mesh ref={meshRef} material={material}>
        <circleGeometry args={[radius, 32]} />
      </mesh>
    </Billboard>
  );
}

interface PointInfo {
  floatId: string;
  date: string;
  lat: number;
  lon: number;
  depth: number;
  temperature: number;
  salinity: number;
}

interface ClockProps {
  isPlaying: boolean;
  speed: number;
  minTime: number;
  maxTime: number;
  onAdvance: (updater: (t: number) => number) => void;
}

// Lives inside the R3F render loop; advances the shared `currentTime` state
// based on real elapsed time, throttled so we don't re-render React at 60fps.
function Clock({ isPlaying, speed, minTime, maxTime, onAdvance }: ClockProps) {
  const pendingMs = useRef(0);
  const sinceFlush = useRef(0);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    const span = Math.max(maxTime - minTime, 1);
    const msPerSecond = (span / PLAYBACK_SECONDS) * speed;
    pendingMs.current += delta * msPerSecond;
    sinceFlush.current += delta;
    if (sinceFlush.current < 0.08) return;

    sinceFlush.current = 0;
    const add = pendingMs.current;
    pendingMs.current = 0;

    onAdvance((t) => {
      const next = t + add;
      return next >= maxTime ? minTime : next;
    });
  });

  return null;
}

interface SceneProps {
  floats: FilteredFloat[];
  currentTime: number;
  selectedFloatId: string | null;
  onHover: (info: PointInfo | null) => void;
  onSelect: (id: string) => void;
}

function Scene({ floats, currentTime, selectedFloatId, onHover, onSelect }: SceneProps) {
  const { trails, points, markers } = useMemo(() => {
    const trails: {
      key: string;
      floatId: string;
      guidePositions: [number, number, number][];
      guideColor: string;
      particlePositions: [number, number, number][];
      particleColors: [number, number, number, number][];
    }[] = [];
    const points: {
      key: string;
      position: [number, number, number];
      color: string;
      info: PointInfo;
    }[] = [];
    const markers: {
      key: string;
      floatId: string;
      position: [number, number, number];
      color: string;
      info: PointInfo;
      isSelected: boolean;
    }[] = [];

    for (const f of floats) {
      const visibleCycles = f.cyclesInWindow.filter(
        (c) => new Date(c.date).getTime() <= currentTime
      );
      if (visibleCycles.length === 0) continue;

      const baseColor = new THREE.Color(REGION_COLORS[f.float.regionId] ?? "#38bdf8");
      const surfaceFixes = visibleCycles.map((c) => project(c.lon, c.lat, 0));
      const { positions: particlePositions, colors: particleColors } = densifyTrail(
        surfaceFixes,
        baseColor,
        TRAIL_SUBDIVISIONS
      );

      trails.push({
        key: `${f.float.id}-trail`,
        floatId: f.float.id,
        guidePositions: surfaceFixes,
        guideColor: `#${baseColor.getHexString()}`,
        particlePositions,
        particleColors,
      });

      for (const cycle of visibleCycles) {
        for (const targetDepth of SAMPLE_DEPTHS) {
          const level = cycle.levels.reduce((closest, l) =>
            Math.abs(l.depth - targetDepth) < Math.abs(closest.depth - targetDepth) ? l : closest
          );
          points.push({
            key: `${f.float.id}-${cycle.cycleNumber}-${level.depth}`,
            position: project(cycle.lon, cycle.lat, level.depth),
            color: temperatureToColor(level.temperature),
            info: {
              floatId: f.float.id,
              date: cycle.date,
              lat: cycle.lat,
              lon: cycle.lon,
              depth: level.depth,
              temperature: level.temperature,
              salinity: level.salinity,
            },
          });
        }
      }

      // Interpolated "current position" marker: drifts laterally between the
      // two cycles that bracket `currentTime`, and — since a real ARGO float
      // dives to profile and resurfaces to transmit — dips in depth mid-transit
      // so the animation is genuinely 4D (X, Y and Z all move with T).
      const prevCycle = visibleCycles[visibleCycles.length - 1];
      const nextCycle = f.cyclesInWindow.find(
        (c) => new Date(c.date).getTime() > currentTime
      );
      let lat = prevCycle.lat;
      let lon = prevCycle.lon;
      let displayDepth = 0;
      if (nextCycle) {
        const prevTime = new Date(prevCycle.date).getTime();
        const nextTime = new Date(nextCycle.date).getTime();
        const span = nextTime - prevTime;
        const t = span > 0 ? (currentTime - prevTime) / span : 0;
        lat = lerp(prevCycle.lat, nextCycle.lat, t);
        lon = lerp(prevCycle.lon, nextCycle.lon, t);
        displayDepth = Math.sin(t * Math.PI) * DIVE_MAX_DEPTH;
      }
      const levelAtDepth = prevCycle.levels.reduce((closest, l) =>
        Math.abs(l.depth - displayDepth) < Math.abs(closest.depth - displayDepth) ? l : closest
      );

      markers.push({
        key: `${f.float.id}-marker`,
        floatId: f.float.id,
        position: project(lon, lat, displayDepth),
        color: temperatureToColor(levelAtDepth.temperature),
        isSelected: f.float.id === selectedFloatId,
        info: {
          floatId: f.float.id,
          date: prevCycle.date,
          lat,
          lon,
          depth: Math.round(displayDepth),
          temperature: levelAtDepth.temperature,
          salinity: levelAtDepth.salinity,
        },
      });
    }

    return { trails, points, markers };
  }, [floats, currentTime, selectedFloatId]);

  return (
    <>
      <fogExp2 attach="fog" args={["#031018", 0.03]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[10, 10, 10]} intensity={0.45} />
      <pointLight position={[0, 6, 4]} intensity={0.5} color="#5eead4" />

      {/* Sunlit surface glow — a faint ambient wash, sized well beyond the
          data domain so its edge never appears as a distracting shape */}
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[140, 48]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.02} depthWrite={false} />
      </mesh>

      {/* Stratified depth layers the floats visibly move through — large
          enough that only their colour (not their boundary) is ever seen */}
      {DEPTH_TICKS.map((depth) => (
        <mesh key={depth} position={[0, 0, -depth * SCALE_Z]}>
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial
            color={DEPTH_LAYER_COLORS[depth]}
            transparent
            opacity={0.045}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {trails.map((trail) => {
        const isSelected = trail.floatId === selectedFloatId;
        return (
          <group key={trail.key}>
            <Line
              points={trail.guidePositions}
              color={trail.guideColor}
              transparent
              opacity={isSelected ? 0.5 : 0.22}
              lineWidth={isSelected ? 1.6 : 0.9}
            />
            <ParticleTrail
              positions={trail.particlePositions}
              colors={trail.particleColors}
              size={isSelected ? 9 : 5.5}
            />
          </group>
        );
      })}

      <Instances limit={2000}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial toneMapped={false} />
        {points.map((p) => (
          <Instance
            key={p.key}
            position={p.position}
            color={p.color}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(p.info);
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(p.info.floatId);
            }}
          />
        ))}
      </Instances>

      {markers.map((m) => (
        <group key={m.key} position={m.position}>
          <GlowBillboard
            color={m.color}
            radius={m.isSelected ? 0.85 : 0.5}
            intensity={m.isSelected ? 1.2 : 0.75}
            pulse={m.isSelected}
          />
          <mesh
            onPointerOver={(e) => {
              e.stopPropagation();
              onHover(m.info);
            }}
            onPointerOut={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(m.floatId);
            }}
          >
            <sphereGeometry args={[m.isSelected ? 0.24 : 0.16, 16, 16]} />
            <meshStandardMaterial
              color={m.color}
              emissive={m.color}
              emissiveIntensity={m.isSelected ? 1.2 : 0.7}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

interface Props {
  floats: FilteredFloat[];
  selectedFloatId?: string | null;
  onSelectFloat?: (id: string) => void;
}

export default function Trajectory3D({
  floats,
  selectedFloatId = null,
  onSelectFloat = () => {},
}: Props) {
  const [hovered, setHovered] = useState<PointInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);

  const { minTime, maxTime } = useMemo(() => {
    const times = floats.flatMap((f) => f.cyclesInWindow.map((c) => new Date(c.date).getTime()));
    if (times.length === 0) {
      return { minTime: ANCHOR_TIME, maxTime: ANCHOR_TIME };
    }
    return { minTime: Math.min(...times), maxTime: Math.max(...times) };
  }, [floats]);

  const [currentTime, setCurrentTime] = useState(maxTime);

  // Reset playback whenever the underlying query/filter results change
  // (React-recommended "adjust state during render" pattern).
  const rangeKey = `${minTime}-${maxTime}`;
  const [prevRangeKey, setPrevRangeKey] = useState(rangeKey);
  if (rangeKey !== prevRangeKey) {
    setPrevRangeKey(rangeKey);
    setCurrentTime(minTime);
    setIsPlaying(true);
  }

  const progressPct = maxTime > minTime ? ((currentTime - minTime) / (maxTime - minTime)) * 100 : 0;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="relative flex-1 overflow-hidden rounded-lg bg-[radial-gradient(ellipse_at_50%_25%,#0a2536_0%,#01050a_75%)]">
        {floats.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
            No trajectories to display.
          </div>
        ) : (
          <Canvas camera={{ position: [16, 14, 18], fov: 45 }}>
            <Clock
              isPlaying={isPlaying}
              speed={speed}
              minTime={minTime}
              maxTime={maxTime}
              onAdvance={setCurrentTime}
            />
            <Scene
              floats={floats}
              currentTime={currentTime}
              selectedFloatId={selectedFloatId}
              onHover={setHovered}
              onSelect={onSelectFloat}
            />
            <OrbitControls
              enableDamping
              dampingFactor={0.1}
              enablePan
              minDistance={4}
              maxDistance={60}
            />
          </Canvas>
        )}

        <div className="pointer-events-none absolute left-3 top-3 max-w-[60%] rounded-md bg-black/50 px-2 py-1 text-[10px] text-slate-300 backdrop-blur-sm">
          Drag · rotate · scroll · zoom · click a float
        </div>

        {floats.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col gap-1 rounded-md bg-black/50 px-2 py-1.5 text-[9px] text-slate-400 backdrop-blur-sm">
            <span className="mb-0.5 text-slate-500">Depth</span>
            {DEPTH_TICKS.map((d) => (
              <span key={d}>{d} m</span>
            ))}
          </div>
        )}

        {hovered && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-cyan-400/20 bg-black/70 px-3 py-2 text-xs text-slate-200 backdrop-blur-sm">
            <div className="font-semibold text-cyan-300">{hovered.floatId}</div>
            <div>{new Date(hovered.date).toLocaleDateString()}</div>
            <div>
              {hovered.lat.toFixed(2)}°, {hovered.lon.toFixed(2)}° · {hovered.depth} m
            </div>
            <div>
              {hovered.temperature.toFixed(2)}°C · {hovered.salinity.toFixed(2)} PSU
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 px-1">
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          disabled={floats.length === 0}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200 transition-colors hover:bg-cyan-400/25 disabled:opacity-30"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "❙❙" : "▶"}
        </button>

        <input
          type="range"
          min={0}
          max={1000}
          value={progressPct * 10}
          onChange={(e) => {
            setIsPlaying(false);
            const pct = Number(e.target.value) / 1000;
            setCurrentTime(minTime + (maxTime - minTime) * pct);
          }}
          disabled={floats.length === 0}
          className="h-1 flex-1 accent-cyan-400 disabled:opacity-30"
        />

        <span className="w-20 shrink-0 text-right text-[10px] text-slate-400">
          {new Date(currentTime).toLocaleDateString()}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                speed === s ? "bg-cyan-400/25 text-cyan-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
