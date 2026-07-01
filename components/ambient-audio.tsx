"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// A soft, generative ambient pad built with Web Audio.
// Two detuned oscillators + slow LFOs + a lowpass filter. No assets required.
export function AmbientAudio({ autostart = false }: { autostart?: boolean }) {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ master?: GainNode }>({});

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autostart) {
      const kick = () => {
        start();
        window.removeEventListener("pointerdown", kick);
        window.removeEventListener("keydown", kick);
      };
      window.addEventListener("pointerdown", kick, { once: true });
      window.addEventListener("keydown", kick, { once: true });
      return () => {
        window.removeEventListener("pointerdown", kick);
        window.removeEventListener("keydown", kick);
      };
    }
  }, [autostart]);

  const start = () => {
    if (typeof window === "undefined") return;
    if (ctxRef.current) {
      ctxRef.current.resume();
      setOn(true);
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    nodesRef.current.master = master;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    filter.connect(master);

    // three notes forming a soft chord (A minor-ish)
    const notes = [220, 261.63, 329.63];
    notes.forEach((freq, i) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 1.005; // subtle detune

      const g = ctx.createGain();
      g.gain.value = 0.08 - i * 0.015;

      // slow LFO on gain for breathing effect
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.08 + i * 0.03;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);

      osc1.connect(g);
      osc2.connect(g);
      g.connect(filter);
      osc1.start();
      osc2.start();
      lfo.start();
    });

    // slow filter sweep
    const filterLfo = ctx.createOscillator();
    filterLfo.type = "sine";
    filterLfo.frequency.value = 0.05;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 400;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    filterLfo.start();

    // fade in
    const t = ctx.currentTime;
    master.gain.setValueAtTime(0, t);
    master.gain.linearRampToValueAtTime(0.35, t + 3.5);
    setOn(true);
  };

  const stop = () => {
    const ctx = ctxRef.current;
    if (!ctx || !nodesRef.current.master) {
      setOn(false);
      return;
    }
    const t = ctx.currentTime;
    nodesRef.current.master.gain.cancelScheduledValues(t);
    nodesRef.current.master.gain.setValueAtTime(
      nodesRef.current.master.gain.value,
      t
    );
    nodesRef.current.master.gain.linearRampToValueAtTime(0, t + 0.8);
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
      ctxRef.current = null;
      nodesRef.current = {};
    }, 900);
    setOn(false);
  };

  return (
    <button
      onClick={() => (on ? stop() : start())}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-black/40 px-3 py-1.5 text-xs text-neutral-300 backdrop-blur hover:border-cyan-400/40"
      aria-label={on ? "Mute ambient" : "Play ambient"}
    >
      {on ? <Volume2 className="h-3.5 w-3.5 text-cyan-300" /> : <VolumeX className="h-3.5 w-3.5" />}
      {on ? "ambient on" : "ambient off"}
    </button>
  );
}
