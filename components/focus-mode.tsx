"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Focus, X, ShieldCheck, Eye } from "lucide-react";
import { useSignals } from "@/components/signals-store";
import { useMonitor } from "@/components/wellness-monitor";

interface FocusCtx {
  active: boolean;
  minutes: number;
  startedAt: number | null;
  remainingSec: number;
  start: (minutes?: number) => Promise<void>;
  stop: () => Promise<void>;
  distractionAttempts: number;
}

const FocusContext = createContext<FocusCtx | null>(null);
const STORAGE = "anchor.focus.v1";

export const BLOCKED_SITES = [
  "instagram.com",
  "tiktok.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "threads.net",
  "youtube.com/shorts",
];

export const ALLOWED_APPS = [
  { name: "VS Code", why: "coding" },
  { name: "Cursor", why: "coding" },
  { name: "Claude", why: "AI help" },
  { name: "ChatGPT", why: "AI help" },
  { name: "Google Docs", why: "writing" },
  { name: "Microsoft Word", why: "writing" },
  { name: "Canvas", why: "LMS" },
  { name: "Google Classroom", why: "LMS" },
  { name: "Moodle", why: "LMS" },
  { name: "PDF readers", why: "reading" },
];

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { startSession, endSession, logDistraction, addNudge } = useSignals();
  const { start: startCam, phase: camPhase } = useMonitor();

  const [active, setActive] = useState(false);
  const [minutes, setMinutes] = useState(25);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [distractionAttempts, setDistractionAttempts] = useState(0);

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
      endSession();
      addNudge({
        source: "system",
        text: `Focus block complete. You held ${minutes} minutes.`,
      });
    }
  }, [active, remainingSec, startedAt, minutes, endSession, addNudge]);

  // Distraction detection while Focus is active
  useEffect(() => {
    if (!active) return;

    const onVisibility = () => {
      if (document.hidden) {
        logDistraction({ kind: "tab-hidden" });
        setDistractionAttempts((n) => n + 1);
      }
    };
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        logDistraction({ kind: "fullscreen-exit" });
      }
    };
    const onBlur = () => {
      logDistraction({ kind: "app-blur" });
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Focus Mode is running. Are you sure you want to leave?";
      return e.returnValue;
    };
    // intercept clicks to blocked hosts
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement)?.closest("a");
      if (!t) return;
      const href = t.getAttribute("href") || "";
      const isBlocked = BLOCKED_SITES.some((s) => href.includes(s));
      if (isBlocked) {
        e.preventDefault();
        logDistraction({ kind: "blocked-click", detail: href });
        setDistractionAttempts((n) => n + 1);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active, logDistraction]);

  const start = useCallback(
    async (m = 25) => {
      setMinutes(m);
      setStartedAt(Date.now());
      setActive(true);
      setDistractionAttempts(0);
      startSession();

      // request fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}

      // auto-start camera if user opted in via Settings
      try {
        const raw = localStorage.getItem("anchor.settings.v1");
        const s = raw ? JSON.parse(raw) : { camera: false };
        if (s.camera && camPhase !== "running") {
          await startCam();
        }
      } catch {}

      addNudge({ source: "system", text: "Focus Mode started. I'll keep the noise out." });
    },
    [addNudge, startSession, startCam, camPhase]
  );

  const stop = useCallback(async () => {
    setActive(false);
    setStartedAt(null);
    endSession();
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}
  }, [endSession]);

  const value = useMemo(
    () => ({ active, minutes, startedAt, remainingSec, start, stop, distractionAttempts }),
    [active, minutes, startedAt, remainingSec, start, stop, distractionAttempts]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const c = useContext(FocusContext);
  if (!c) throw new Error("useFocus must be used inside FocusProvider");
  return c;
}

export function FocusOverlay() {
  const { active, remainingSec, minutes, stop, distractionAttempts } = useFocus();
  const { state } = useSignals();
  const { phase: camPhase } = useMonitor();

  if (!active) return null;

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const pct = 1 - remainingSec / (minutes * 60);

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 80%)",
        }}
      />
      <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between border-b border-cyan-400/20 bg-black/70 px-6 py-2 backdrop-blur">
        <div className="flex items-center gap-3 text-sm text-cyan-100">
          <Focus className="h-4 w-4 text-cyan-300" />
          <span className="font-medium">Focus Mode</span>
          <span className="text-xs tabular-nums text-cyan-200/70">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")} left
          </span>
          {camPhase === "running" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200">
              <Eye className="h-3 w-3" /> monitoring
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-[11px] text-neutral-400 md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            blocking {BLOCKED_SITES.length} sites
            {distractionAttempts > 0 && (
              <span className="ml-2 text-amber-300">· {distractionAttempts} attempts</span>
            )}
          </div>
          <button
            onClick={async () => {
              if (
                window.confirm(
                  "Exit Focus Mode? You still have time left. Anchor will save the session."
                )
              ) {
                await stop();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs text-rose-200 hover:border-rose-400/60"
          >
            <X className="h-3.5 w-3.5" /> Exit Focus Mode
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[38px] h-0.5 bg-neutral-900">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-1000 ease-linear"
          style={{ width: `${Math.min(100, pct * 100)}%` }}
        />
      </div>
    </div>
  );
}
