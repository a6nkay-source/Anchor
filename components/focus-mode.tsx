"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Focus, X, ShieldCheck } from "lucide-react";

interface FocusCtx {
  active: boolean;
  minutes: number;
  startedAt: number | null;
  remainingSec: number;
  start: (minutes?: number) => void;
  stop: () => void;
}

const FocusContext = createContext<FocusCtx | null>(null);
const STORAGE = "anchor.focus.v1";

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.active && p.startedAt && p.minutes) {
          const elapsedSec = (Date.now() - p.startedAt) / 1000;
          if (elapsedSec < p.minutes * 60) {
            setActive(true);
            setStartedAt(p.startedAt);
            setMinutes(p.minutes);
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({ active, startedAt, minutes })
      );
    } catch {}
  }, [active, startedAt, minutes]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const remainingSec = useMemo(() => {
    if (!active || !startedAt) return 0;
    return Math.max(0, minutes * 60 - Math.floor((now - startedAt) / 1000));
  }, [active, startedAt, minutes, now]);

  useEffect(() => {
    if (active && remainingSec === 0 && startedAt) {
      setActive(false);
      setStartedAt(null);
    }
  }, [active, remainingSec, startedAt]);

  const start = useCallback((m = 25) => {
    setMinutes(m);
    setStartedAt(Date.now());
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setStartedAt(null);
  }, []);

  const value = useMemo(
    () => ({ active, minutes, startedAt, remainingSec, start, stop }),
    [active, minutes, startedAt, remainingSec, start, stop]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const c = useContext(FocusContext);
  if (!c) throw new Error("useFocus must be used inside FocusProvider");
  return c;
}

const BLOCKED_SAMPLES = [
  "twitter.com",
  "reddit.com",
  "youtube.com",
  "tiktok.com",
  "news.ycombinator.com",
  "instagram.com",
  "discord.com/channels",
];

export function FocusOverlay() {
  const { active, remainingSec, minutes, stop } = useFocus();
  if (!active) return null;

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const pct = 1 - remainingSec / (minutes * 60);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* soft vignette so the rest of the app still shows through */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 80%)",
        }}
      />

      {/* top ribbon */}
      <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between border-b border-cyan-400/20 bg-black/70 px-6 py-2 backdrop-blur">
        <div className="flex items-center gap-3 text-sm text-cyan-100">
          <Focus className="h-4 w-4 text-cyan-300" />
          <span className="font-medium">Focus Mode</span>
          <span className="text-xs text-cyan-200/70">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")} left
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-[11px] text-neutral-400 md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            blocking {BLOCKED_SAMPLES.length} distraction sites
          </div>
          <button
            onClick={stop}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs text-rose-200 hover:border-rose-400/60"
          >
            <X className="h-3.5 w-3.5" /> Exit Focus Mode
          </button>
        </div>
      </div>

      {/* progress bar under ribbon */}
      <div className="pointer-events-none absolute inset-x-0 top-[38px] h-0.5 bg-neutral-900">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
