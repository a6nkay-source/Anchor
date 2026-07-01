"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { assignments, courseById, humanDue } from "@/lib/mock-data";
import { CalendarClock, Sparkles, Clock, Loader2, Copy } from "lucide-react";

interface Block {
  startMin: number; // minutes from now
  minutes: number;
  title: string;
  courseId?: string;
  kind: "focus" | "break" | "review";
}

// Build a very simple auto-plan: pick top assignments by urgency + weight,
// split into 25-minute focus blocks with 5-minute breaks and a short review.
function autoPlan(): Block[] {
  const open = assignments
    .filter((a) => a.status !== "done")
    .sort((a, b) => {
      const dueA = new Date(a.due).getTime();
      const dueB = new Date(b.due).getTime();
      const scoreA = -dueA + a.points * 60_000_000;
      const scoreB = -dueB + b.points * 60_000_000;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  const plan: Block[] = [];
  let offset = 0;
  for (const a of open) {
    const chunks = Math.max(1, Math.min(3, Math.round(a.estMinutes / 25)));
    for (let i = 0; i < chunks; i++) {
      plan.push({
        startMin: offset,
        minutes: 25,
        title: a.title,
        courseId: a.courseId,
        kind: "focus",
      });
      offset += 25;
      plan.push({
        startMin: offset,
        minutes: 5,
        title: "Breather — look up, unclench jaw",
        kind: "break",
      });
      offset += 5;
    }
    plan.push({
      startMin: offset,
      minutes: 10,
      title: `Quick review — ${courseById(a.courseId)?.code ?? "topic"}`,
      courseId: a.courseId,
      kind: "review",
    });
    offset += 10;
  }
  return plan;
}

export default function PlannerPage() {
  const [plan, setPlan] = useState<Block[]>(() => autoPlan());
  const [rationale, setRationale] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const total = useMemo(() => plan.reduce((s, b) => s + b.minutes, 0), [plan]);

  const askForRationale = async () => {
    setAsking(true);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Anchor's planner. In under 40 words, explain why the plan starts with the first task and how the student should approach the next 2 hours.",
            },
            {
              role: "user",
              content: `Plan: ${plan
                .filter((b) => b.kind === "focus")
                .map((b) => b.title)
                .join(", ")}`,
            },
          ],
        }),
      });
      const data = await res.json();
      setRationale(data?.reply ?? null);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Study planner."
        subtitle="Anchor builds a realistic 2-hour arc from your open assignments — focus + breather + review."
        actions={
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPlan(autoPlan())}
              className="rounded-full border border-neutral-800 px-3 py-1.5 text-neutral-300 hover:border-cyan-400/40"
            >
              Re-plan
            </button>
            <button
              onClick={askForRationale}
              disabled={asking}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200 hover:border-cyan-400/60"
            >
              {asking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Why this order?
            </button>
          </div>
        }
      />

      {rationale && (
        <Card className="mb-6 border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-100">
          {rationale}
        </Card>
      )}

      <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
        <span>{plan.length} blocks · {Math.floor(total / 60)}h {total % 60}m total</span>
        <span>from now</span>
      </div>

      <div className="space-y-2">
        {plan.map((b, i) => {
          const c = b.courseId ? courseById(b.courseId) : null;
          const kindColor =
            b.kind === "focus"
              ? "border-cyan-400/30 bg-cyan-400/5"
              : b.kind === "review"
              ? "border-violet-400/30 bg-violet-400/5"
              : "border-neutral-800 bg-neutral-950/60";
          const startHour = new Date(Date.now() + b.startMin * 60_000);
          return (
            <div
              key={i}
              className={`flex items-center justify-between rounded-xl border p-3 text-sm ${kindColor}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 tabular-nums text-xs text-neutral-500">
                  {startHour.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
                <div>
                  <div className="text-neutral-100">{b.title}</div>
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

      <Card className="mt-6 bg-neutral-950/60 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-neutral-100">
          <CalendarClock className="h-4 w-4 text-cyan-300" />
          Upcoming deadlines (source data)
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {assignments
            .filter((a) => a.status !== "done")
            .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
            .slice(0, 6)
            .map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-neutral-900 bg-black/40 px-3 py-2 text-xs"
              >
                <span className="truncate text-neutral-200">{a.title}</span>
                <span className="text-neutral-500">{humanDue(a.due)}</span>
              </li>
            ))}
        </ul>
      </Card>
    </div>
  );
}
