"use client";

import { useEffect } from "react";
import { useSignals } from "@/components/signals-store";

// Shifts a handful of CSS variables based on how the student is doing.
// - Under stress, background gradients get calmer (violet-teal) and animations slow.
// - In flow, accent brightens.
export function DynamicTheme() {
  const { metrics } = useSignals();

  useEffect(() => {
    const root = document.documentElement.style;
    const stress = metrics.stress;
    const focus = metrics.focus;
    const flow = focus > 75 && stress < 45;
    const heavy = stress > 65 || metrics.fatigue > 65;

    if (heavy) {
      root.setProperty("--anchor-accent", "265 80% 65%"); // violet
      root.setProperty("--anchor-accent-alt", "175 60% 55%"); // teal
      root.setProperty("--anchor-anim-scale", "1.6");
    } else if (flow) {
      root.setProperty("--anchor-accent", "188 100% 62%");
      root.setProperty("--anchor-accent-alt", "160 85% 60%");
      root.setProperty("--anchor-anim-scale", "0.85");
    } else {
      root.setProperty("--anchor-accent", "188 90% 55%");
      root.setProperty("--anchor-accent-alt", "160 80% 55%");
      root.setProperty("--anchor-anim-scale", "1");
    }
  }, [metrics.stress, metrics.focus, metrics.fatigue]);

  return null;
}
