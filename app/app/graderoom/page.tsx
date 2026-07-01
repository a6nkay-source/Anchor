"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/page-header";
import { courses, gpa, assignments } from "@/lib/mock-data";
import { TrendingUp, Beaker } from "lucide-react";

function letter(g: number) {
  if (g >= 93) return "A";
  if (g >= 90) return "A-";
  if (g >= 87) return "B+";
  if (g >= 83) return "B";
  if (g >= 80) return "B-";
  if (g >= 77) return "C+";
  if (g >= 70) return "C";
  return "D";
}

function pointsForLetter(l: string) {
  return { A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, D: 1.0 }[l] ?? 0;
}

export default function GradeRoom() {
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);

  const projected = useMemo(() => {
    let totalPoints = 0;
    for (const c of courses) {
      const g = Math.max(0, Math.min(100, c.currentGrade + (deltas[c.id] ?? 0)));
      totalPoints += pointsForLetter(letter(g)) * c.credits;
    }
    return totalPoints / totalCredits;
  }, [deltas, totalCredits]);

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="GradeRoom."
        subtitle="Break down every course, and simulate what a small shift would do to your GPA."
      />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatTile label="Current GPA" value={gpa.current.toFixed(2)} hint={`target ${gpa.target.toFixed(2)}`} accent="cyan" />
        <StatTile label="Projected GPA" value={projected.toFixed(2)} hint="with your what-if" accent="emerald" />
        <StatTile label="Credits" value={totalCredits} hint={`${courses.length} classes`} accent="violet" />
        <StatTile label="Δ from current" value={`${(projected - gpa.current >= 0 ? "+" : "") + (projected - gpa.current).toFixed(2)}`} accent="rose" />
      </div>

      <div className="space-y-3">
        {courses.map((c) => {
          const g = Math.max(0, Math.min(100, c.currentGrade + (deltas[c.id] ?? 0)));
          const l = letter(g);
          const courseAssignments = assignments.filter((a) => a.courseId === c.id);
          const done = courseAssignments.filter((a) => a.status === "done").length;
          return (
            <Card key={c.id} className="bg-neutral-950/60 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-xs text-neutral-500">{c.code}</span>
                    <span className="text-sm text-neutral-100">{c.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {c.credits} credits · {c.professor} · {done}/{courseAssignments.length} assignments done
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold tabular-nums text-neutral-100">
                    {g.toFixed(0)}
                  </div>
                  <div className="text-xs text-neutral-500">{l}</div>
                </div>
              </div>

              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-900">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${g}%`,
                    background: `linear-gradient(90deg, ${c.color}, ${c.color}aa)`,
                  }}
                />
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs text-neutral-400">
                <Beaker className="h-3.5 w-3.5 text-cyan-300" />
                <span>what-if:</span>
                <input
                  type="range"
                  min={-15}
                  max={15}
                  value={deltas[c.id] ?? 0}
                  onChange={(e) =>
                    setDeltas((d) => ({ ...d, [c.id]: Number(e.target.value) }))
                  }
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-10 text-right tabular-nums">
                  {(deltas[c.id] ?? 0) >= 0 ? "+" : ""}
                  {deltas[c.id] ?? 0}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 bg-neutral-950/60 p-4 text-sm text-neutral-400">
        <div className="mb-1 flex items-center gap-2 text-neutral-200">
          <TrendingUp className="h-4 w-4 text-cyan-300" />
          Notes
        </div>
        Anchor uses a standard letter → GPA points mapping and weighs by credits.
        "What-if" changes stay local — they don't touch your real grades.
      </Card>
    </div>
  );
}
