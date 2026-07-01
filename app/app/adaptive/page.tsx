"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AIRecommendation } from "@/components/ai-recommendation";
import { useSignals } from "@/components/signals-store";
import { useFocus } from "@/components/focus-mode";
import { Play, Square, Sparkles } from "lucide-react";

function adapt(fatigue: number, focus: number) {
  // start from 25/5 pomodoro and stretch/shrink by fatigue+focus
  const bias = focus / 100 - fatigue / 100; // -1..+1
  const workMin = Math.max(15, Math.min(75, Math.round(25 + bias * 40)));
  const breakMin = Math.max(3, Math.min(15, Math.round(5 + fatigue / 20)));
  return { workMin, breakMin };
}

export default function AdaptivePage() {
  const { metrics, addNudge } = useSignals();
  const { active, remainingSec, minutes, start, stop } = useFocus();
  const [plan, setPlan] = useState(() => adapt(metrics.fatigue, metrics.focus));

  useEffect(() => {
    setPlan(adapt(metrics.fatigue, metrics.focus));
  }, [metrics.fatigue, metrics.focus]);

  const startAdaptive = () => {
    addNudge({
      source: "system",
      text: `Adaptive block starting: ${plan.workMin} min focus, ${plan.breakMin} min break.`,
    });
    start(plan.workMin);
  };

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Adaptive focus."
        subtitle="Anchor picks the block and break length from your live fatigue instead of a fixed timer."
      />

      <Card className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">Recommended</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-6xl font-semibold tabular-nums text-neutral-100">
                {plan.workMin}
              </span>
              <span className="text-sm text-neutral-500">min focus</span>
            </div>
            <div className="mt-1 text-sm text-neutral-400">
              then <span className="text-neutral-200">{plan.breakMin}</span> min break
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">Why this length</p>
            <p className="text-sm text-neutral-300">
              Fatigue <span className="text-neutral-100">{Math.round(metrics.fatigue)}</span>, focus{" "}
              <span className="text-neutral-100">{Math.round(metrics.focus)}</span>.{" "}
              {metrics.fatigue > 60
                ? "You need a shorter block and a longer breather."
                : metrics.focus > 75
                ? "You're primed — Anchor stretches the block."
                : "Standard-length block feels right."}
            </p>
          </div>

          <div className="flex items-center justify-end">
            {!active ? (
              <button
                onClick={startAdaptive}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
              >
                <Play className="h-4 w-4" /> Start adaptive block
              </button>
            ) : (
              <div className="text-right">
                <div className="tabular-nums text-4xl text-neutral-100">
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </div>
                <button
                  onClick={() => stop()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs text-rose-200"
                >
                  <Square className="h-3 w-3" /> stop
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-6 bg-neutral-950/60 p-6">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <span className="text-neutral-100">How it decides</span>
        </div>
        <p className="text-sm text-neutral-400">
          Anchor watches fatigue and focus in real time. High fatigue shortens
          the block and lengthens the break. High focus stretches the block.
          If either metric shifts mid-session, next block adapts automatically.
        </p>
      </Card>

      <div className="mt-4">
        <AIRecommendation
          systemPrompt="You are Anchor. In 2 short sentences, tell the student whether to start now or take a walk first. Warm, direct."
          context={`Fatigue ${Math.round(metrics.fatigue)}, focus ${Math.round(metrics.focus)}, stress ${Math.round(metrics.stress)}, energy ${Math.round(metrics.energy)}. Recommended block ${plan.workMin} min.`}
          title="Start now or walk first?"
        />
      </div>
    </div>
  );
}
