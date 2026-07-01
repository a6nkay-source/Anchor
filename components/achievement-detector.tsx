"use client";

import { useEffect, useRef } from "react";
import { useSignals } from "@/components/signals-store";
import { useFocus } from "@/components/focus-mode";
import { speak } from "@/lib/speech";

// Simple milestone tracking. Writes to the store when a first-time condition holds.
// Persisted via localStorage under anchor.achievements.awarded.

const STORAGE = "anchor.achievements.awarded";

function loadAwarded(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAwarded(m: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(m));
  } catch {}
}

export function AchievementDetector() {
  const { state, metrics, awardAchievement, addNudge } = useSignals();
  const { active: focusActive, startedAt, remainingSec, minutes } = useFocus();
  const awardedRef = useRef<Record<string, number>>({});
  const flowStartRef = useRef<number | null>(null);
  const bestPostureRef = useRef(0);
  const longestBlockRef = useRef(0);

  useEffect(() => {
    awardedRef.current = loadAwarded();
  }, []);

  const grant = (id: string, label: string, detail: string, emoji?: string) => {
    if (awardedRef.current[id]) return;
    awardedRef.current[id] = Date.now();
    saveAwarded(awardedRef.current);
    awardAchievement({ label, detail, emoji });
    const line = `New badge — ${label}.`;
    addNudge({ source: "system", text: `${label}: ${detail}` });
    speak(line);
  };

  // First flow state — sustained 20+ seconds of focus > 75 and stress < 45
  useEffect(() => {
    const flow = metrics.focus > 75 && metrics.stress < 45;
    if (flow) {
      if (!flowStartRef.current) flowStartRef.current = Date.now();
      if (Date.now() - (flowStartRef.current ?? Date.now()) > 20_000) {
        grant("first-flow", "First flow state", "You held sustained focus with low stress.", "✦");
      }
    } else {
      flowStartRef.current = null;
    }
  }, [metrics.focus, metrics.stress]);

  // Highest wellness score
  useEffect(() => {
    if (metrics.wellness >= 90) {
      grant("wellness-90", "Highest wellness score", "You crossed 90/100 today.", "★");
    }
  }, [metrics.wellness]);

  // Best posture session — sustained posture > 90 for a minute
  const postureStartRef = useRef<number | null>(null);
  useEffect(() => {
    if (!state.vision.active) return;
    if (state.vision.postureScore > 90) {
      if (!postureStartRef.current) postureStartRef.current = Date.now();
      if (Date.now() - (postureStartRef.current ?? Date.now()) > 60_000) {
        grant("best-posture", "Best posture session", "One minute of near-perfect posture.", "◈");
      }
      bestPostureRef.current = Math.max(bestPostureRef.current, state.vision.postureScore);
    } else {
      postureStartRef.current = null;
    }
  }, [state.vision.postureScore, state.vision.active]);

  // Focus session milestones
  useEffect(() => {
    if (focusActive && startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt) / 60_000);
      if (elapsed >= 25) grant("focus-25", "First 25-min focus block", "You held Pomodoro clean.", "◉");
      if (elapsed >= 50) grant("focus-50", "Deep block", "Fifty focused minutes.", "◉");
      if (elapsed > longestBlockRef.current) longestBlockRef.current = elapsed;
      if (elapsed >= 90) grant("focus-90", "Long dive", "Ninety minutes of focus.", "◉");
    }
  }, [focusActive, startedAt, remainingSec]);

  // Assignment streak — 3+ done today (mock)
  useEffect(() => {
    // static from mock data — grants once
    if (state.history.length > 20) {
      grant("weekly-goal", "Weekly study goal completed", "24 study hours logged this week.", "▲");
    }
  }, [state.history.length]);

  // Longest focus session — after focus ends
  const prevActiveRef = useRef(focusActive);
  useEffect(() => {
    if (prevActiveRef.current && !focusActive) {
      if (longestBlockRef.current >= 45) {
        grant("longest-focus", "Longest focus session", `${longestBlockRef.current} focused minutes.`, "◈");
      }
    }
    prevActiveRef.current = focusActive;
  }, [focusActive]);

  return null;
}
