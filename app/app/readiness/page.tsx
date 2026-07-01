"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { HealthTile } from "@/components/health-tile";
import { AIRecommendation } from "@/components/ai-recommendation";
import { useSignals } from "@/components/signals-store";
import { learningReadiness } from "@/lib/composite";
import { Zap } from "lucide-react";

export default function ReadinessPage() {
  const { state, metrics } = useSignals();
  const r = learningReadiness(metrics, state.vision, state.typing);

  const bandColor =
    r.label === "primed"
      ? "text-emerald-300"
      : r.label === "ready"
      ? "text-cyan-300"
      : r.label === "warming up"
      ? "text-amber-300"
      : "text-rose-300";

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Learning Readiness."
        subtitle="How prepared you are to study right now — from sleep, stress, workload, typing, posture, and focus."
      />

      <Card className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
              Readiness score
            </p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-7xl font-semibold tabular-nums text-neutral-100">
                {r.score}
              </span>
              <span className={`text-sm uppercase tracking-[0.2em] ${bandColor}`}>
                {r.label}
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-neutral-400">
              {r.label === "primed"
                ? "You look ready. Pick your heaviest task and open a 50-minute block."
                : r.label === "ready"
                ? "Solid enough for a real study block. Ease in with something familiar."
                : r.label === "warming up"
                ? "Warm up first — a stretch, a short walk, water, then start light."
                : "Rest. Even 20 quiet minutes now protects tomorrow."}
            </p>
          </div>
          <Zap className="h-16 w-16 text-cyan-300/40" />
        </div>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <HealthTile label="Sleep" value={r.sleep} arc={r.sleep} accent="violet" hint="7-day avg" />
        <HealthTile label="Low stress" value={r.stress} arc={r.stress} accent="rose" hint="100 = calm" />
        <HealthTile label="Workload runway" value={r.workload} arc={r.workload} accent="emerald" hint="less due = more runway" />
        <HealthTile label="Typing steadiness" value={r.typing} arc={r.typing} accent="cyan" hint={state.typing.active ? "live" : "estimated"} />
        <HealthTile label="Posture" value={r.posture} arc={r.posture} accent="emerald" hint={state.vision.active ? "live" : "estimated"} />
        <HealthTile label="Focus" value={r.focus} arc={r.focus} accent="cyan" hint="live" />
      </div>

      <div className="mt-6">
        <AIRecommendation
          systemPrompt="You are Anchor. Explain in 3 warm sentences whether the student should start a hard block, a light block, or rest — and why. One concrete first move. No lists."
          context={`Readiness ${r.score}/100 (${r.label}). Sleep ${r.sleep}, low-stress ${r.stress}, workload runway ${r.workload}, typing ${r.typing}, posture ${r.posture}, focus ${r.focus}.`}
          title="What to do next"
        />
      </div>
    </div>
  );
}
