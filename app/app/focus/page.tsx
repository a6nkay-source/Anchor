"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/page-header";
import { useFocus, BLOCKED_SITES, ALLOWED_APPS } from "@/components/focus-mode";
import { useSignals } from "@/components/signals-store";
import { useMonitor } from "@/components/wellness-monitor";
import { assignments, courseById } from "@/lib/mock-data";
import { Focus, Play, Square, ShieldCheck, Eye, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { minutes: 15, label: "Warmup" },
  { minutes: 25, label: "Pomodoro" },
  { minutes: 50, label: "Deep block" },
  { minutes: 90, label: "Long dive" },
];

export default function FocusRoomPage() {
  const { active, minutes, remainingSec, start, stop, distractionAttempts } = useFocus();
  const { wellnessScore, metrics, state } = useSignals();
  const { phase: camPhase, start: startCam } = useMonitor();

  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;
  const pct = active ? 1 - remainingSec / (minutes * 60) : 0;

  const currentAssignment = useMemo(
    () =>
      assignments
        .filter((a) => a.status !== "done")
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0],
    []
  );
  const currentCourse = currentAssignment && courseById(currentAssignment.courseId);

  const [coachLine, setCoachLine] = useState<string>("Anchor is watching quietly.");
  const [loadingCoach, setLoadingCoach] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const tick = async () => {
      if (loadingCoach) return;
      setLoadingCoach(true);
      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are Anchor's Focus coach. One short warm sentence for the fullscreen HUD. Under 18 words. No emojis.",
              },
              {
                role: "user",
                content: `Wellness ${wellnessScore}. Focus ${Math.round(metrics.focus)}. Stress ${Math.round(metrics.stress)}. ${distractionAttempts} distraction attempts. Current task: ${currentAssignment?.title ?? "—"}.`,
              },
            ],
          }),
        });
        const data = await res.json();
        if (!cancelled && data?.reply) setCoachLine(data.reply.trim());
      } finally {
        setLoadingCoach(false);
      }
    };
    tick();
    const id = setInterval(tick, 45_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, distractionAttempts]);

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Focus Room."
        subtitle="Full-screen block. Camera + AI coach stay on. Exit tracked in your session log."
      />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatTile label="Focus this week" value="14.2h" hint="+2.1h vs last week" accent="cyan" />
        <StatTile label="Longest block" value="1h 25m" hint="Tuesday" accent="emerald" />
        <StatTile label="Blocks today" value="3" hint="24m avg" accent="violet" />
        <StatTile
          label="Distractions"
          value={distractionAttempts}
          hint="this block"
          accent="rose"
        />
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-30",
            active ? "animate-pulse" : ""
          )}
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(103,232,249,0.16), transparent 60%)",
          }}
        />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
              Current assignment
            </div>
            {currentAssignment ? (
              <>
                <h3 className="text-xl font-medium text-neutral-100">
                  {currentAssignment.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  {currentCourse && (
                    <span
                      className="rounded px-1.5 py-0.5"
                      style={{
                        background: `${currentCourse.color}22`,
                        color: currentCourse.color,
                      }}
                    >
                      {currentCourse.code}
                    </span>
                  )}
                  <span>
                    due{" "}
                    {new Date(currentAssignment.due).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  <span className="uppercase tracking-[0.16em] text-neutral-500">objective ·</span>{" "}
                  finish {currentAssignment.title.split(" ")[0].toLowerCase()} in one block
                </div>
              </>
            ) : (
              <div className="text-sm text-neutral-500">
                No open assignments. Take a slow break.
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/10 ring-1 ring-cyan-400/30">
              <Focus className="h-6 w-6 text-cyan-300" />
            </div>
            <div className="text-center">
              <div className="tabular-nums text-6xl font-semibold tracking-tight text-neutral-100 md:text-7xl">
                {active
                  ? `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
                  : "—:—"}
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.24em] text-neutral-500">
                {active ? `focused · ${minutes} min block` : "no session"}
              </p>
              {active && (
                <div className="mt-3 h-1 w-56 overflow-hidden rounded-full bg-neutral-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-1000 ease-linear"
                    style={{ width: `${Math.min(100, pct * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {!active ? (
              <div className="flex flex-wrap justify-center gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    onClick={() => start(p.minutes)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-2 text-xs font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
                  >
                    <Play className="h-3.5 w-3.5" /> {p.label} · {p.minutes}m
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => {
                  if (window.confirm("Exit Focus Mode? You still have time left.")) stop();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm text-rose-200 hover:border-rose-400/70"
              >
                <Square className="h-4 w-4" /> Exit Focus Mode
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
              AI coach
            </div>
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm leading-relaxed text-cyan-100 min-h-[92px]">
              <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-cyan-300/80">
                <Sparkles className="h-3 w-3" />
                {loadingCoach ? "listening" : "now"}
              </div>
              {coachLine}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-neutral-800 bg-black/40 p-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">wellness</div>
                <div className="text-lg tabular-nums text-neutral-100">{wellnessScore}</div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-black/40 p-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">focus</div>
                <div className="text-lg tabular-nums text-neutral-100">{Math.round(metrics.focus)}</div>
              </div>
              <div className="rounded-lg border border-neutral-800 bg-black/40 p-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">stress</div>
                <div className="text-lg tabular-nums text-neutral-100">{Math.round(metrics.stress)}</div>
              </div>
            </div>
            {camPhase === "running" ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200">
                <Eye className="h-3 w-3" /> monitoring active
              </div>
            ) : (
              <button
                onClick={() => startCam()}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/60 px-2 py-1 text-[11px] text-neutral-300 hover:border-cyan-400/40"
              >
                <Eye className="h-3 w-3" /> turn on monitoring
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="bg-neutral-950/60 p-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-medium text-neutral-100">
              Blocked during focus
            </h3>
          </div>
          <p className="mb-3 text-xs text-neutral-500">
            Any click to these lands in the session log. Real OS-level blocking
            requires the Electron helper (see README).
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {BLOCKED_SITES.map((s) => (
              <li
                key={s}
                className="rounded-lg border border-neutral-900 bg-black/40 px-3 py-1.5 text-xs text-neutral-200"
              >
                {s}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-neutral-950/60 p-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-medium text-neutral-100">
              Allowed apps
            </h3>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {ALLOWED_APPS.map((a) => (
              <li
                key={a.name}
                className="flex items-center justify-between rounded-lg border border-neutral-900 bg-black/40 px-3 py-1.5 text-xs"
              >
                <span className="text-neutral-100">{a.name}</span>
                <span className="text-neutral-500">{a.why}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {state.distractions.length > 0 && (
        <Card className="mt-4 bg-neutral-950/60 p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-100">
            Distraction attempts this session
          </h3>
          <ul className="space-y-1">
            {state.distractions.slice(0, 10).map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between border-b border-neutral-900 py-1 text-xs text-neutral-400"
              >
                <span>
                  {d.kind}
                  {d.detail && (
                    <span className="ml-2 text-neutral-500">· {d.detail}</span>
                  )}
                </span>
                <span className="tabular-nums text-neutral-600">
                  {new Date(d.ts).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
