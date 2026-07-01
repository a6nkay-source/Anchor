"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useSignals } from "@/components/signals-store";
import { Trophy, Star } from "lucide-react";

// Every possible milestone — locked ones are shown greyed with their unlock hint.
const ALL: { label: string; hint: string; icon?: string }[] = [
  { label: "First flow state", hint: "Hold focus > 75 with stress < 45 for 20 seconds.", icon: "✦" },
  { label: "First 25-min focus block", hint: "Complete a 25-minute session.", icon: "◉" },
  { label: "Longest focus session", hint: "Complete a session ≥ 45 minutes.", icon: "◈" },
  { label: "Deep block", hint: "Complete a 50-minute session.", icon: "◉" },
  { label: "Long dive", hint: "Hold focus for 90 minutes.", icon: "◉" },
  { label: "Best posture session", hint: "A full minute above 90 posture score.", icon: "◈" },
  { label: "Highest wellness score", hint: "Push composite wellness to 90.", icon: "★" },
  { label: "Weekly study goal completed", hint: "24 total study hours in a rolling week.", icon: "▲" },
  { label: "Most productive day", hint: "Cross 90 productivity for a day.", icon: "▲" },
  { label: "Assignment streak", hint: "Finish 3 assignments in one day.", icon: "▲" },
];

export default function AchievementsPage() {
  const { state } = useSignals();
  const unlocked = new Set(state.achievements.map((a) => a.label));

  return (
    <div>
      <PageHeader
        eyebrow="Milestones"
        title="Achievements."
        subtitle="Quiet celebrations. Each one records a moment you showed up."
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Card className="bg-neutral-950/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Unlocked</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-neutral-100">
            {state.achievements.length}
          </p>
        </Card>
        <Card className="bg-neutral-950/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Available</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-neutral-100">
            {ALL.length}
          </p>
        </Card>
        <Card className="bg-neutral-950/60 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Last earned</p>
          <p className="mt-1 text-sm text-neutral-200 truncate">
            {state.achievements[0]?.label ?? "—"}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {ALL.map((a) => {
          const got = unlocked.has(a.label);
          const record = state.achievements.find((x) => x.label === a.label);
          return (
            <Card
              key={a.label}
              className={
                "flex items-start gap-4 p-5 transition-colors " +
                (got
                  ? "border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5"
                  : "bg-neutral-950/40 opacity-70")
              }
            >
              <div
                className={
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg " +
                  (got ? "bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-400/40" : "bg-neutral-900 text-neutral-600")
                }
              >
                {a.icon ?? "★"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-neutral-100">{a.label}</h3>
                  {got && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200">
                      <Star className="h-2.5 w-2.5" /> earned
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-500">{a.hint}</p>
                {record && (
                  <p className="mt-1 text-[10px] text-neutral-500">
                    {new Date(record.ts).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {record.detail ? ` · ${record.detail}` : ""}
                  </p>
                )}
              </div>
              {got && <Trophy className="h-4 w-4 text-cyan-300" />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
