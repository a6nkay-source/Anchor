"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { calendar, courseById, type CalendarEvent } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8am..8pm
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(d = new Date()) {
  const day = (d.getDay() + 6) % 7; // Mon=0
  const s = new Date(d);
  s.setDate(d.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
}

const typeStyle: Record<CalendarEvent["type"], { bg: string; border: string; label: string }> = {
  lecture: {
    bg: "linear-gradient(180deg, rgba(103,232,249,0.16), rgba(103,232,249,0.05))",
    border: "rgba(103,232,249,0.4)",
    label: "lecture",
  },
  study: {
    bg: "linear-gradient(180deg, rgba(134,239,172,0.16), rgba(134,239,172,0.05))",
    border: "rgba(134,239,172,0.4)",
    label: "study",
  },
  exam: {
    bg: "linear-gradient(180deg, rgba(253,164,175,0.2), rgba(253,164,175,0.06))",
    border: "rgba(253,164,175,0.5)",
    label: "exam",
  },
  break: {
    bg: "linear-gradient(180deg, rgba(167,139,250,0.14), rgba(167,139,250,0.04))",
    border: "rgba(167,139,250,0.35)",
    label: "break",
  },
  personal: {
    bg: "linear-gradient(180deg, rgba(148,163,184,0.14), rgba(148,163,184,0.04))",
    border: "rgba(148,163,184,0.35)",
    label: "personal",
  },
};

export default function CalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(() => {
    const s = startOfWeek();
    s.setDate(s.getDate() + weekOffset * 7);
    return s;
  }, [weekOffset]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const e of calendar) {
    const d = new Date(e.start);
    const dayIndex = days.findIndex((x) => sameDay(x, d));
    if (dayIndex >= 0) {
      eventsByDay[dayIndex] = eventsByDay[dayIndex] ?? [];
      eventsByDay[dayIndex].push(e);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Your week."
        subtitle="Lectures, study blocks, and one small break Anchor already carved out."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:border-cyan-400/40"
            >
              ← prev
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:border-cyan-400/40"
            >
              this week
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:border-cyan-400/40"
            >
              next →
            </button>
          </div>
        }
      />

      <Card className="overflow-hidden bg-neutral-950/60">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-neutral-900">
          <div />
          {days.map((d, i) => {
            const today = sameDay(d, new Date());
            return (
              <div key={i} className="px-2 py-3 text-center">
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  {DAYS[i]}
                </div>
                <div
                  className={cn(
                    "mt-1 text-sm tabular-nums",
                    today ? "text-cyan-300" : "text-neutral-200"
                  )}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
          {/* hour column */}
          <div className="border-r border-neutral-900">
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-16 border-b border-neutral-900 pr-2 text-right text-[10px] text-neutral-600"
              >
                {h > 12 ? h - 12 : h}
                {h >= 12 ? "p" : "a"}
              </div>
            ))}
          </div>

          {days.map((_, dayIdx) => (
            <div key={dayIdx} className="relative border-r border-neutral-900">
              {HOURS.map((h) => (
                <div key={h} className="h-16 border-b border-neutral-900" />
              ))}
              {(eventsByDay[dayIdx] ?? []).map((e) => {
                const start = new Date(e.start);
                const startHour = start.getHours() + start.getMinutes() / 60;
                const topPx = (startHour - HOURS[0]) * 64;
                const heightPx = (e.durationMin / 60) * 64;
                if (topPx < 0 || topPx > HOURS.length * 64) return null;
                const style = typeStyle[e.type];
                const course = courseById(e.courseId);
                return (
                  <div
                    key={e.id}
                    className="absolute inset-x-1 overflow-hidden rounded-lg border p-1.5 text-[11px]"
                    style={{
                      top: topPx,
                      height: Math.max(24, heightPx),
                      background: style.bg,
                      borderColor: style.border,
                    }}
                  >
                    <div className="truncate font-medium text-neutral-100">
                      {e.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-400">
                      <span>
                        {String(start.getHours() % 12 || 12).padStart(2, "0")}:
                        {String(start.getMinutes()).padStart(2, "0")}
                        {start.getHours() >= 12 ? "p" : "a"}
                      </span>
                      {course && (
                        <span className="rounded-sm px-1" style={{ color: course.color }}>
                          {course.code}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 flex items-center justify-between bg-neutral-950/60 p-4 text-xs text-neutral-400">
        <span>
          Anchor watches how tightly your week is packed and suggests one small
          break when the density feels heavy.
        </span>
        <div className="flex items-center gap-3">
          {(Object.keys(typeStyle) as CalendarEvent["type"][]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-neutral-500">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: typeStyle[t].border }}
              />
              {t}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
