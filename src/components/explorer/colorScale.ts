const STOPS: { t: number; color: [number, number, number] }[] = [
  { t: -2, color: [56, 189, 248] }, // cold cyan
  { t: 10, color: [45, 212, 191] }, // teal
  { t: 20, color: [250, 204, 21] }, // warm yellow
  { t: 30, color: [251, 113, 133] }, // hot coral
];

export function temperatureToColor(temp: number): string {
  const clamped = Math.max(STOPS[0].t, Math.min(STOPS[STOPS.length - 1].t, temp));

  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const f = (clamped - a.t) / (b.t - a.t);
      const r = Math.round(a.color[0] + f * (b.color[0] - a.color[0]));
      const g = Math.round(a.color[1] + f * (b.color[1] - a.color[1]));
      const bl = Math.round(a.color[2] + f * (b.color[2] - a.color[2]));
      return `rgb(${r},${g},${bl})`;
    }
  }
  return `rgb(${STOPS[0].color.join(",")})`;
}
