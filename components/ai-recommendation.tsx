"use client";

import { useCallback, useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  systemPrompt: string;
  context: string;
  title?: string;
  autoRun?: boolean;
}

export function AIRecommendation({ systemPrompt, context, title = "AI recommendation", autoRun = false }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: context },
          ],
        }),
      });
      const data = await res.json();
      setText(data?.reply ?? "");
    } finally {
      setLoading(false);
    }
  }, [systemPrompt, context]);

  return (
    <Card className="border-cyan-400/20 bg-cyan-400/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-cyan-100">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          {title}
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-200 hover:border-cyan-400/60 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {text ? "regenerate" : "generate"}
        </button>
      </div>
      {text ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-cyan-50/90">{text}</p>
      ) : (
        <p className="text-xs text-cyan-100/70">
          Anchor can turn this into a personalized recommendation.
        </p>
      )}
    </Card>
  );
}
