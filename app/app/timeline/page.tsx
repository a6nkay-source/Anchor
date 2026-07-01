"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { TrendSpark } from "@/components/trend-spark";
import { last30Days, trend, avg } from "@/lib/history";
import { cn } from "@/lib/utils";

type Range = "day" | "week" | "month";

const SERIES: { key: keyof ReturnType<typeof last30Days>[number]; label: string; color: string; unit?: string }[] = [
  { key: "wellness", label: "Wellness", color: "#67e8f9" },
  { key: "focus", label: "Focus", color: "#86efac" },
  { key: "stress", label: "Stress", color: "#fda4af" },
  { key: "recovery", label: "Recovery", color: "#a78bfa" },
  { key: "productivity", label: "Productivity", color: "#fcd34d" },
  { key: "burnoutRisk", label: "Burnout risk", color: "#f472b6" },
  { key: "studyHours", label: "Study hours", color: "#67e8f9", unit: "h" },
  { key: "sleepHours", label: "Sleep hours", color: "#a78bfa", unit: "h" },
];

export default function TimelinePage() {
  const [range, setRange] = useState<Range>("month");
  const [selected, setSelected] = useState(0);

  const data = last30Days();
  const window = range === "day" ? data.slice(-1) : range === "week" ? data.slice(-7) : data;

  const s = SERIES[selected];
  const values = window.map((d) => (d[s.key] as number) ?? 0);
  const tr = trend(values);
  const average = avg(values);

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Personal Health Timeline."
        subtitle="How every dimension of your life has moved together."
        actions={
          <div className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950/60 p-1">
            {(["day", "week", "month"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs capitalize",
                  range === r ? "bg-cyan-400/20 text-cyan-100" : "text-neutral-400 hover:text-neutral-100"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {SERIES.map((x, i) => (
          <button
            key={x.key}
            onClick={() => setSelected(i)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              selected === i
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <Card className="bg-neutral-950/60 p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-100">{s.label}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              avg{" "}
              <span className="text-neutral-200">
                {average.toFixed(s.unit ? 1 : 0)}
                {s.unit ?? ""}
              </span>{" "}
              · trend{" "}
              <span
                className={cn(
                  "font-medium",
                  tr.dir === "up" ? "text-emerald-300" : tr.dir === "down" ? "text-rose-300" : "text-neutral-400"
                )}
              >
                {tr.pct >= 0 ? "+" : ""}
                {tr.pct}%
              </span>
            </p>
          </div>
        </div>
        <TrendSpark
          values={values}
          color={s.color}
          height={140}
          min={s.unit === "h" ? 0 : 0}
          max={s.unit === "h" ? Math.max(10, Math.max(...values) * 1.1) : 100}
        />
        <div className="mt-2 flex justify-between text-[10px] text-neutral-500">
          <span>{new Date(window[0].ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          <span>today</span>
        </div>
      </Card>

      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SERIES.slice(0, 4).map((x) => {
          const vals = window.map((d) => (d[x.key] as number) ?? 0);
          return (
            <Card key={x.key} className="bg-neutral-950/60 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {x.label}
                </span>
                <span className="tabular-nums text-neutral-200">
                  {vals[vals.length - 1]}
                </span>
              </div>
              <TrendSpark values={vals} color={x.color} height={36} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
