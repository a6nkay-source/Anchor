"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Minus,
  Maximize2,
  Send,
  GripVertical,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/components/signals-store";

interface Turn {
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
}

const STORAGE_KEY = "anchor.assistant.v1";

// Context strings shown as the assistant's "reading the room" hint
const PAGE_CONTEXT: Record<string, { title: string; hint: string; opener?: string }> = {
  "/app": { title: "Overview", hint: "Reading your live signals.", opener: "I'm here. Anything you want me to look at first?" },
  "/app/vision": { title: "Vision", hint: "Watching posture, gaze, blink, tension.", opener: "Camera's on. Sit however feels natural — I'll only nudge if something drifts." },
  "/app/typing": { title: "Typing", hint: "Feeling out the rhythm as you go.", opener: "Type freely. I'll notice if the cadence gets choppy." },
  "/app/voice": { title: "Voice", hint: "Ready for a thirty-second call.", opener: "Say the word and we can talk it out." },
  "/app/signals": { title: "Signals", hint: "Your whispered log so far.", opener: "Everything I've noticed lives here. Want me to summarize?" },
  "/app/courses": { title: "Courses", hint: "Tracking grades and exam distance.", opener: "Which class has been the loudest in your head lately?" },
  "/app/assignments": { title: "Assignments", hint: "Sorting your workload by weight.", opener: "Want me to plan the next 90 minutes for you?" },
  "/app/calendar": { title: "Calendar", hint: "Reading the shape of your week.", opener: "Anything you'd like to move or protect?" },
  "/app/notes": { title: "Notes", hint: "Nearby your notes — I can pull from any.", opener: "I can quiz you on any note, or turn one into flashcards." },
  "/app/flashcards": { title: "Flashcards", hint: "Ready to help you drill.", opener: "Want a quick 5-card warmup?" },
  "/app/tutor": { title: "Tutor", hint: "Full attention on what you're learning.", opener: "What's the concept that isn't clicking yet?" },
  "/app/messages": { title: "Messages", hint: "I can summarize any thread.", opener: "Want me to condense a conversation or draft a reply?" },
  "/app/focus": { title: "Focus Room", hint: "Guarding your block.", opener: "Set the length — I'll keep the noise out." },
  "/app/parent": { title: "Parent view", hint: "The demo dashboard.", opener: "This is a demo view of what a guardian would see." },
  "/app/settings": { title: "Settings", hint: "You control what I can see.", opener: "Every switch is opt-in. Nothing turns on unless you flip it." },
  "/app/index-score": { title: "Wellness Index", hint: "One number for how you're doing.", opener: "Ask me why the number is what it is." },
  "/app/readiness": { title: "Readiness", hint: "How prepared you are to study.", opener: "Want me to say whether to start now or rest?" },
  "/app/burnout": { title: "Burnout", hint: "14-day forecast.", opener: "I'll show you what's driving the trend." },
  "/app/biomarkers": { title: "Biomarkers", hint: "Motor + perceptual + voice signals.", opener: "Ask me to translate these into one action." },
  "/app/mastery": { title: "Concept mastery", hint: "Where you're solid, and where you're not.", opener: "I can build a session around your weakest concept." },
  "/app/prescription": { title: "Study Prescription", hint: "A session tuned to today.", opener: "Say the word and I'll start the first block." },
  "/app/recovery": { title: "Sleep & recovery", hint: "How your body is doing under the studying.", opener: "Want tonight's plan?" },
  "/app/ergonomics": { title: "Ergonomics", hint: "Body, eyes, jaw.", opener: "I'll pick the stretch that helps most today." },
  "/app/adaptive": { title: "Adaptive focus", hint: "Block length tuned to fatigue.", opener: "Ready when you are." },
  "/app/timeline": { title: "Health timeline", hint: "Everything at once.", opener: "Which line do you want to talk about?" },
  "/app/checkin": { title: "Check-in", hint: "Two-minute self-report.", opener: "I'll blend what you say with what I see." },
  "/app/integrations": { title: "Wearables", hint: "Optional device pairing.", opener: "I won't invent numbers — I only show what you connect." },
  "/app/reports": { title: "Reports", hint: "Daily and weekly summaries.", opener: "Want me to write today's summary?" },
  "/app/health": { title: "Health Dashboard", hint: "Every metric, one page.", opener: "Ask me which of these to worry about first." },
  "/app/replay": { title: "Session replay", hint: "Scrub through your last block.", opener: "I can point out where focus dipped." },
};

function contextFor(pathname: string | null) {
  if (!pathname) return PAGE_CONTEXT["/app"];
  const keys = Object.keys(PAGE_CONTEXT).sort((a, b) => b.length - a.length);
  for (const k of keys) if (pathname.startsWith(k)) return PAGE_CONTEXT[k];
  return PAGE_CONTEXT["/app"];
}

type Mode = "closed" | "chip" | "mini" | "full";

