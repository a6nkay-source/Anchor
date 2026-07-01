"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  assignments as seed,
  courseById,
  humanDue,
  type Assignment,
} from "@/lib/mock-data";
import { Clock, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const columns: { id: Assignment["status"]; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "review", label: "Reviewing" },
  { id: "done", label: "Done" },
];

export default function AssignmentsPage() {
  const [items, setItems] = useState<Assignment[]>(seed);
  const [dragId, setDragId] = useState<string | null>(null);

  const totalPoints = items.reduce((s, a) => s + a.points, 0);
  const donePoints = items
    .filter((a) => a.status === "done")
    .reduce((s, a) => s + a.points, 0);
  const overdue = items.filter(
    (a) => a.status !== "done" && new Date(a.due).getTime() < Date.now()
  ).length;

  const move = (id: string, to: Assignment["status"]) => {
    setItems((a) => a.map((x) => (x.id === id ? { ...x, status: to } : x)));
  };

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Assignments."
        subtitle="Drag to reprioritize. Anchor can plan the next block for you."
        actions={
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>{donePoints}/{totalPoints} pts</span>
            {overdue > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-rose-200">
                <AlertTriangle className="h-3 w-3" /> {overdue} overdue
              </span>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        {columns.map((col) => {
          const list = items.filter((a) => a.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) move(dragId, col.id);
                setDragId(null);
              }}
              className="flex min-h-[240px] flex-col gap-2"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {col.label}
                </h3>
                <span className="text-[10px] text-neutral-600">
                  {list.length}
                </span>
              </div>
              {list.map((a) => {
                const course = courseById(a.courseId);
                const overdue =
                  a.status !== "done" && new Date(a.due).getTime() < Date.now();
                return (
                  <Card
                    key={a.id}
                    draggable
                    onDragStart={() => setDragId(a.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "cursor-grab bg-neutral-950/60 p-3 transition-colors hover:border-cyan-400/30 active:cursor-grabbing",
                      a.status === "done" && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      {course ? (
                        <span
                          className="rounded px-1.5 py-0.5 font-medium"
                          style={{
                            background: `${course.color}22`,
                            color: course.color,
                          }}
                        >
                          {course.code}
                        </span>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 tabular-nums",
                          overdue ? "text-rose-300" : "text-neutral-500"
                        )}
                      >
                        <Clock className="h-3 w-3" /> {humanDue(a.due)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-snug text-neutral-100">
                      {a.title}
                    </p>
                    {a.notes && (
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {a.notes}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>{a.points} pts</span>
                      <span>~{a.estMinutes} min</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {columns
                        .filter((c) => c.id !== a.status)
                        .map((c) => (
                          <button
                            key={c.id}
                            onClick={() => move(a.id, c.id)}
                            className="rounded border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500 hover:border-cyan-400/40 hover:text-cyan-200"
                          >
                            → {c.label}
                          </button>
                        ))}
                    </div>
                  </Card>
                );
              })}
              {list.length === 0 && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-neutral-900 p-6 text-[11px] text-neutral-600">
                  {col.id === "done" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    "empty"
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
