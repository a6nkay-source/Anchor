"use client";

import { useEffect, useRef } from "react";
import { useSignals } from "@/components/signals-store";
import { useMonitor } from "@/components/wellness-monitor";
import { useFocus } from "@/components/focus-mode";
import { assignments, courseById } from "@/lib/mock-data";
import { speak } from "@/lib/speech";

const CADENCE_MS = 30_000;

// Anchor's personality — one shared voice across every touchpoint.
const PERSONA = `You are Anchor — the student's calm study buddy. Voice traits:
- Warm, supportive, encouraging, professional. Never annoying, never scolding, never dramatic.
- Motivating without being loud. Say less to say more.
- Vary phrasing every time. Do NOT reuse language from your recent lines (a list is provided).
- Never mention that you are an AI, model, or bot. Never say "I noticed" more than once per session.
- No emojis. No exclamation marks. No lists.
- Max one short sentence, under 18 words. When steady, offer a small grounding note; don't invent problems.`;

export function NudgeAgent() {
  const { state, wellnessScore, wellnessLabel, metrics, addNudge, rememberCoachLine } = useSignals();
  const { phase: camPhase } = useMonitor();
  const { active: focusActive, remainingSec, distractionAttempts } = useFocus();
  const lastAt = useRef<number>(0);
  const inFlight = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("anchor.settings.v1");
      if (raw) {
        const s = JSON.parse(raw);
        mutedRef.current = s?.notifications === false;
      }
    } catch {}
  }, []);

  useEffect(() => {
    const tick = async () => {
      if (inFlight.current) return;
      if (Date.now() - lastAt.current < CADENCE_MS) return;

      const v = state.vision;
      const t = state.typing;
      const anyActive = v.active || t.active || focusActive || camPhase === "running";
      if (!anyActive) return;

      inFlight.current = true;

      const currentAssignment = assignments
        .filter((a) => a.status !== "done")
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0];
      const currentCourse = currentAssignment && courseById(currentAssignment.courseId);

      const observations: string[] = [];
      if (v.active) {
        if (v.postureScore < 55) observations.push("posture slipping forward");
        else if (v.postureScore > 80) observations.push("posture strong");
        if (v.jawTension > 0.55) observations.push("jaw tight");
        if (v.browTension > 0.55) observations.push("brow furrowed");
        if (v.blinkRate < 6) observations.push("very few blinks");
        if (v.gazeCentered < 0.4) observations.push("gaze drifting");
      }
      if (t.active) {
        if (t.backspaceRatio > 0.28) observations.push("lots of deleting");
        if (t.cadenceVariance > 0.6) observations.push("choppy rhythm");
        if (t.hesitationScore < 55) observations.push("many hesitations");
        if (t.wpm > 50) observations.push("steady flow");
      }
      if (focusActive) observations.push(`in focus, ${Math.floor(remainingSec / 60)}m left`);
      if (distractionAttempts > 0)
        observations.push(`${distractionAttempts} distractions this block`);

      const summary = observations.length ? observations.join("; ") : "everything looks steady";
      const flowState = metrics.focus > 75 && metrics.stress < 45;

      const recent = state.recentCoachLines.slice(0, 8);
      const context = [
        `Wellness ${wellnessScore}/100 (${wellnessLabel}).`,
        `Focus ${Math.round(metrics.focus)}, stress ${Math.round(metrics.stress)}, fatigue ${Math.round(metrics.fatigue)}.`,
        `Signals: ${summary}.`,
        flowState ? "The student appears to be in flow — do not interrupt momentum, just say something small and confidence-building." : "",
        currentAssignment
          ? `Current task: "${currentAssignment.title}" (${currentCourse?.code ?? "—"}).`
          : "",
        recent.length ? `Your recent lines (DO NOT REPEAT phrasing or advice): ${recent.map((s) => `"${s}"`).join(" | ")}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: PERSONA },
              { role: "user", content: context },
            ],
          }),
        });
        const data = await res.json();
        const text = (data?.reply ?? "").toString().trim();
        if (text) {
          addNudge({ source: focusActive ? "system" : "coach", text });
          rememberCoachLine(text);
          if (!mutedRef.current) speak(text);
          lastAt.current = Date.now();
        }
      } catch {
      } finally {
        inFlight.current = false;
      }
    };

    const kickoff = setTimeout(tick, 5_000);
    const id = setInterval(tick, 3_000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, [
    state.vision,
    state.typing,
    state.recentCoachLines,
    wellnessScore,
    wellnessLabel,
    metrics,
    focusActive,
    remainingSec,
    distractionAttempts,
    camPhase,
    addNudge,
    rememberCoachLine,
  ]);

  return null;
}
