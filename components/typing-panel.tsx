"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { SignalBar } from "@/components/signal-bar";
import { useSignals } from "@/components/signals-store";

const PROMPTS = [
  "the sea was calm that morning and nothing hurried",
  "type whatever is on your mind — no one is grading this",
  "one steady breath in, one long slow breath out",
  "the fog lifted slowly, and the road became clear",
];

export function TypingPanel() {
  const { state, updateTyping, resetTyping } = useSignals();
  const [text, setText] = useState("");
  const [placeholder, setPlaceholder] = useState<string>(PROMPTS[0]);

  useEffect(() => {
    setPlaceholder(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  const intervalsRef = useRef<number[]>([]); // ms between keys
  const lastKeyRef = useRef<number>(0);
  const totalKeysRef = useRef(0);
  const backspaceKeysRef = useRef(0);
  const startedAtRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => () => resetTyping(), [resetTyping]);

  // A slow tick that recomputes stats even if the user pauses.
  useEffect(() => {
    const id = setInterval(() => {
      if (!activeRef.current) return;
      recompute();
    }, 900);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recompute = () => {
    const now = performance.now();
    const elapsedMin = Math.max(1 / 60, (now - startedAtRef.current) / 60000);
    const chars = totalKeysRef.current;
    const wpm = Math.min(200, chars / 5 / elapsedMin);
    const backspaceRatio =
      totalKeysRef.current > 0
        ? backspaceKeysRef.current / totalKeysRef.current
        : 0;

    // Cadence variance: normalized stddev of last N intervals
    const intervals = intervalsRef.current.slice(-30);
    let variance = 0;
    let hesitationScore = 100;
    if (intervals.length > 5) {
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const sd = Math.sqrt(
        intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length
      );
      variance = clamp01(sd / 400);
      // heavy hesitations (>800ms) count against the calm score
      const longPauses = intervals.filter((i) => i > 800).length;
      hesitationScore = Math.max(
        0,
        100 - variance * 55 - (longPauses / intervals.length) * 80
      );
    }

    updateTyping({
      active: true,
      wpm,
      backspaceRatio,
      cadenceVariance: variance,
      hesitationScore,
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Meta" || e.key === "Control" || e.key === "Shift" || e.key === "Alt")
      return;
    if (!activeRef.current) {
      activeRef.current = true;
      startedAtRef.current = performance.now();
      lastKeyRef.current = performance.now();
      updateTyping({ active: true });
      return;
    }
    const now = performance.now();
    const dt = now - lastKeyRef.current;
    if (dt > 20 && dt < 5000) intervalsRef.current.push(dt);
    lastKeyRef.current = now;
    totalKeysRef.current += 1;
    if (e.key === "Backspace") backspaceKeysRef.current += 1;
    recompute();
  };

  const clear = () => {
    setText("");
    intervalsRef.current = [];
    totalKeysRef.current = 0;
    backspaceKeysRef.current = 0;
    startedAtRef.current = 0;
    lastKeyRef.current = 0;
    activeRef.current = false;
    resetTyping();
  };

  const t = state.typing;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Typing</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
            Live keystroke rhythm.
          </h1>
        </div>
        <button
          onClick={clear}
          className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500"
        >
          Reset
        </button>
      </div>

      <Card className="bg-neutral-950/60 p-6">
        <label className="mb-3 block text-xs uppercase tracking-[0.18em] text-neutral-500">
          Type here — pretend you&apos;re working
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={7}
          className="w-full resize-none rounded-lg border border-neutral-900 bg-black/50 p-4 font-mono text-sm text-neutral-100 placeholder:text-neutral-700 focus:border-cyan-400/40 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span>{text.length} chars</span>
          <span>
            {t.active ? "measuring" : "waiting for the first key"}
          </span>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-neutral-950/60 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-100">Rhythm</h3>
          <div className="space-y-5">
            <SignalBar
              label="Speed"
              value={Math.min(100, Math.round((t.wpm / 90) * 100))}
              hint={`${t.wpm.toFixed(0)} wpm`}
            />
            <SignalBar
              label="Steadiness"
              value={Math.round(t.hesitationScore)}
              hint={
                t.hesitationScore > 75
                  ? "Even flow."
                  : t.hesitationScore > 55
                  ? "Some pauses."
                  : "A lot of hesitation."
              }
            />
            <SignalBar
              label="Cadence variance"
              value={100 - Math.round(t.cadenceVariance * 100)}
              hint={
                t.cadenceVariance < 0.35
                  ? "Smooth."
                  : t.cadenceVariance < 0.6
                  ? "A little choppy."
                  : "Very uneven."
              }
            />
          </div>
        </Card>

        <Card className="bg-neutral-950/60 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-100">Corrections</h3>
          <div className="space-y-5">
            <SignalBar
              label="Backspace ratio"
              value={100 - Math.min(100, Math.round(t.backspaceRatio * 100 * 2.5))}
              hint={`${(t.backspaceRatio * 100).toFixed(0)}% of keys are deletions`}
            />
            <div className="text-xs text-neutral-500">
              <p className="mb-2 text-neutral-300">What Anchor watches:</p>
              <ul className="space-y-1.5 leading-relaxed">
                <li>· Bursts of backspaces (frustration).</li>
                <li>· Long gaps between keys (hesitation).</li>
                <li>· Choppy rhythm shifts (racing thoughts).</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
