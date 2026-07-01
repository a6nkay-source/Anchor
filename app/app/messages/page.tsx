"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { threads as seed, type Thread, type Message } from "@/lib/mock-data";
import { Send, Sparkles, Users, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>(seed);
  const [activeId, setActiveId] = useState<string>(seed[1].id);
  const [draft, setDraft] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const active = threads.find((t) => t.id === activeId)!;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const msg: Message = {
      id: Math.random().toString(36).slice(2),
      from: "You",
      body: text,
      ts: new Date().toISOString(),
      self: true,
    };
    setThreads((all) =>
      all.map((t) =>
        t.id === activeId
          ? {
              ...t,
              messages: [...t.messages, msg],
              lastPreview: text,
              unread: 0,
            }
          : t
      )
    );
    setDraft("");
  };

  const summarize = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      const transcript = active.messages
        .map((m) => `${m.from}: ${m.body}`)
        .join("\n");
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Anchor. In 2 short sentences, summarize this conversation for the student. No lists.",
            },
            { role: "user", content: transcript },
          ],
        }),
      });
      const data = await res.json();
      setSummary(data?.reply ?? "Couldn't summarize this thread.");
    } catch {
      setSummary("Couldn't reach the model.");
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Messages."
        subtitle="Classmates and study groups. Ask Anchor to condense any thread."
        actions={
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs text-neutral-300 hover:border-cyan-400/40 hover:text-cyan-200"
          >
            <Users className="h-3.5 w-3.5" /> New group
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="bg-neutral-950/60 p-2">
          <ul className="space-y-1">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => {
                    setActiveId(t.id);
                    setSummary(null);
                    setThreads((all) =>
                      all.map((x) =>
                        x.id === t.id ? { ...x, unread: 0 } : x
                      )
                    );
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                    t.id === activeId
                      ? "bg-cyan-400/10"
                      : "hover:bg-neutral-900"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                      t.kind === "group"
                        ? "bg-violet-400/20 text-violet-100"
                        : "bg-cyan-400/20 text-cyan-100"
                    )}
                  >
                    {t.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-neutral-100">
                        {t.name}
                      </span>
                      {t.unread > 0 && (
                        <span className="rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-medium text-neutral-950">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      {t.lastPreview}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex min-h-[560px] flex-col bg-neutral-950/60">
          <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-100">{active.name}</p>
              <p className="text-xs text-neutral-500">
                {active.kind === "group"
                  ? active.members?.join(" · ")
                  : "direct message"}
              </p>
            </div>
            <button
              onClick={summarize}
              disabled={summarizing}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 hover:border-cyan-400/60 disabled:opacity-50"
            >
              {summarizing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Summarize
            </button>
          </div>

          {summary && (
            <div className="mx-4 mt-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100">
              <span className="mr-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300/70">
                anchor summary
              </span>
              {summary}
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[72%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.self
                    ? "ml-auto bg-cyan-400/15 text-cyan-100"
                    : "bg-neutral-900/80 text-neutral-100"
                )}
              >
                {!m.self && (
                  <div className="mb-0.5 text-[10px] text-neutral-500">
                    {m.from}
                  </div>
                )}
                {m.body}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-neutral-900 p-3"
          >
            <button
              type="button"
              className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-100"
              aria-label="Attach"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something…"
              className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-cyan-400 p-2 text-neutral-950 disabled:opacity-30"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
