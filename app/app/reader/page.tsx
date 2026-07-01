"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Upload, FileText, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Doc {
  name: string;
  url: string;
  size: number;
}

const SAMPLES: Doc[] = [
  {
    name: "Anchor sample handout — attention.pdf",
    url: "https://arxiv.org/pdf/1706.03762.pdf",
    size: 570000,
  },
];

export default function PDFReaderPage() {
  const [docs, setDocs] = useState<Doc[]>(SAMPLES);
  const [active, setActive] = useState<Doc>(SAMPLES[0]);
  const [notes, setNotes] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => docs.forEach((d) => d.url.startsWith("blob:") && URL.revokeObjectURL(d.url)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const upload = (file: File) => {
    const url = URL.createObjectURL(file);
    const d: Doc = { name: file.name, url, size: file.size };
    setDocs((x) => [d, ...x]);
    setActive(d);
    setNotes("");
  };

  const summarize = async () => {
    setSummarizing(true);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Anchor's reading assistant. The student is reading a PDF titled below. Offer 3 short bullet prompts that would help them read it actively. Under 40 words total.",
            },
            { role: "user", content: `PDF title: "${active.name}"` },
          ],
        }),
      });
      const data = await res.json();
      setNotes((n) => (n ? `${n}\n\n` : "") + (data?.reply ?? ""));
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="PDF Reader."
        subtitle="Open any PDF, take side notes, and let Anchor prompt you into reading actively."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 hover:border-cyan-400/60"
            >
              <Upload className="h-3.5 w-3.5" /> Upload PDF
            </button>
            <input
              type="file"
              accept="application/pdf"
              ref={inputRef}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              className="hidden"
            />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[220px_1fr_260px]">
        <Card className="bg-neutral-950/60 p-2">
          <ul className="space-y-1">
            {docs.map((d) => (
              <li key={d.url}>
                <button
                  onClick={() => {
                    setActive(d);
                    setNotes("");
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left",
                    active.url === d.url
                      ? "bg-cyan-400/10 text-cyan-100"
                      : "text-neutral-300 hover:bg-neutral-900"
                  )}
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-500" />
                  <div className="min-w-0">
                    <p className="truncate text-xs">{d.name}</p>
                    <p className="text-[10px] text-neutral-500">
                      {(d.size / 1024).toFixed(0)} kB
                    </p>
                  </div>
                  {d.url.startsWith("blob:") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocs((x) => x.filter((y) => y.url !== d.url));
                        if (active.url === d.url) setActive(SAMPLES[0]);
                        URL.revokeObjectURL(d.url);
                      }}
                      className="ml-auto rounded p-0.5 text-neutral-500 hover:bg-neutral-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden bg-black p-0">
          <iframe
            src={active.url}
            title={active.name}
            className="h-[720px] w-full"
          />
        </Card>

        <Card className="flex flex-col bg-neutral-950/60 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-neutral-300">Side notes</span>
            <button
              onClick={summarize}
              disabled={summarizing}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-200 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" /> Prompt me
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot as you read…"
            className="min-h-[600px] flex-1 resize-none rounded-lg border border-neutral-900 bg-black/40 p-3 font-mono text-xs text-neutral-100 focus:outline-none"
          />
        </Card>
      </div>
    </div>
  );
}
