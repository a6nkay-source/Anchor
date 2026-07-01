"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { TrendSpark } from "@/components/trend-spark";
import { AIRecommendation } from "@/components/ai-recommendation";
import { burnoutForecast } from "@/lib/composite";
import { last30Days } from "@/lib/history";
import { AlertTriangle, TrendingUp } from "lucide-react";

export default function BurnoutPage() {
  const f = burnoutForecast();
  const history = last30Days();

  const band = (n: number) =>
    n >= 70
      ? { color: "text-rose-300", label: "high" }
      : n >= 45
      ? { color: "text-amber-300", label: "watch" }
      : { color: "text-emerald-300", label: "safe" };

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Burnout prediction."
        subtitle="Long-term trends in study hours, workload, wellness, breaks, and cognitive signals."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <ForecastTile label="Today" value={f.today} band={band(f.today)} />
        <ForecastTile label="+7 days" value={f.in7d} band={band(f.in7d)} />
        <ForecastTile label="+14 days" value={f.in14d} band={band(f.in14d)} />
      </div>

      <Card className="mt-6 bg-neutral-950/60 p-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan-300" />
          <h3 className="text-sm font-medium text-neutral-100">30-day burnout curve</h3>
        </div>
        <TrendSpark
          values={history.map((d) => d.burnoutRisk)}
          color="#fda4af"
          height={90}
        />
        <div className="mt-2 flex justify-between text-[10px] text-neutral-500">
          <span>30d ago</span>
          <span>today</span>
        </div>
      </Card>

      <Card className="mt-4 bg-neutral-950/60 p-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          <h3 className="text-sm font-medium text-neutral-100">What's driving it</h3>
        </div>
        <ul className="space-y-2">
          {f.drivers.map((d) => (
            <li key={d.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-xs text-neutral-400">{d.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
                  style={{ width: `${Math.min(100, d.contribution)}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs tabular-nums text-neutral-500">
                {d.contribution}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6">
        <AIRecommendation
          systemPrompt="You are Anchor. In 3 warm sentences, translate this burnout forecast into one concrete change the student should make this week. Kind, not alarming. No lists."
          context={`Burnout today ${f.today}, +7d ${f.in7d}, +14d ${f.in14d}. Top drivers: ${f.drivers.map((d) => d.label).join(", ")}.`}
          title="One thing to change this week"
        />
      </div>
    </div>
  );
}

function ForecastTile({
  label,
  value,
  band,
}: {
  label: string;
  value: number;
  band: { color: string; label: string };
}) {
  return (
    <Card className="relative overflow-hidden bg-neutral-950/60 p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tabular-nums text-neutral-100">{value}</span>
        <span className="text-xs text-neutral-500">/100</span>
      </div>
      <span className={`mt-1 text-xs uppercase tracking-[0.16em] ${band.color}`}>{band.label}</span>
    </Card>
  );
}
