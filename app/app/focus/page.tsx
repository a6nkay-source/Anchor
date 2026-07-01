"use client";

import { Card } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/page-header";
import { useFocus } from "@/components/focus-mode";
import { Focus, Play, Square, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const BLOCKED_SITES = [
  { name: "twitter.com", why: "endless scroll" },
  { name: "reddit.com", why: "rabbit holes" },
  { name: "youtube.com", why: "one-more-video loops" },
  { name: "tiktok.com", why: "attention drain" },
  { name: "instagram.com", why: "comparison" },
  { name: "discord.com/channels", why: "constant pings" },
  { name: "news.ycombinator.com", why: "distraction disguised as news" },
];

const PRESETS = [
  { minutes: 15, label: "Warmup" },
  { minutes: 25, label: "Pomodoro" },
  { minutes: 50, label: "Deep block" },
  { minutes: 90, label: "Long dive" },
];

export default function FocusRoomPage() {
  const { active, minutes, remainingSec, start, stop } = useFocus();
  const mm = Math.floor(remainingSec / 60);
  const ss = remainingSec % 60;

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Focus Room."
        subtitle="A quiet timer with a fake distraction blocker for the demo. Everything reversible."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatTile
          label="Focus this week"
          value="14.2h"
          hint="+2.1h vs last week"
          accent="cyan"
        />
        <StatTile
          label="Longest block"
          value="1h 25m"
          hint="Tuesday, MATH 104"
          accent="emerald"
        />
        <StatTile
          label="Blocks today"
          value="3"
          hint="24m avg"
          accent="violet"
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
        <div className="relative flex flex-col items-center gap-6">
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
          </div>

          {!active ? (
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  onClick={() => start(p.minutes)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-5 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
                >
                  <Play className="h-4 w-4" /> {p.label} · {p.minutes}m
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-400/10 px-6 py-2 text-sm text-rose-200 hover:border-rose-400/70"
            >
              <Square className="h-4 w-4" /> Exit Focus Mode
            </button>
          )}
        </div>
      </Card>

      <Card className="mt-6 bg-neutral-950/60 p-6">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          <h3 className="text-sm font-medium text-neutral-100">
            Distraction blocker (demo)
          </h3>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          In a shipped build, Anchor would silently redirect these hosts while
          Focus is on. For this demo the blocker is visual — everything remains
          reachable and reversible.
        </p>
        <ul className="grid gap-2 md:grid-cols-2">
          {BLOCKED_SITES.map((s) => (
            <li
              key={s.name}
              className="flex items-center justify-between rounded-lg border border-neutral-900 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="text-neutral-200">{s.name}</span>
              <span className="text-neutral-500">{s.why}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