export function FloatingAssistant() {
  const pathname = usePathname();
  const ctx = useMemo(() => contextFor(pathname), [pathname]);
  const { state, wellnessScore, wellnessLabel } = useSignals();

  const [mode, setMode] = useState<Mode>("mini");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const dragRef = useRef<{ dx: number; dy: number; on: boolean }>({ dx: 0, dy: 0, on: false });
  const scrollerRef = useRef<HTMLDivElement>(null);

  // hydrate memory + position
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.turns)) setTurns(parsed.turns.slice(-40));
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.pos) setPos(parsed.pos);
      }
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ turns: turns.slice(-40), mode, pos })
      );
    } catch {}
  }, [turns, mode, pos]);

  // inject a soft context "opener" once per new page (no LLM call — cheap and quick)
  useEffect(() => {
    if (mode === "closed") return;
    if (!ctx.opener) return;
    const lastSystem = [...turns].reverse().find((t) => t.role === "system");
    if (lastSystem && lastSystem.content === ctx.opener) return;
    setTurns((t) => [
      ...t,
      { role: "system", content: ctx.opener!, ts: Date.now() },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [turns, mode, thinking]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || thinking) return;
      const userTurn: Turn = { role: "user", content: text, ts: Date.now() };
      const history: Turn[] = [...turns, userTurn];
      setTurns(history);
      setDraft("");
      setThinking(true);
      try {
        const systemLine = `You are Anchor, a calm academic companion. The student is on the "${ctx.title}" page. Their live wellness is ${wellnessScore}/100 (${wellnessLabel}). Vision is ${state.vision.active ? "on" : "off"}, typing is ${state.typing.active ? "on" : "off"}. Answer in at most 2-3 short sentences. Be warm, concrete, and gentle. No lists unless asked. No emojis.`;
        const messages = [
          { role: "system" as const, content: systemLine },
          ...history
            .filter((t) => t.role !== "system")
            .slice(-14)
            .map((t) => ({ role: t.role as "user" | "assistant", content: t.content })),
        ];
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
        const data = await res.json();
        const reply =
          typeof data?.reply === "string" && data.reply.trim().length > 0
            ? data.reply.trim()
            : "Something got quiet on my end — try again in a moment.";
        setTurns((t) => [...t, { role: "assistant", content: reply, ts: Date.now() }]);
      } catch {
        setTurns((t) => [
          ...t,
          {
            role: "assistant",
            content: "Couldn't reach the model. Check your connection?",
            ts: Date.now(),
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [turns, thinking, ctx.title, wellnessScore, wellnessLabel, state.vision.active, state.typing.active]
  );

  // dragging
  const onDragStart = (e: React.PointerEvent) => {
    dragRef.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
      on: true,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current.on) return;
    const w = mode === "full" ? 420 : mode === "mini" ? 320 : 64;
    const h = mode === "full" ? 520 : mode === "mini" ? 240 : 64;
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - dragRef.current.dx));
    const y = Math.max(8, Math.min(window.innerHeight - h - 8, e.clientY - dragRef.current.dy));
    setPos({ x, y });
  };
  const onDragEnd = (e: React.PointerEvent) => {
    dragRef.current.on = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // hidden on landing (root path)
  if (!pathname?.startsWith("/app")) return null;

  const visibleTurns = turns.filter((t) => t.role !== "system" || mode === "full");
  const lastSystem = [...turns].reverse().find((t) => t.role === "system");

  if (mode === "closed") return (
    <button
      onClick={() => setMode("mini")}
      className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-neutral-950 shadow-2xl hover:scale-105 transition-transform"
      aria-label="Open Anchor assistant"
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );

  const w = mode === "full" ? 420 : mode === "mini" ? 320 : 64;
  const h = mode === "full" ? 520 : mode === "mini" ? 240 : 64;

  return (
    <div
      className={cn(
        "fixed z-40 select-none rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-2xl backdrop-blur",
        mode === "chip" && "!bg-cyan-400"
      )}
      style={{
        left: pos.x,
        top: pos.y,
        width: w,
        height: h,
      }}
    >
      {mode === "chip" ? (
        <button
          onClick={() => setMode("mini")}
          className="flex h-full w-full items-center justify-center rounded-2xl text-neutral-950"
          aria-label="Open Anchor assistant"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      ) : (
        <div className="flex h-full flex-col">
          {/* header (drag handle) */}
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="flex cursor-grab items-center justify-between rounded-t-2xl border-b border-neutral-900 bg-black/40 px-3 py-2 active:cursor-grabbing"
          >
            <div className="flex items-center gap-2 text-neutral-200">
              <GripVertical className="h-3.5 w-3.5 text-neutral-600" />
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              <span className="text-xs font-medium">Anchor</span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                {ctx.title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode("chip")}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-100"
                aria-label="Minimize"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMode(mode === "full" ? "mini" : "full")}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-100"
                aria-label={mode === "full" ? "Collapse" : "Expand"}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMode("closed")}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-100"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* context strip */}
          <div className="flex items-center justify-between border-b border-neutral-900 px-3 py-2 text-[11px] text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              {ctx.hint}
            </span>
            <span className="tabular-nums text-neutral-500">wellness {wellnessScore}</span>
          </div>

          {/* transcript */}
          <div ref={scrollerRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {visibleTurns.length === 0 && lastSystem && (
              <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100">
                {lastSystem.content}
              </div>
            )}
            {visibleTurns.map((t, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                  t.role === "assistant"
                    ? "bg-neutral-900/80 text-neutral-100"
                    : t.role === "user"
                    ? "ml-auto bg-cyan-400/15 text-cyan-100"
                    : "border border-cyan-400/15 bg-cyan-400/5 text-cyan-100"
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

          {/* suggestions row (only in full) */}
          {mode === "full" && (
            <div className="flex flex-wrap gap-1.5 border-t border-neutral-900 px-3 py-2">
              {[
                "Plan my next 90 minutes.",
                "Summarize what you've noticed today.",
                "Quiz me from my most recent note.",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={thinking}
                  className="rounded-full border border-neutral-800 bg-neutral-950/60 px-2.5 py-1 text-[10px] text-neutral-300 hover:border-cyan-400/40 hover:text-cyan-200 disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-2 border-t border-neutral-900 p-2"
          >
            <MessageCircle className="ml-1 h-3.5 w-3.5 shrink-0 text-neutral-600" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask Anchor…"
              className="flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              className="rounded-full bg-cyan-400 p-1.5 text-neutral-950 disabled:opacity-30"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
