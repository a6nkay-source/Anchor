"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AIRecommendation } from "@/components/ai-recommendation";
import { useSignals } from "@/components/signals-store";
import { learningReadiness } from "@/lib/composite";
import { allConcepts } from "@/lib/mastery";
import { assignments, courseById, humanDue } from "@/lib/mock-data";
import { Beaker, ClipboardList, Clock, Play } from "lucide-react";

interface Rx {
  totalMinutes: number;
  blocks: {
    kind: "focus" | "recall" | "flashcards" | "quiz" | "break" | "review";
    label: string;
    minutes: number;
    courseId?: string;
  }[];
}

function buildRx(readinessScore: number): Rx {
  // pick 2 weak concepts + 1 near-due assignment
  const weak = allConcepts()
    .filter((c) => c.status === "weak")
    .slice(0, 2);
  const dueSoon = assignments
    .filter((a) => a.status !== "done")
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0];

  // scale block length to readiness
  const focusLen = readinessScore >= 75 ? 45 : readinessScore >= 55 ? 30 : 20;
  const shortBreak = readinessScore < 55 ? 8 : 5;

  const blocks: Rx["blocks"] = [];
  if (dueSoon) {
    blocks.push({ kind: "focus", label: `Deep work — ${dueSoon.title}`, minutes: focusLen, courseId: dueSoon.courseId });
    blocks.push({ kind: "break", label: "Break — look far, unclench jaw", minutes: shortBreak });
  }
  for (const c of weak) {
    blocks.push({
      kind: "recall",
      label: `Active recall — ${c.name}`,
      minutes: c.recommendedMinutes,
      courseId: c.courseId,
    });
    blocks.push({ kind: "break", label: "Stretch — neck rolls", minutes: shortBreak });
  }
  blocks.push({ kind: "flashcards", label: "Flashcards — spaced review", minutes: 12 });
  blocks.push({ kind: "quiz", label: "Self-quiz — 5 questions", minutes: 10 });
  blocks.push({ kind: "review", label: "Review notes from today's blocks", minutes: 8 });

  return { totalMinutes: blocks.reduce((s, b) => s + b.minutes, 0), blocks };
}

const KIND_STYLE: Record<string, string> = {
  focus: "border-cyan-400/30 bg-cyan-400/10",
  recall: "border-violet-400/30 bg-violet-400/10",
  flashcards: "border-emerald-400/30 bg-emerald-400/10",
  quiz: "border-amber-400/30 bg-amber-400/10",
  break: "border-neutral-800 bg-neutral-950/60",
  review: "border-neutral-800 bg-neutral-950/60",
};

export default function PrescriptionPage() {
  const { metrics, state } = useSignals();
  const r = learningReadiness(metrics, state.vision, state.typing);
  const [rx, setRx] = useState<Rx>(() => buildRx(r.score));

  const dueSoon = useMemo(
    () =>
      assignments
        .filter((a) => a.status !== "done")
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
        .slice(0, 3),
    []
  );

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="AI Study Prescription."
        subtitle="A session tuned to your readiness, weakest concepts, and next deadlines."
        actions={
          <button
            onClick={() => setRx(buildRx(r.score))}
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 hover:border-cyan-400/60"
          >
            <Beaker className="h-3.5 w-3.5" /> Re-prescribe
          </button>
        }
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Card className="bg-neutral-950/60 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Readiness</p>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-neutral-100">{r.score}</div>
          <p className="mt-1 text-xs text-neutral-500">{r.label}</p>
        </Card>
        <Card className="bg-neutral-950/60 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Session length</p>
          <div className="mt-1 text-3xl font-semibold tabular-nums text-neutral-100">
            {Math.floor(rx.totalMinutes / 60)}h {rx.totalMinutes % 60}m
          </div>
          <p className="mt-1 text-xs text-neutral-500">{rx.blocks.length} blocks</p>
        </Card>
        <Card className="bg-neutral-950/60 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Next deadline</p>
          <div className="mt-1 text-sm text-neutral-100">
            {dueSoon[0]?.title ?? "None"}
          </div>
          <p className="mt-1 text-xs text-neutral-500">{dueSoon[0] ? humanDue(dueSoon[0].due) : "—"}</p>
        </Card>
      </div>

      <div className="space-y-2">
        {rx.blocks.map((b, i) => {
          const c = b.courseId ? courseById(b.courseId) : null;
          const start = new Date();
          start.setMinutes(start.getMinutes() + rx.blocks.slice(0, i).reduce((s, x) => s + x.minutes, 0));
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl border p-3 text-sm ${KIND_STYLE[b.kind]}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 tabular-nums text-xs text-neutral-500">
                  {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </div>
                <div>
                  <div className="text-neutral-100">{b.label}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-500">
                    <span className="uppercase tracking-[0.16em]">{b.kind}</span>
                    {c && (
                      <span
                        className="rounded px-1 text-[10px] font-medium"
                        style={{ background: `${c.color}22`, color: c.color }}
                      >
                        {c.code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                <Clock className="h-3 w-3" /> {b.minutes} min
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform">
          <Play className="h-4 w-4" /> Start prescription
        </button>
        <a
          href="/app/planner"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-cyan-400/40"
        >
          <ClipboardList className="h-3.5 w-3.5" /> View planner
        </a>
      </div>

      <div className="mt-6">
        <AIRecommendation
          systemPrompt="You are Anchor. In 3 short sentences, explain the prescription and why the first block matters most. Warm, concrete. No lists."
          context={`Readiness ${r.score} (${r.label}). ${rx.totalMinutes}-minute session with focus, active recall, flashcards, and one quiz.`}
          title="Why this session"
        />
      </div>
    </div>
  );
}
