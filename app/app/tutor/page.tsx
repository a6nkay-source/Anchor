"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Send, GraduationCap, Sparkles, Book } from "lucide-react";
import { cn } from "@/lib/utils";
import { courses, notes } from "@/lib/mock-data";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Walk me through backprop step by step.",
  "I don't get why the Cauchy criterion implies convergence.",
  "Quiz me on my Turkle note.",
  "Compare L1 vs L2 regularization with a small example.",
];

export default function TutorPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [ground, setGround] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [turns, thinking]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || thinking) return;
      const groundedNote = notes.find((n) => n.id === ground);
      const systemLine = `You are Anchor's academic tutor. Be Socratic, warm, and concise. Prefer intuition first, then formalism. If the student is confused, ask one clarifying question. Never dump long lists.\nCurrent course context: ${
        groundedNote
          ? `note "${groundedNote.title}" — ${groundedNote.body.slice(0, 800)}`
          : "no note pinned"
      }`;
      const nextTurns = [...turns, { role: "user" as const, content: text }];
      setTurns(nextTurns);
      setDraft("");
      setThinking(true);
      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemLine },
              ...nextTurns.slice(-14),
            ],
          }),
        });
        const data = await res.json();
        const reply =
          typeof data?.reply === "string" && data.reply.trim()
            ? data.reply.trim()
            : "Something went quiet on my end. Try again?";
        setTurns((t) => [...t, { role: "assistant", content: reply }]);
      } catch {
        setTurns((t) => [
          ...t,
          { role: "assistant", content: "Couldn't reach the model." },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [turns, thinking, ground]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="AI Tutor."
        subtitle="Socratic help across your courses. Ground it on any note."
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <Card className="bg-neutral-950/60 p-3">
          <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Ground on a note
          </p>
          <button
            onClick={() => setGround(null)}
            className={cn(
              "block w-full rounded-lg px-2 py-2 text-left text-xs",
              !ground
                ? "bg-cyan-400/10 text-cyan-100"
                : "text-neutral-400 hover:bg-neutral-900"
            )}
          >
            No pin
          </button>
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setGround(n.id)}
              className={cn(
                "block w-full truncate rounded-lg px-2 py-2 text-left text-xs",
                ground === n.id
                  ? "bg-cyan-400/10 text-cyan-100"
                  : "text-neutral-400 hover:bg-neutral-900"
              )}
            >
              <Book className="mr-1 inline h-3 w-3 text-neutral-500" />
              {n.title}
            </button>
          ))}
          <p className="mt-3 px-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Courses
          </p>
          {courses.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-neutral-400"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: c.color }}
              />
              {c.code}
            </div>
          ))}
        </Card>

        <Card className="flex min-h-[520px] flex-col bg-neutral-950/60">
          <div className="flex-1 overflow-hidden">
            <div ref={scrollerRef} className="h-[440px] space-y-3 overflow-y-auto p-4">
              {turns.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 ring-1 ring-cyan-400/30">
                    <GraduationCap className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-300">
                      Ask anything you're studying.
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Anchor prefers intuition, then formalism.
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1 text-[11px] text-neutral-300 hover:border-cyan-400/40 hover:text-cyan-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((t, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    t.role === "assistant"
                      ? "bg-neutral-900/80 text-neutral-100"
                      : "ml-auto bg-cyan-400/15 text-cyan-100"
                  )}
                >
                  {t.content}
                </div>
              ))}
              {thinking && (
                <div className="inline-flex gap-1 rounded-2xl bg-neutral-900/80 px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:300ms]" />
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-2 border-t border-neutral-900 p-3"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-neutral-500" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                ground
                  ? `Ask about "${notes.find((n) => n.id === ground)?.title}"…`
                  : "Ask anything about your courses…"
              }
              className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              className="rounded-full bg-cyan-400 p-2 text-neutral-950 disabled:opacity-30"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
