"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AvatarOrb } from "@/components/avatar-orb";
import { assignments, courseById } from "@/lib/mock-data";
import { useSignals } from "@/components/signals-store";
import { last30Days, avg } from "@/lib/history";
import { Sparkles, ArrowRight } from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late again";
}

export function DailyCompanion() {
  const { state, metrics } = useSignals();
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("anchor.profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.firstName) setFirstName(p.firstName);
      }
    } catch {}
  }, []);

  const nextTask = assignments
    .filter((a) => a.status !== "done")
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0];
  const suggestedCourse = nextTask && courseById(nextTask.courseId);

  const doneToday = assignments.filter((a) => a.status === "done").length;
  const totalOpen = assignments.filter((a) => a.status !== "done").length;

  const week = last30Days().slice(-7);
  const wellnessDelta = Math.round(avg(week.map((d) => d.wellness))) - state.history.slice(-1).map((d) => d.wellness)[0] || 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 p-6">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "hsl(188 90% 55% / 0.14)" }}
      />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl">
            {doneToday > 0 ? `Nice — ${doneToday} down.` : "Ready when you are."}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">
            {suggestedCourse
              ? `Softest place to start today is ${suggestedCourse.code} — "${nextTask.title}" is due ${new Date(nextTask.due).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}. ${totalOpen} open items overall.`
              : "You're clear for now. Rest is productive too."}
          </p>

          {suggestedCourse && (
            <a
              href="/app/prescription"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="h-4 w-4" /> Get a plan for today
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <AvatarOrb size={110} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            {metrics.mood}
          </span>
        </div>
      </div>
    </Card>
  );
}
