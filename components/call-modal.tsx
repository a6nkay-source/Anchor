"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, X, Send, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  durationSeconds?: number;
}

type Phase = "connecting" | "listening" | "thinking" | "speaking" | "ended";

const OPENER =
  "Hey. I'm right here. Take a slow breath with me, and tell me what today feels like.";

export function CallModal({ open, onClose, durationSeconds = 30 }: CallModalProps) {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [remaining, setRemaining] = useState(durationSeconds);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micSupported, setMicSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<any>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const endedRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined") return;
      if (muted || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.92;
        u.pitch = 1.0;
        u.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => /female|samantha|karen|serena|ava/i.test(v.name)) ??
          voices.find((v) => v.lang?.startsWith("en"));
        if (preferred) u.voice = preferred;
        utterRef.current = u;
        setPhase("speaking");
        u.onend = () => {
          if (!endedRef.current) setPhase("listening");
        };
        window.speechSynthesis.speak(u);
      } catch {
        /* speech is best-effort */
      }
    },
    [muted]
  );

  const sendToModel = useCallback(
    async (userText: string) => {
      if (!userText.trim() || endedRef.current) return;
      const nextTurns: Turn[] = [...turns, { role: "user", content: userText.trim() }];
      setTurns(nextTurns);
      setDraft("");
      setPhase("thinking");
      setError(null);

      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextTurns.map((t) => ({ role: t.role, content: t.content })),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.reply) {
          setError(data.error ?? "Something went quiet.");
          setPhase("listening");
          return;
        }
        setTurns((t) => [...t, { role: "assistant", content: data.reply }]);
        speak(data.reply);
      } catch (e) {
        setError("Couldn't reach the model. Check your connection.");
        setPhase("listening");
      }
    },
    [turns, speak]
  );

  // open effect: reset + play opener
  useEffect(() => {
    if (!open) return;
    endedRef.current = false;
    setPhase("connecting");
    setTurns([{ role: "assistant", content: OPENER }]);
    setDraft("");
    setRemaining(durationSeconds);
    setError(null);

    // let the speech engine warm up
    const t = setTimeout(() => {
      if (endedRef.current) return;
      speak(OPENER);
    }, 350);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, durationSeconds]);

  // countdown
  useEffect(() => {
    if (!open || phase === "ended") return;
    if (remaining <= 0) {
      endedRef.current = true;
      setPhase("ended");
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      const closer =
        "That's our thirty. You showed up — that counts. I'll be here when you need another moment.";
      setTurns((t) => [...t, { role: "assistant", content: closer }]);
      // one last soft line
      const timer = setTimeout(() => speak(closer), 200);
      return () => clearTimeout(timer);
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [open, remaining, phase, speak]);

  // scroll transcript to bottom
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [turns]);

  // set up Web Speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicSupported(false);
      return;
    }
    setMicSupported(true);
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript;
      if (text) sendToModel(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
    };
  }, [sendToModel]);

  const startListening = () => {
    if (!recognitionRef.current || endedRef.current) return;
    try {
      recognitionRef.current.start();
      setListening(true);
      setPhase("listening");
    } catch {
      /* already started */
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  };

  const close = useCallback(() => {
    endedRef.current = true;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    stopListening();
    onClose();
  }, [onClose]);

  // esc to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, close]);

  const progress = useMemo(
    () => 1 - remaining / durationSeconds,
    [remaining, durationSeconds]
  );

  if (!open) return null;

  const orbLabel =
    phase === "connecting"
      ? "connecting"
      : phase === "thinking"
      ? "listening back"
      : phase === "speaking"
      ? "speaking"
      : phase === "ended"
      ? "call ended"
      : listening
      ? "listening"
      : "ready";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-950 to-black shadow-2xl">
        {/* countdown */}
        <div className="absolute inset-x-0 top-0 h-1 bg-neutral-900">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-cyan-300" />
            Anchor · {phase === "ended" ? "call ended" : `${remaining}s left`}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMuted((m) => {
                  if (!m && typeof window !== "undefined")
                    window.speechSynthesis?.cancel();
                  return !m;
                });
              }}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={close}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              aria-label="End call"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* orb */}
        <div className="flex flex-col items-center gap-3 px-6 pt-6">
          <div className="relative h-40 w-40">
            <div
              className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/70 to-emerald-400/40 blur-2xl transition-opacity",
                phase === "speaking"
                  ? "opacity-90 animate-breathe"
                  : phase === "thinking"
                  ? "opacity-70 animate-pulse"
                  : "opacity-60 animate-breathe"
              )}
            />
            <div
              className={cn(
                "absolute inset-4 rounded-full bg-gradient-to-br from-cyan-300 to-teal-500",
                phase === "speaking" && "animate-breathe",
                phase === "thinking" && "animate-pulse"
              )}
            />
            <div className="absolute inset-8 rounded-full bg-black/40 backdrop-blur-sm" />
          </div>
          <span className="text-xs uppercase tracking-[0.22em] text-neutral-500">
            {orbLabel}
          </span>
        </div>

        {/* transcript */}
        <div
          ref={scrollerRef}
          className="mx-6 mt-6 h-40 space-y-3 overflow-y-auto rounded-xl border border-neutral-900 bg-neutral-950/70 p-4 text-sm leading-relaxed"
        >
          {turns.map((t, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2",
                t.role === "assistant"
                  ? "bg-neutral-900/80 text-neutral-100"
                  : "ml-auto bg-cyan-400/15 text-cyan-100"
              )}
            >
              {t.content}
            </div>
          ))}
          {phase === "thinking" && (
            <div className="max-w-[85%] rounded-2xl bg-neutral-900/80 px-3 py-2 text-neutral-400">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:300ms]" />
              </span>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* input */}
        <form
          className="flex items-center gap-2 border-t border-neutral-900 bg-neutral-950/80 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (phase === "ended") return;
            sendToModel(draft);
          }}
        >
          {micSupported && (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={phase === "ended" || phase === "thinking"}
              className={cn(
                "shrink-0 rounded-full p-2 transition-colors",
                listening
                  ? "bg-rose-500/20 text-rose-300"
                  : "bg-cyan-400/15 text-cyan-200 hover:bg-cyan-400/25",
                (phase === "ended" || phase === "thinking") && "opacity-40"
              )}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              phase === "ended"
                ? "Call ended."
                : listening
                ? "Listening…"
                : "Say what's on your mind"
            }
            disabled={phase === "ended"}
            className="flex-1 rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-cyan-400/50 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || phase === "ended" || phase === "thinking"}
            className="shrink-0 rounded-full bg-cyan-400 p-2 text-neutral-950 disabled:opacity-30"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {phase === "ended" && (
          <div className="px-6 pb-6 pt-2">
            <button
              onClick={close}
              className="w-full rounded-full border border-neutral-800 bg-neutral-950 py-2 text-sm text-neutral-300 hover:border-cyan-400/40"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
