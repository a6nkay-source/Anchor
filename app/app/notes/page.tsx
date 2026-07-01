"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { notes as seed, courseById, type Note } from "@/lib/mock-data";
import { renderMarkdown } from "@/lib/markdown";
import { FileText, Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const [items, setItems] = useState<Note[]>(seed);
  const [activeId, setActiveId] = useState<string>(seed[0].id);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);

  const active = items.find((n) => n.id === activeId)!;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, query]);

  const updateBody = (body: string) => {
    setItems((all) =>
      all.map((n) =>
        n.id === activeId ? { ...n, body, updated: new Date().toISOString() } : n
      )
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Notes."
        subtitle="Markdown. Everything Anchor watches connects back here."
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="bg-neutral-950/60 p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-neutral-900 bg-black/40 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-neutral-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              className="flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>
          <ul className="space-y-1">
            {filtered.map((n) => {
              const course = courseById(n.courseId);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setActiveId(n.id)}
                    className={cn(
                      "block w-full rounded-lg px-2 py-2 text-left transition-colors",
                      n.id === activeId
                        ? "bg-cyan-400/10 text-cyan-100"
                        : "text-neutral-300 hover:bg-neutral-900"
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                      <span className="truncate">{n.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                      {course && (
                        <span style={{ color: course.color }}>
                          {course.code}
                        </span>
                      )}
                      <span>
                        {new Date(n.updated).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="flex min-h-[520px] flex-col bg-neutral-950/60">
          <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-2">
            <div>
              <input
                value={active.title}
                onChange={(e) =>
                  setItems((all) =>
                    all.map((n) =>
                      n.id === activeId ? { ...n, title: e.target.value } : n
                    )
                  )
                }
                className="bg-transparent text-sm font-medium text-neutral-100 focus:outline-none"
              />
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-500">
                {active.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1">
                    <Tag className="h-2.5 w-2.5" /> {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setPreview(false)}
                className={cn(
                  "rounded-full border px-3 py-1",
                  !preview
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                    : "border-neutral-800 text-neutral-400"
                )}
              >
                Edit
              </button>
              <button
                onClick={() => setPreview(true)}
                className={cn(
                  "rounded-full border px-3 py-1",
                  preview
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                    : "border-neutral-800 text-neutral-400"
                )}
              >
                Preview
              </button>
            </div>
          </div>
          {preview ? (
            <div
              className="flex-1 overflow-y-auto p-6"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(active.body) }}
            />
          ) : (
            <textarea
              value={active.body}
              onChange={(e) => updateBody(e.target.value)}
              className="flex-1 resize-none bg-transparent p-6 font-mono text-sm text-neutral-100 focus:outline-none"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
