"use client";

import { useEffect, useRef, useState } from "react";
import { useSignals } from "@/components/signals-store";
import { useFocus } from "@/components/focus-mode";
import { TrendSpark } from "@/components/trend-spark";
import { Card } from "@/components/ui/card";
import { assignments, courseById } from "@/lib/mock-data";
import { speak } from "@/lib/speech";
import { X, Sparkles, Loader2, ArrowRight, PartyPopper } from "lucide-react";

// When Focus Mode ends, pop a warm summary generated from the just-finished session.
export function SessionSummary() {
  const { state, metrics, wellnessScore } = useSignals();
  const { active } = useFocus();
  const [snapshot, setSnapshot] = useState<null | {
    startedAt: number;
    endedAt: number;
    wellnessAvg: number;
    focusAvg: number;
    stressAvg: number;
    distractionCount: number;
    historyWellness: number[];
    historyFocus: number[];
    historyStress: number[];
  }>(null);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prevActive = useRef(active);
  const startedAtRef = useRef<number | null>(null);
  const startingSlicedRef = useRef<number>(0);

  // Capture start of session
  useEffect(() => {
    if (active && !prevActive.current) {
      startedAtRef.current = Date.now();
      startingSlicedRef.current = state.history.length;
    }
    // Capture end of session
    if (!active && prevActive.current) {
      const startedAt = startedAtRef.current ?? Date.now() - 25 * 60_000;
      const slice = state.history.slice(startingSlicedRef.current);
      if (slice.length > 0) {
        const wellnessAvg = Math.round(slice.reduce((s, x) => s + x.wellness, 0) / slice.length);
        const focusAvg = Math.round(slice.reduce((s, x) => s + x.focus, 0) / slice.length);
        const stressAvg = Math.round(slice.reduce((s, x) => s + x.stress, 0) / slice.length);
        const distractionCount = state.distractions.filter((d) => d.ts >= startedAt).length;
        setSnapshot({
          startedAt,
          endedAt: Date.now(),
          wellnessAvg,
          focusAvg,
          stressAvg,
          distractionCount,
          historyWellness: slice.map((x) => x.wellness),
          historyFocus: slice.map((x) => x.focus),
          historyStress: slice.map((x) => x.stress),
        });
      } else {
        setSnapshot({
          startedAt,
          endedAt: Date.now(),
          wellnessAvg: wellnessScore,
          focusAvg: Math.round(metrics.focus),
          stressAvg: Math.round(metrics.stress),
          distractionCount: 0,
          historyWellness: [wellnessScore],
          historyFocus: [Math.round(metrics.focus)],
          historyStress: [Math.round(metrics.stress)],
        });
      }
    }
    prevActive.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Generate reflection once when snapshot appears
  useEffect(() => {
    if (!snapshot || reflection || loading) return;
    (async () => {
      setLoading(true);
      const minutes = Math.max(1, Math.round((snapshot.endedAt - snapshot.startedAt) / 60_000));
      const nextTask = assignments
        .filter((a) => a.status !== "done")
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0];
      const context = `Focus block just ended after ${minutes} minutes. Avg wellness ${snapshot.wellnessAvg}, focus ${snapshot.focusAvg}, stress ${snapshot.stressAvg}. ${snapshot.distractionCount} distractions. Next open task: "${nextTask?.title ?? "none"}" (${courseById(nextTask?.courseId)?.code ?? "—"}).`;
      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are Anchor, the student's warm study buddy. Write a 3-paragraph reflection under 90 words: (1) celebrate what went well, (2) one honest observation, (3) one encouraging next step. Warm and human. No lists. No emojis.",
              },
              { role: "user", content: context },
            ],
          }),
        });
        const data = await res.json();
        const text = (data?.reply ?? "").toString().trim();
        setReflection(text || "Great block. Take a breath — you earned it.");
        if (text) speak(text.split("\n")[0]);
      } finally {
        setLoading(false);
      }
    })();
  }, [snapshot, reflection, loading]);

  if (!snapshot) return null;

  const minutes = Math.max(1, Math.round((snapshot.endedAt - snapshot.startedAt) / 60_000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-950 to-black shadow-2xl">
        <button
          onClick={() => {
            setSnapshot(null);
            setReflection(null);
          }}
          className="absolute right-3 top-3 rounded p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2 text-cyan-300">
            <PartyPopper className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.24em]">Session complete</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-100">
            {minutes} focused minutes.
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <MiniStat label="Wellness avg" value={snapshot.wellnessAvg} />
            <MiniStat label="Focus avg" value={snapshot.focusAvg} />
            <MiniStat label="Stress avg" value={snapshot.stressAvg} />
            <MiniStat label="Distractions" value={snapshot.distractionCount} />
          </div>

          <Card className="mt-4 bg-neutral-950/60 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Focus timeline
            </div>
            <TrendSpark values={snapshot.historyFocus} color="#67e8f9" height={70} />
          </Card>

          <Card className="mt-3 border-cyan-400/20 bg-cyan-400/5 p-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4 text-cyan-300" /> Anchor's reflection
            </div>
            {loading && !reflection ? (
              <div className="flex items-center gap-2 text-xs text-cyan-100/70">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> writing…
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-cyan-50/90">
                {reflection}
              </p>
            )}
          </Card>

          <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-neutral-500">
              I saved this block to your session replay.
            </p>
            <a
              href="/app/replay"
              onClick={() => {
                setSnapshot(null);
                setReflection(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
            >
              View replay <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">{value}</div>
    </div>
  );
}
