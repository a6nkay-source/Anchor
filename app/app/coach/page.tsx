"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { HealthTile } from "@/components/health-tile";
import { useSignals } from "@/components/signals-store";
import { assignments, courseById } from "@/lib/mock-data";
import { useFocus } from "@/components/focus-mode";
import { Sparkles, Loader2, Play, Pause, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Observation {
  id: string;
  ts: number;
  text: string;
  kind: "coach" | "you";
}

export default function CoachPage() {
  const { state, metrics, wellnessScore, wellnessLabel, addNudge } = useSignals();
  const { active: focusActive, remainingSec } = useFocus();
  const [obs, setObs] = useState<Observation[]>([]);
  const [running, setRunning] = useState(true);
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState("");
  const busyRef = useRef(false);
  const lastAt = useRef(0);

  // Continuous coach — every 30s asks the model for one line, spoken and stored.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      if (busyRef.current) return;
      if (Date.now() - lastAt.current < 24_000) return;
      busyRef.current = true;

      const currentAssignment = assignments
        .filter((a) => a.status !== "done")
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0];
      const c = currentAssignment && courseById(currentAssignment.courseId);

      const context = [
        `Wellness ${wellnessScore}/100 (${wellnessLabel}).`,
        `Focus ${Math.round(metrics.focus)}, stress ${Math.round(metrics.stress)}, fatigue ${Math.round(metrics.fatigue)}, energy ${Math.round(metrics.energy)}.`,
        state.vision.active
          ? `Vision on: posture ${Math.round(state.vision.postureScore)}, blink ${state.vision.blinkRate.toFixed(0)}/min, jaw ${(state.vision.jawTension * 100).toFixed(0)}, expression ${state.vision.expression}.`
          : "Vision off.",
        state.typing.active
          ? `Typing on: ${state.typing.wpm.toFixed(0)} wpm, ${(state.typing.backspaceRatio * 100).toFixed(0)}% backspaces.`
          : "Typing off.",
        focusActive
          ? `Focus mode: ${Math.floor(remainingSec / 60)}m left.`
          : "Not in Focus Mode.",
        currentAssignment
          ? `Current task: "${currentAssignment.title}" (${c?.code ?? "—"}, due ${new Date(currentAssignment.due).toLocaleString()}).`
          : "",
      ].join(" ");

      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are Anchor, the student's AI coach. Every 30 seconds you offer ONE short observation or nudge. Keep it under 20 words. Warm, concrete, gentle. No lists, no emojis. If everything looks steady, say so — do not invent problems.",
              },
              { role: "user", content: context },
            ],
          }),
        });
        const data = await res.json();
        const text = (data?.reply ?? "").toString().trim();
        if (text) {
          const o: Observation = { id: Math.random().toString(36).slice(2), ts: Date.now(), text, kind: "coach" };
          setObs((x) => [o, ...x].slice(0, 30));
          addNudge({ source: "coach", text });
          lastAt.current = Date.now();
        }
      } catch {}
      busyRef.current = false;
    }, 4_000);
    return () => clearInterval(id);
  }, [running, wellnessScore, wellnessLabel, metrics, state.vision, state.typing, focusActive, remainingSec, addNudge]);

  const ask = async () => {
    const text = draft.trim();
    if (!text || asking) return;
    setAsking(true);
    setObs((x) => [{ id: Math.random().toString(36).slice(2), ts: Date.now(), text, kind: "you" }, ...x]);
    setDraft("");
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Anchor's AI coach. Concise, warm, honest. Two sentences max.",
            },
            { role: "user", content: `${text}\n\nContext: wellness ${wellnessScore}, focus ${Math.round(metrics.focus)}, stress ${Math.round(metrics.stress)}, fatigue ${Math.round(metrics.fatigue)}.` },
          ],
        }),
      });
      const data = await res.json();
      const reply = data?.reply ?? "Something got quiet on my end.";
      setObs((x) => [{ id: Math.random().toString(36).slice(2), ts: Date.now(), text: reply, kind: "coach" }, ...x]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="AI Coach."
        subtitle="One cognitive model combining every signal. It watches quietly and speaks rarely."
        actions={
          <button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
              running
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-neutral-800 text-neutral-300"
            )}
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "pause coaching" : "resume coaching"}
          </button>
        }
      />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <HealthTile label="Focus" value={metrics.focus} arc={metrics.focus} accent="cyan" hint="sustained attention" />
        <HealthTile label="Stress" value={metrics.stress} arc={metrics.stress} accent="rose" hint="composite" />
        <HealthTile label="Fatigue" value={metrics.fatigue} arc={metrics.fatigue} accent="amber" hint="composite" />
        <HealthTile label="Confidence" value={Math.round((metrics.focus + metrics.energy) / 2)} arc={(metrics.focus + metrics.energy) / 2} accent="emerald" hint="focus × energy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,340px)]">
        <Card className="bg-neutral-950/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-neutral-100">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Observations
          </div>
          <ul className="space-y-2">
            {obs.length === 0 && (
              <li className="rounded-lg border border-dashed border-neutral-900 p-6 text-center text-xs text-neutral-500">
                Anchor is watching. The first observation lands in a few seconds.
              </li>
            )}
            {obs.map((o) => (
              <li
                key={o.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-sm",
                  o.kind === "coach"
                    ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-100"
                    : "border-neutral-900 bg-neutral-950/60 text-neutral-200"
                )}
              >
                <span className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                  {o.kind === "coach" ? "coach" : "you"}
                </span>
                <span className="flex-1 leading-relaxed">{o.text}</span>
                <span className="text-[10px] tabular-nums text-neutral-500">
                  {new Date(o.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
            className="mt-3 flex items-center gap-2 rounded-full border border-neutral-800 bg-black/40 px-3 py-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5 text-neutral-500" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask the coach — 'why is my stress that high?'"
              className="flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || asking}
              className="rounded-full bg-cyan-400 px-3 py-1 text-[11px] font-medium text-neutral-950 disabled:opacity-30"
            >
              {asking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ask"}
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="bg-neutral-950/60 p-4 text-xs">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Inputs the coach reads
            </p>
            <ul className="space-y-1 text-neutral-300">
              <li>· camera vision (posture, gaze, blink, expression)</li>
              <li>· typing rhythm & backspaces</li>
              <li>· voice call transcript</li>
              <li>· current course & assignment</li>
              <li>· calendar density</li>
              <li>· focus block state</li>
              <li>· distraction attempts</li>
              <li>· wearable metrics (if paired)</li>
            </ul>
          </Card>
          <Card className="bg-neutral-950/60 p-4 text-xs text-neutral-400">
            The coach never diagnoses. It offers one small nudge at a time and
            stays quiet when things look steady.
          </Card>
        </div>
      </div>
    </div>
  );
}
