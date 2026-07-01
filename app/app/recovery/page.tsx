"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { HealthTile } from "@/components/health-tile";
import { TrendSpark } from "@/components/trend-spark";
import { AIRecommendation } from "@/components/ai-recommendation";
import { last30Days, avg } from "@/lib/history";
import { useSignals } from "@/components/signals-store";
import { Moon, Sun } from "lucide-react";

export default function RecoveryPage() {
  const { state } = useSignals();
  const history = last30Days();
  const week = history.slice(-7);
  const recovery = Math.round(avg(week.map((d) => d.recovery)));
  const sleep = avg(week.map((d) => d.sleepHours));
  const stress = Math.round(avg(week.map((d) => d.stress)));

  const intensity =
    recovery >= 80 ? "high" : recovery >= 60 ? "moderate" : recovery >= 40 ? "light" : "rest";
  const intensityColor =
    intensity === "high"
      ? "text-emerald-300"
      : intensity === "moderate"
      ? "text-cyan-300"
      : intensity === "light"
      ? "text-amber-300"
      : "text-rose-300";

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Sleep & Recovery."
        subtitle="How your body is doing under the studying — and what intensity you can afford today."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
          <p className="text-[10px] uppercase tracking-[0.24em] text-violet-300/70">Recovery</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-7xl font-semibold tabular-nums text-neutral-100">{recovery}</span>
            <span className="text-sm text-neutral-500">/100</span>
          </div>
          <div className="mt-2 text-xs">
            recommended intensity today:{" "}
            <span className={`uppercase tracking-[0.16em] ${intensityColor}`}>{intensity}</span>
          </div>
          <div className="mt-6">
            <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-neutral-500">30-day recovery</p>
            <TrendSpark values={history.map((d) => d.recovery)} color="#a78bfa" />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <HealthTile label="Avg sleep" value={sleep.toFixed(1)} unit="hrs" arc={(sleep / 9) * 100} accent="violet" hint="7-day" />
          <HealthTile label="Avg stress" value={stress} arc={stress} accent="rose" hint="7-day" />
          <HealthTile label="Nights ≥ 7h" value={week.filter((d) => d.sleepHours >= 7).length} unit={`/${week.length}`} arc={(week.filter((d) => d.sleepHours >= 7).length / week.length) * 100} accent="cyan" hint="week" />
          <HealthTile
            label="Best night"
            value={Math.max(...week.map((d) => d.sleepHours)).toFixed(1)}
            unit="hrs"
            arc={(Math.max(...week.map((d) => d.sleepHours)) / 9) * 100}
            accent="emerald"
          />
        </div>
      </div>

      <Card className="mt-6 bg-neutral-950/60 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Moon className="h-4 w-4 text-violet-300" />
          <h3 className="text-sm font-medium text-neutral-100">Sleep — 30 days</h3>
        </div>
        <TrendSpark values={history.map((d) => d.sleepHours)} color="#a78bfa" min={4} max={10} height={90} />
        <div className="mt-2 flex justify-between text-[10px] text-neutral-500">
          <span>30d ago</span>
          <span>today</span>
        </div>
      </Card>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card className="bg-neutral-950/60 p-6">
          <div className="mb-2 flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-300" />
            <h3 className="text-sm font-medium text-neutral-100">If you slept poorly</h3>
          </div>
          <ul className="text-sm text-neutral-300 space-y-1.5">
            <li>· Ten minutes of daylight before opening your laptop.</li>
            <li>· Water first, coffee second.</li>
            <li>· Start with the easiest task on your list — momentum, not heroics.</li>
          </ul>
        </Card>
        <Card className="bg-neutral-950/60 p-6">
          <div className="mb-2 flex items-center gap-2">
            <Moon className="h-4 w-4 text-violet-300" />
            <h3 className="text-sm font-medium text-neutral-100">Tonight</h3>
          </div>
          <ul className="text-sm text-neutral-300 space-y-1.5">
            <li>· Wind-down starts 45 min before target sleep time.</li>
            <li>· Screens off, lights low.</li>
            <li>· Same wake time tomorrow — anchor the rhythm.</li>
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <AIRecommendation
          systemPrompt="You are Anchor. In 3 warm sentences, tell the student one small change to protect tonight's sleep. No lists."
          context={`Recovery ${recovery}. Avg sleep ${sleep.toFixed(1)}h. Stress ${stress}. Intensity band: ${intensity}. Current wellness ${Math.round(state.vision.postureScore)}.`}
          title="Tonight, one small thing"
        />
      </div>
    </div>
  );
}
