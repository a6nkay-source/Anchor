"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/page-header";
import { courses, gpa } from "@/lib/mock-data";
import { CalendarClock, GraduationCap, TrendingUp } from "lucide-react";

function daysUntil(iso: string) {
  const d = new Date(iso).getTime();
  return Math.max(0, Math.round((d - Date.now()) / (24 * 3600_000)));
}

export default function CoursesPage() {
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Your semester."
        subtitle="Grades, upcoming exams, and how each class is trending."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatTile
          label="Current GPA"
          value={gpa.current.toFixed(2)}
          hint={`target ${gpa.target.toFixed(2)}`}
          accent="cyan"
        />
        <StatTile
          label="Enrolled credits"
          value={totalCredits}
          hint={`${courses.length} courses`}
          accent="emerald"
        />
        <StatTile
          label="Next exam"
          value={`${Math.min(
            ...courses
              .filter((c) => c.nextExam)
              .map((c) => daysUntil(c.nextExam!.date))
          )}d`}
          hint="all courses considered"
          accent="violet"
        />
        <StatTile
          label="Trend"
          value={`+${(gpa.current - gpa.trend[0]).toFixed(2)}`}
          hint="last 5 weeks"
          accent="rose"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => {
          const days = c.nextExam ? daysUntil(c.nextExam.date) : null;
          return (
            <Card key={c.id} className="relative overflow-hidden bg-neutral-950/60 p-6">
              <div
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: c.color }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: `${c.color}22`,
                        color: c.color,
                      }}
                    >
                      {c.code}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {c.credits} credits
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-medium text-neutral-100">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {c.professor} · {c.meetingTimes}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums text-neutral-100">
                    {c.currentGrade}
                  </div>
                  <div className="text-xs text-neutral-500">{c.letterGrade}</div>
                </div>
              </div>

              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-neutral-900">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${c.currentGrade}%`,
                    background: `linear-gradient(90deg, ${c.color}, ${c.color}bb)`,
                  }}
                />
              </div>

              {c.nextExam && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-neutral-900 bg-black/40 px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-2 text-neutral-300">
                    <CalendarClock className="h-3.5 w-3.5 text-cyan-300" />
                    {c.nextExam.name}
                  </span>
                  <span
                    className={
                      days! <= 3
                        ? "text-rose-300"
                        : days! <= 7
                        ? "text-amber-300"
                        : "text-neutral-400"
                    }
                  >
                    {days}d
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs">
                <Link
                  href={`/app/notes`}
                  className="rounded-full border border-neutral-800 px-3 py-1 text-neutral-300 hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  Notes
                </Link>
                <Link
                  href={`/app/assignments`}
                  className="rounded-full border border-neutral-800 px-3 py-1 text-neutral-300 hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  Assignments
                </Link>
                <Link
                  href={`/app/flashcards`}
                  className="rounded-full border border-neutral-800 px-3 py-1 text-neutral-300 hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  Flashcards
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 bg-neutral-950/60 p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-medium text-neutral-100">
              GPA trend
            </h3>
          </div>
          <span className="text-xs text-neutral-500">last 5 weeks</span>
        </div>
        <GpaSparkline data={gpa.trend} target={gpa.target} />
      </Card>

      <Card className="mt-4 flex items-center gap-4 bg-neutral-950/60 p-4">
        <GraduationCap className="h-5 w-5 text-cyan-300" />
        <div className="text-sm text-neutral-300">
          Anchor watches how you spend hours per course and quietly flags when
          effort and grade drift out of sync.
        </div>
      </Card>
    </div>
  );
}

function GpaSparkline({ data, target }: { data: number[]; target: number }) {
  const w = 640;
  const h = 96;
  const min = Math.min(...data, target) - 0.1;
  const max = Math.max(...data, target) + 0.1;
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (w - 20) + 10;
      const y = h - ((v - min) / range) * (h - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");
  const targetY = h - ((target - min) / range) * (h - 20) - 10;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <line
        x1="0"
        y1={targetY}
        x2={w}
        y2={targetY}
        stroke="rgba(103,232,249,0.35)"
        strokeDasharray="4 4"
      />
      <text x={w - 6} y={targetY - 4} textAnchor="end" fontSize="10" fill="#67e8f9">
        target {target.toFixed(2)}
      </text>
      <polyline
        fill="none"
        stroke="url(#g)"
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * (w - 20) + 10;
        const y = h - ((v - min) / range) * (h - 20) - 10;
        return <circle key={i} cx={x} cy={y} r="3" fill="#67e8f9" />;
      })}
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
      </defs>
    </svg>
  );
}
