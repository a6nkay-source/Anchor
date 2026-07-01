"use client";

import { useEffect, useRef } from "react";
import { useSignals } from "@/components/signals-store";
import { useMonitor } from "@/components/wellness-monitor";
import { useFocus } from "@/components/focus-mode";
import { assignments, courseById } from "@/lib/mock-data";
import { speak } from "@/lib/speech";

// Guaranteed 30-second cadence coach. Every 30 seconds Anchor speaks one
// short line based on live signals. When things look steady it says
// something calm; when something drifts it names it and offers a small cue.
const CADENCE_MS = 30_000;

export function NudgeAgent() {
  const { state, wellnessScore, wellnessLabel, metrics, addNudge } = useSignals();
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

      // Only run when at least one signal source is active — no point
      // speaking if the app has no signals to reason about.
      const anyActive = v.active || t.active || focusActive || camPhase === "running";
      if (!anyActive) return;

      inFlight.current = true;

      const currentAssignment = assignments
        .filter((a) => a.status !== "done")
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0];
      const currentCourse = currentAssignment && courseById(currentAssignment.courseId);

      // Build a concise observation summary the model can react to.
      const observations: string[] = [];
      if (v.active) {
        if (v.postureScore < 55) observations.push("posture slipping forward");
        else if (v.postureScore > 80) observations.push("posture strong");
        if (v.jawTension > 0.55) observations.push("jaw tight");
        if (v.browTension > 0.55) observations.push("brow furrowed");
        if (v.blinkRate < 6) observations.push("very few blinks — likely locked in");
        else if (v.blinkRate > 22) observations.push("blinking a lot — restless");
        if (v.gazeCentered < 0.4) observations.push("gaze drifting from screen");
      }
      if (t.active) {
        if (t.backspaceRatio > 0.28) observations.push("lots of deleting");
        if (t.cadenceVariance > 0.6) observations.push("choppy typing rhythm");
        if (t.hesitationScore < 55) observations.push("many hesitations");
        if (t.wpm > 50) observations.push("steady flow");
      }
      if (focusActive) observations.push(`in focus block, ${Math.floor(remainingSec / 60)} min left`);
      if (distractionAttempts > 0)
        observations.push(`${distractionAttempts} distraction attempts this block`);

      const summary =
        observations.length > 0 ? observations.join("; ") : "everything looks steady";

      const context = [
        `Wellness ${wellnessScore}/100 (${wellnessLabel}).`,
        `Focus ${Math.round(metrics.focus)}, stress ${Math.round(metrics.stress)}, fatigue ${Math.round(metrics.fatigue)}.`,
        `Signals: ${summary}.`,
        currentAssignment
          ? `Current task: "${currentAssignment.title}" (${currentCourse?.code ?? "—"}).`
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are Anchor, the student's quiet coach. Every 30 seconds you speak ONE short warm sentence — max 18 words. Warm and concrete. If signals look steady, say something grounding or affirming; do NOT invent problems. Never lecture. No lists. No emojis. No 'as an AI'. Vary your language across turns.",
              },
              { role: "user", content: context },
            ],
          }),
        });
        const data = await res.json();
        const text = (data?.reply ?? "").toString().trim();
        if (text) {
          addNudge({ source: focusActive ? "system" : "coach", text });
          if (!mutedRef.current) speak(text);
          lastAt.current = Date.now();
        }
      } catch {
        /* silent — try again next tick */
      } finally {
        inFlight.current = false;
      }
    };

    // Fire once shortly after arming, then every 30s.
    const kickoff = setTimeout(tick, 5_000);
    const id = setInterval(tick, 3_000); // check often, gate by lastAt

    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, [
    state.vision,
    state.typing,
    wellnessScore,
    wellnessLabel,
    metrics,
    focusActive,
    remainingSec,
    distractionAttempts,
    camPhase,
    addNudge,
  ]);

  return null;
}
