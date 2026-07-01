"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AIRecommendation } from "@/components/ai-recommendation";
import { useSignals } from "@/components/signals-store";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface CheckIn {
  ts: number;
  mood: number;
  energy: number;
  sleep: number;
  stress: number;
  motivation: number;
  note: string;
}

const STORAGE = "anchor.checkin.v1";
const SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const QUESTIONS = [
  { key: "mood", label: "How's your mood?" },
  { key: "energy", label: "How's your energy?" },
  { key: "sleep", label: "How rested do you feel?" },
  { key: "stress", label: "How calm do you feel?", inverted: true },
  { key: "motivation", label: "How motivated do you feel?" },
] as const;

export default function CheckInPage() {
  const { metrics } = useSignals();
  const [answers, setAnswers] = useState<Record<string, number>>({
    mood: 5,
    energy: 5,
    sleep: 5,
    stress: 5,
    motivation: 5,
  });
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<CheckIn | null>(null);
  const [history, setHistory] = useState<CheckIn[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw) as CheckIn[];
        setHistory(parsed);
        setSaved(parsed[parsed.length - 1] ?? null);
      }
    } catch {}
  }, []);

  const submit = () => {
    const entry: CheckIn = {
      ts: Date.now(),
      mood: answers.mood,
      energy: answers.energy,
      sleep: answers.sleep,
      stress: answers.stress,
      motivation: answers.motivation,
      note,
    };
    const next = [...history, entry].slice(-30);
    setHistory(next);
    setSaved(entry);
    setNote("");
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
    } catch {}
  };

  const selfContext = saved
    ? `Self-reported: mood ${saved.mood}/10, energy ${saved.energy}/10, sleep ${saved.sleep}/10, calm ${saved.stress}/10, motivation ${saved.motivation}/10. Note: "${saved.note || "—"}"`
    : "No check-in yet.";
  const observedContext = `Observed: focus ${Math.round(metrics.focus)}, stress ${Math.round(metrics.stress)}, fatigue ${Math.round(metrics.fatigue)}, energy ${Math.round(metrics.energy)}, mood ${metrics.mood}.`;

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Wellness check-in."
        subtitle="Two minutes. Anchor blends what you say with what it sees."
      />

      <Card className="bg-neutral-950/60 p-6">
        <div className="space-y-5">
          {QUESTIONS.map((q) => (
            <div key={q.key}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-neutral-100">{q.label}</span>
                <span className="tabular-nums text-xs text-neutral-500">
                  {answers[q.key]}/10
                </span>
              </div>
              <div className="flex gap-1">
                {SCALE.map((n) => (
                  <button
                    key={n}
                    onClick={() => setAnswers((a) => ({ ...a, [q.key]: n }))}
                    className={cn(
                      "h-8 flex-1 rounded-md text-xs tabular-nums transition-colors",
                      answers[q.key] === n
                        ? "bg-cyan-400/25 text-cyan-100 ring-1 ring-cyan-400/50"
                        : "bg-neutral-900 text-neutral-500 hover:bg-neutral-800"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <label className="mb-2 block text-sm text-neutral-100">
              Anything you want Anchor to know?
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional — one sentence is enough."
              className="w-full resize-none rounded-lg border border-neutral-900 bg-black/40 p-3 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-cyan-400/40"
            />
          </div>
          <button
            onClick={submit}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
          >
            <Heart className="h-4 w-4" /> Save check-in
          </button>
        </div>
      </Card>

      {saved && (
        <div className="mt-6">
          <AIRecommendation
            systemPrompt="You are Anchor. Blend what the student just self-reported with what you're observing. In 3 warm sentences, gently name any gap (e.g., they say 8/10 but stress reads high) and suggest ONE small thing this hour. No lists."
            context={`${selfContext}\n${observedContext}`}
            title="What Anchor hears + sees"
          />
        </div>
      )}

      {history.length > 0 && (
        <Card className="mt-6 bg-neutral-950/60 p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-100">
            Recent check-ins
          </h3>
          <ul className="space-y-2">
            {history.slice(-6).reverse().map((h) => (
              <li
                key={h.ts}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-900 bg-black/40 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-neutral-500">
                    {new Date(h.ts).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span className="text-neutral-300">
                    mood {h.mood} · energy {h.energy} · calm {h.stress}
                  </span>
                </div>
                {h.note && (
                  <span className="text-neutral-500 italic">"{h.note}"</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
