"use client";

import { useEffect, useRef } from "react";
import { useSignals, type WellnessEventKind } from "@/components/signals-store";
import { useFocus } from "@/components/focus-mode";
import { useMonitor } from "@/components/wellness-monitor";

// Minimum cooldown between events of the same kind so we don't spam.
const COOLDOWN_MS: Record<WellnessEventKind, number> = {
  "poor-posture": 5 * 60_000,
  "eye-strain": 6 * 60_000,
  "low-blink-rate": 6 * 60_000,
  "mental-fatigue": 8 * 60_000,
  "high-stress": 6 * 60_000,
  "long-sitting": 45 * 60_000,
  "excessive-distractions": 5 * 60_000,
  "left-focus": 2 * 60_000,
  "low-productivity": 8 * 60_000,
  "no-breaks": 30 * 60_000,
};

const MESSAGES: Record<WellnessEventKind, string> = {
  "poor-posture": "Your shoulders have crept forward. Sit back into the chair.",
  "eye-strain": "Very few blinks lately — look at something 20 feet away for 20 seconds.",
  "low-blink-rate": "Your eyes are working hard. Blink slowly a few times.",
  "mental-fatigue": "You're pushing through fog. A short walk would help.",
  "high-stress": "Jaw tight, brow tense. A slow breath in through the nose.",
  "long-sitting": "You've been in the chair a while. Stand and stretch for a minute.",
  "excessive-distractions": "A lot of small pulls. Close the tabs you don't need.",
  "left-focus": "You stepped out. Come back whenever you're ready.",
  "low-productivity": "Momentum is slow. Pick the smallest possible next step.",
  "no-breaks": "You haven't taken a break in a while — even four minutes would help.",
};

const SEVERITY: Record<WellnessEventKind, "gentle" | "notable" | "urgent"> = {
  "poor-posture": "gentle",
  "eye-strain": "notable",
  "low-blink-rate": "gentle",
  "mental-fatigue": "notable",
  "high-stress": "notable",
  "long-sitting": "notable",
  "excessive-distractions": "notable",
  "left-focus": "gentle",
  "low-productivity": "gentle",
  "no-breaks": "notable",
};

export function EventDetector() {
  const { state, metrics, fireEvent } = useSignals();
  const { active: focusActive, startedAt, distractionAttempts } = useFocus();
  const { phase: camPhase } = useMonitor();
  const lastFiredRef = useRef<Record<string, number>>({});
  const noBreaksSinceRef = useRef<number>(0);

  const fireOnce = (kind: WellnessEventKind) => {
    const now = Date.now();
    const last = lastFiredRef.current[kind] ?? 0;
    if (now - last < COOLDOWN_MS[kind]) return;
    lastFiredRef.current[kind] = now;
    fireEvent({
      kind,
      severity: SEVERITY[kind],
      message: MESSAGES[kind],
    });
  };

  useEffect(() => {
    // Track break freshness — reset whenever focus mode starts or ends
    if (!focusActive) noBreaksSinceRef.current = Date.now();
    else if (noBreaksSinceRef.current === 0) noBreaksSinceRef.current = Date.now();
  }, [focusActive]);

  useEffect(() => {
    const tick = () => {
      const v = state.vision;
      const t = state.typing;

      // Vision-driven
      if (v.active && v.faceDetected) {
        if (v.postureScore < 50) fireOnce("poor-posture");
        if (v.blinkRate > 0 && v.blinkRate < 6) fireOnce("low-blink-rate");
        if (metrics.eyeStrain > 65) fireOnce("eye-strain");
      }

      // Composite state
      if (metrics.fatigue > 70) fireOnce("mental-fatigue");
      if (metrics.stress > 70) fireOnce("high-stress");
      if (t.active && metrics.productivity < 40 && t.wpm < 20) fireOnce("low-productivity");

      // Focus-driven
      if (focusActive) {
        if (distractionAttempts >= 3) fireOnce("excessive-distractions");
        if (startedAt && Date.now() - startedAt > 45 * 60_000) fireOnce("long-sitting");
        if (Date.now() - noBreaksSinceRef.current > 55 * 60_000) fireOnce("no-breaks");
      }
    };

    // no need to run more often than every 6 seconds — cooldowns gate the rest
    const id = setInterval(tick, 6_000);
    return () => clearInterval(id);
  }, [
    state.vision,
    state.typing,
    metrics.fatigue,
    metrics.stress,
    metrics.productivity,
    metrics.eyeStrain,
    focusActive,
    startedAt,
    distractionAttempts,
    camPhase,
  ]);

  // Detect focus mode exit
  const prevFocusActive = useRef(focusActive);
  useEffect(() => {
    if (prevFocusActive.current && !focusActive) {
      const now = Date.now();
      const last = lastFiredRef.current["left-focus"] ?? 0;
      if (now - last >= COOLDOWN_MS["left-focus"]) {
        lastFiredRef.current["left-focus"] = now;
        fireEvent({
          kind: "left-focus",
          severity: "gentle",
          message: "You left Focus Mode. I'll be here when you're ready to come back.",
        });
      }
    }
    prevFocusActive.current = focusActive;
  }, [focusActive, fireEvent]);

  return null;
}
