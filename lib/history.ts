// 30 days of simulated daily wellness/study history — realistic enough for
// timeline, burnout, and readiness views. Deterministic so charts don't
// jitter on refresh.

export interface DayEntry {
  ts: number; // start of day
  wellness: number; // 0-100
  focus: number;
  stress: number;
  recovery: number;
  productivity: number;
  burnoutRisk: number;
  studyHours: number;
  sleepHours: number;
  breakMinutes: number;
  workloadHours: number; // assignments due this day, weighted
}

// small deterministic PRNG so the "randomness" is stable
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

let cache: DayEntry[] | null = null;

export function last30Days(): DayEntry[] {
  if (cache) return cache;
  const rand = mulberry32(20261101);
  const now = new Date();
  const days: DayEntry[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay(); // 0..6, 0 = Sun

    // sleep tends to be worse on Wed/Thu, recover on weekend
    const sleepBase = dow === 0 || dow === 6 ? 8.2 : 7.1;
    const sleepHours = clamp(sleepBase + (rand() - 0.5) * 1.6, 5, 10);

    // stress spike ~day 22 (midterm week), then relaxes
    const midtermSpike =
      i < 8 && i > 2 ? 22 - Math.abs(5 - (7 - i)) * 3 : 0;
    const stress = clamp(
      35 + midtermSpike + (rand() - 0.5) * 18 + (dow === 1 ? 6 : 0),
      10,
      95
    );

    const studyHours = clamp(
      dow === 0 ? 1.5 : dow === 6 ? 2.4 : 3.6 + (rand() - 0.5) * 2 + midtermSpike * 0.05,
      0.5,
      8
    );
    const breakMinutes = clamp(
      studyHours * 8 + (rand() - 0.5) * 10,
      5,
      120
    );
    const workloadHours = clamp(
      studyHours * (0.7 + rand() * 0.5) + midtermSpike * 0.08,
      0,
      10
    );

    const recovery = clamp(
      55 + (sleepHours - 7) * 12 - (stress - 40) * 0.4 + (rand() - 0.5) * 10,
      15,
      98
    );

    const focus = clamp(
      50 + recovery * 0.25 - stress * 0.3 + (rand() - 0.5) * 12,
      15,
      95
    );

    const productivity = clamp(
      studyHours * 8 + focus * 0.3 - stress * 0.2 + (rand() - 0.5) * 8,
      10,
      100
    );

    const wellness = clamp(
      100 - stress * 0.45 + recovery * 0.25 + (focus - 55) * 0.2,
      15,
      98
    );

    const burnoutRisk = clamp(
      50 + stress * 0.4 - recovery * 0.3 + Math.max(0, workloadHours - 4) * 8,
      5,
      95
    );

    days.push({
      ts: d.getTime(),
      wellness: Math.round(wellness),
      focus: Math.round(focus),
      stress: Math.round(stress),
      recovery: Math.round(recovery),
      productivity: Math.round(productivity),
      burnoutRisk: Math.round(burnoutRisk),
      studyHours: +studyHours.toFixed(1),
      sleepHours: +sleepHours.toFixed(1),
      breakMinutes: Math.round(breakMinutes),
      workloadHours: +workloadHours.toFixed(1),
    });
  }
  cache = days;
  return days;
}

export function slice(range: "week" | "month" | "day", data = last30Days()): DayEntry[] {
  if (range === "day") return data.slice(-1);
  if (range === "week") return data.slice(-7);
  return data;
}

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Trend direction and pct change vs prior half of the window.
export function trend(nums: number[]) {
  if (nums.length < 4) return { pct: 0, dir: "flat" as "up" | "down" | "flat" };
  const half = Math.floor(nums.length / 2);
  const a = avg(nums.slice(0, half));
  const b = avg(nums.slice(-half));
  const delta = b - a;
  const pct = a === 0 ? 0 : (delta / a) * 100;
  return {
    pct: Math.round(pct * 10) / 10,
    dir: Math.abs(pct) < 2 ? ("flat" as const) : pct > 0 ? ("up" as const) : ("down" as const),
  };
}
