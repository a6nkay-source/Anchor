"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { courses, notes, assignments } from "@/lib/mock-data";

interface Node {
  id: string;
  label: string;
  kind: "course" | "topic" | "note" | "assignment";
  x: number;
  y: number;
  color: string;
  r: number;
}

interface Edge {
  a: string;
  b: string;
}

const TOPICS: Record<string, string[]> = {
  cs229: ["gradient descent", "regularization", "SVMs", "backprop", "bias-variance"],
  math104: ["compactness", "Cauchy sequences", "supremum", "uniform continuity"],
  phil12: ["Turkle", "surveillance", "ethics of AI", "attention"],
  bio2a: ["PCR", "DNA polymerase", "mRNA", "gel electrophoresis"],
};

export default function KnowledgeGraph() {
  const [selected, setSelected] = useState<Node | null>(null);

  const { nodes, edges } = useMemo(() => build(), []);

  const highlight = new Set<string>();
  if (selected) {
    highlight.add(selected.id);
    for (const e of edges) {
      if (e.a === selected.id) highlight.add(e.b);
      if (e.b === selected.id) highlight.add(e.a);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Knowledge graph."
        subtitle="Every course, topic, note, and assignment as one map. Click a node."
      />

      <Card className="relative overflow-hidden bg-neutral-950/60">
        <div className="h-[560px] w-full">
          <svg viewBox="0 0 900 560" className="h-full w-full">
            {edges.map((e, i) => {
              const a = nodes.find((n) => n.id === e.a)!;
              const b = nodes.find((n) => n.id === e.b)!;
              const hi =
                selected && (e.a === selected.id || e.b === selected.id);
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={hi ? "rgba(103,232,249,0.7)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={hi ? 1.5 : 1}
                />
              );
            })}
            {nodes.map((n) => {
              const isSel = selected?.id === n.id;
              const isNeighbor = selected && highlight.has(n.id);
              const dim = selected && !isNeighbor;
              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(isSel ? null : n)}
                  opacity={dim ? 0.25 : 1}
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r + (isSel ? 4 : 0)}
                    fill={`${n.color}22`}
                    stroke={n.color}
                    strokeWidth={isSel ? 2 : 1}
                  />
                  <text
                    x={n.x}
                    y={n.y + n.r + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#a1a1aa"
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {selected && (
          <div className="absolute right-4 top-4 max-w-xs rounded-xl border border-neutral-800 bg-black/80 p-4 backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {selected.kind}
            </div>
            <div className="mt-1 text-sm font-medium text-neutral-100">
              {selected.label}
            </div>
            <div className="mt-2 text-xs text-neutral-400">
              {selected.kind === "course"
                ? "All topics, notes, and assignments hanging off this course are highlighted."
                : "Related course and neighbors are highlighted."}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-400">
        {["course", "topic", "note", "assignment"].map((k, i) => {
          const c = ["#67e8f9", "#a78bfa", "#86efac", "#fda4af"][i];
          return (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: c }}
              />
              {k}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function build(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const cx = 450;
  const cy = 280;

  // Position courses around a circle
  courses.forEach((c, i) => {
    const angle = (i / courses.length) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * 220;
    const y = cy + Math.sin(angle) * 180;
    nodes.push({ id: `c:${c.id}`, label: c.code, kind: "course", x, y, color: c.color, r: 20 });

    // topics around course
    const topics = TOPICS[c.id] ?? [];
    topics.forEach((t, ti) => {
      const a2 = angle + (ti - (topics.length - 1) / 2) * 0.35;
      const rad = 90 + (ti % 2) * 30;
      const tx = x + Math.cos(a2) * rad;
      const ty = y + Math.sin(a2) * rad;
      const id = `t:${c.id}:${ti}`;
      nodes.push({ id, label: t, kind: "topic", x: tx, y: ty, color: "#a78bfa", r: 8 });
      edges.push({ a: `c:${c.id}`, b: id });
    });
  });

  // Notes: attached to their course if any, else floating
  notes.forEach((n, i) => {
    const anchor = n.courseId ? nodes.find((x) => x.id === `c:${n.courseId}`) : null;
    const angle = ((i + 0.5) / notes.length) * Math.PI * 2;
    const x = (anchor?.x ?? cx) + Math.cos(angle) * 60;
    const y = (anchor?.y ?? cy) + Math.sin(angle) * 60;
    const id = `n:${n.id}`;
    nodes.push({ id, label: n.title.slice(0, 24), kind: "note", x, y, color: "#86efac", r: 6 });
    if (anchor) edges.push({ a: anchor.id, b: id });
  });

  // Assignments
  assignments.slice(0, 6).forEach((a, i) => {
    const anchor = a.courseId ? nodes.find((x) => x.id === `c:${a.courseId}`) : null;
    if (!anchor) return;
    const angle = (i / 6) * Math.PI * 2;
    const x = anchor.x + Math.cos(angle) * 50 - 30;
    const y = anchor.y + Math.sin(angle) * 50 + 30;
    const id = `a:${a.id}`;
    nodes.push({ id, label: a.title.slice(0, 20), kind: "assignment", x, y, color: "#fda4af", r: 6 });
    edges.push({ a: anchor.id, b: id });
  });

  return { nodes, edges };
}
