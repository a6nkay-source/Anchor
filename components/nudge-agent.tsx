"use client";

import { useEffect, useRef } from "react";
import { useSignals } from "@/components/signals-store";

// Every N seconds, look at the shared signal state and, if something
// crossed a soft threshold, ask the model for one calming line and
// speak it. The line also lands in the Signals feed.
const NUDGE_INTERVAL_MS = 22_000;

export function NudgeAgent() {
  const { state, wellnessScore, addNudge } = useSignals();
  const lastNudgeAt = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const id = setInterval(async () => {
      const now = Date.now();
      if (now - lastNudgeAt.current < NUDGE_INTERVAL_MS) return;
      if (inFlight.current) return;
      if (!state.vision.active && !state.typing.active) return;

      const observations: string[] = [];
      const v = state.vision;
      const t = state.typing;

      if (v.active) {
        if (v.postureScore < 55)
          observations.push("The user's posture has slipped forward.");
        if (v.jawTension > 0.55)
          observations.push("Their jaw is looking tight.");
        if (v.browTension > 0.55)
          observations.push("Their brow is furrowed.");
        if (v.blinkRate < 6)
          observations.push("They haven't blinked in a while — likely locked in on the screen.");
        if (v.gazeCentered < 0.4)
          observations.push("Their gaze keeps drifting away from center.");
      }

      if (t.active) {
        if (t.backspaceRatio > 0.28)
          observations.push("They're deleting a lot — feels frustrated.");
        if (t.cadenceVariance > 0.6)
          observations.push("Their typing rhythm is choppy.");
        if (t.hesitationScore < 55)
          observations.push("They're hesitating a lot between keys.");
      }

      if (observations.length === 0) {
        return; // nothing to say
      }

      const source = v.active ? "vision" : "typing";
      const prompt = `You are Anchor, quietly watching over the user. Here's what you just noticed:\n- ${observations.join(
        "\n- "
      )}\nCurrent wellness score: ${wellnessScore}/100.\n\nSay ONE short sentence to them, warm and gentle, offering ONE tiny grounding thing. Max 18 words. No emojis. No lecturing. No lists.`;

      inFlight.current = true;
      try {
        const res = await fetch("/api/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const data = await res.json();
        const text = (data?.reply ?? "").toString().trim();
        if (text) {
          addNudge({ source, text });
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
              const u = new SpeechSynthesisUtterance(text);
              u.rate = 0.92;
              u.pitch = 1;
              window.speechSynthesis.speak(u);
            } catch {}
          }
          lastNudgeAt.current = Date.now();
        }
      } catch {
        /* silent */
      } finally {
        inFlight.current = false;
      }
    }, 4_000);

    return () => clearInterval(id);
  }, [state, wellnessScore, addNudge]);

  return null;
}
