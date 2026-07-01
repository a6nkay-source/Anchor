"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSignals } from "@/components/signals-store";
import { cn } from "@/lib/utils";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Every preset is a procedural Web Audio recipe. Zero assets.
export type Preset =
  | "deep-focus"
  | "lofi"
  | "classical"
  | "piano"
  | "nature"
  | "rain"
  | "cafe"
  | "white-noise"
  | "brown-noise"
  | "meditation";

interface PresetSpec {
  id: Preset;
  label: string;
  hint: string;
  calmness: number; // 0-100, higher = calmer, used for adaptive switching
  build: (ctx: AudioContext, master: GainNode) => () => void; // returns disposer
}

// ─── Helpers ───────────────────────────────────────────────────────────

function makeNoise(ctx: AudioContext, kind: "white" | "pink" | "brown"): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "white") {
      data[i] = white * 0.5;
    } else if (kind === "pink") {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    } else {
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function makeDrone(
  ctx: AudioContext,
  freqs: number[],
  types: OscillatorType[],
  filterHz: number,
  gain: number,
  master: GainNode,
): () => void {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterHz;
  filter.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.value = gain;
  filter.connect(g);
  g.connect(master);

  const oscs: OscillatorNode[] = [];
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = types[i] ?? "sine";
    o.frequency.value = f;
    const og = ctx.createGain();
    og.gain.value = 0.28;

    // slow LFO on gain
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05 + i * 0.02;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(og.gain);

    o.connect(og);
    og.connect(filter);
    o.start();
    lfo.start();
    oscs.push(o, lfo);
  });

  return () => {
    oscs.forEach((o) => {
      try {
        o.stop();
      } catch {}
      try {
        o.disconnect();
      } catch {}
    });
    try {
      g.disconnect();
      filter.disconnect();
    } catch {}
  };
}

// ─── Presets ───────────────────────────────────────────────────────────

const PRESETS: PresetSpec[] = [
  {
    id: "deep-focus",
    label: "Deep Focus",
    hint: "Sub-bass drone + brown noise floor",
    calmness: 70,
    build: (ctx, master) => {
      const noise = makeNoise(ctx, "brown");
      const nf = ctx.createBiquadFilter();
      nf.type = "lowpass";
      nf.frequency.value = 600;
      const ng = ctx.createGain();
      ng.gain.value = 0.28;
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      noise.start();
      const dispose = makeDrone(ctx, [82.4, 123.5], ["sine", "triangle"], 500, 0.5, master);
      return () => {
        try {
          noise.stop();
          noise.disconnect();
          nf.disconnect();
          ng.disconnect();
        } catch {}
        dispose();
      };
    },
  },
  {
    id: "lofi",
    label: "Lo-Fi",
    hint: "Warm chord bed + soft tape hiss",
    calmness: 65,
    build: (ctx, master) => {
      const noise = makeNoise(ctx, "pink");
      const nf = ctx.createBiquadFilter();
      nf.type = "highpass";
      nf.frequency.value = 1800;
      const ng = ctx.createGain();
      ng.gain.value = 0.06;
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      noise.start();
      const dispose = makeDrone(
        ctx,
        [130.81, 155.56, 196],
        ["triangle", "triangle", "sine"],
        1200,
        0.4,
        master,
      );
      return () => {
        try {
          noise.stop();
          noise.disconnect();
          nf.disconnect();
          ng.disconnect();
        } catch {}
        dispose();
      };
    },
  },
  {
    id: "classical",
    label: "Classical",
    hint: "Detuned strings-like chord",
    calmness: 55,
    build: (ctx, master) =>
      makeDrone(
        ctx,
        [220, 277.18, 329.63, 415.3],
        ["sawtooth", "sawtooth", "triangle", "sine"],
        900,
        0.28,
        master,
      ),
  },
  {
    id: "piano",
    label: "Piano",
    hint: "Slow felt-piano chord",
    calmness: 68,
    build: (ctx, master) =>
      makeDrone(
        ctx,
        [261.63, 329.63, 392, 523.25],
        ["triangle", "sine", "sine", "triangle"],
        1400,
        0.32,
        master,
      ),
  },
  {
    id: "nature",
    label: "Nature",
    hint: "Wind + soft chimes",
    calmness: 78,
    build: (ctx, master) => {
      const noise = makeNoise(ctx, "pink");
      const nf = ctx.createBiquadFilter();
      nf.type = "lowpass";
      nf.frequency.value = 900;
      const ng = ctx.createGain();
      ng.gain.value = 0.22;
      // slow filter sweep for wind
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(nf.frequency);
      lfo.start();
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      noise.start();
      return () => {
        try {
          lfo.stop();
          noise.stop();
          noise.disconnect();
          nf.disconnect();
          ng.disconnect();
          lfoGain.disconnect();
        } catch {}
      };
    },
  },
  {
    id: "rain",
    label: "Rain",
    hint: "Pitter of light rain",
    calmness: 85,
    build: (ctx, master) => {
      const noise = makeNoise(ctx, "pink");
      const nf = ctx.createBiquadFilter();
      nf.type = "bandpass";
      nf.frequency.value = 1200;
      nf.Q.value = 0.5;
      const ng = ctx.createGain();
      ng.gain.value = 0.35;
      // fast small LFO for droplet feel
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 4;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.1;
      lfo.connect(lfoGain);
      lfoGain.connect(ng.gain);
      lfo.start();
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      noise.start();
      return () => {
        try {
          lfo.stop();
          noise.stop();
          noise.disconnect();
          nf.disconnect();
          ng.disconnect();
          lfoGain.disconnect();
        } catch {}
      };
    },
  },
  {
    id: "cafe",
    label: "Café",
    hint: "Soft murmur of a room",
    calmness: 60,
    build: (ctx, master) => {
      const noise = makeNoise(ctx, "pink");
      const nf = ctx.createBiquadFilter();
      nf.type = "bandpass";
      nf.frequency.value = 500;
      nf.Q.value = 0.4;
      const ng = ctx.createGain();
      ng.gain.value = 0.28;
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      noise.start();
      const dispose = makeDrone(ctx, [110, 165], ["sine", "sine"], 600, 0.15, master);
      return () => {
        try {
          noise.stop();
          noise.disconnect();
          nf.disconnect();
          ng.disconnect();
        } catch {}
        dispose();
      };
    },
  },
  {
    id: "white-noise",
    label: "White Noise",
    hint: "Even wall of sound",
    calmness: 55,
    build: (ctx, master) => {
      const noise = makeNoise(ctx, "white");
      const ng = ctx.createGain();
      ng.gain.value = 0.18;
      noise.connect(ng);
      ng.connect(master);
      noise.start();
      return () => {
        try {
          noise.stop();
          noise.disconnect();
          ng.disconnect();
        } catch {}
      };
    },
  },
  {
    id: "brown-noise",
    label: "Brown Noise",
    hint: "Warm, deep rumble",
    calmness: 75,
    build: (ctx, master) => {
      const noise = makeNoise(ctx, "brown");
      const ng = ctx.createGain();
      ng.gain.value = 0.3;
      noise.connect(ng);
      ng.connect(master);
      noise.start();
      return () => {
        try {
          noise.stop();
          noise.disconnect();
          ng.disconnect();
        } catch {}
      };
    },
  },
  {
    id: "meditation",
    label: "Meditation",
    hint: "Very slow breathing pad",
    calmness: 92,
    build: (ctx, master) =>
      makeDrone(
        ctx,
        [220, 275, 330],
        ["sine", "sine", "sine"],
        700,
        0.45,
        master,
      ),
  },
];

// ─── Context ───────────────────────────────────────────────────────────

interface MusicCtx {
  playing: boolean;
  preset: Preset;
  volume: number;
  muted: boolean;
  presets: PresetSpec[];
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setPreset: (p: Preset) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

const Ctx = createContext<MusicCtx | null>(null);

const STORAGE = "anchor.music.v1";

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const { metrics } = useSignals();
  const [playing, setPlaying] = useState(false);
  const [preset, setPresetInternal] = useState<Preset>("deep-focus");
  const [volume, setVolumeInternal] = useState(0.5);
  const [muted, setMuted] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const disposeRef = useRef<() => void>(() => {});

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.preset) setPresetInternal(s.preset);
        if (typeof s.volume === "number") setVolumeInternal(s.volume);
        if (typeof s.muted === "boolean") setMuted(s.muted);
      }
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ preset, volume, muted }));
    } catch {}
  }, [preset, volume, muted]);

  const start = useCallback(
    (id: Preset) => {
      if (typeof window === "undefined") return;
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (!ctxRef.current) {
        ctxRef.current = new AC();
      }
      const ctx = ctxRef.current!;
      ctx.resume();

      // teardown existing preset
      disposeRef.current?.();

      if (!masterRef.current) {
        masterRef.current = ctx.createGain();
        masterRef.current.connect(ctx.destination);
      }
      const master = masterRef.current;
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(0.0001, t);
      master.gain.linearRampToValueAtTime(muted ? 0 : volume, t + 2.2);

      const spec = PRESETS.find((p) => p.id === id)!;
      disposeRef.current = spec.build(ctx, master);
    },
    [muted, volume],
  );

  const play = useCallback(() => {
    start(preset);
    setPlaying(true);
  }, [preset, start]);

  const pause = useCallback(() => {
    if (!ctxRef.current || !masterRef.current) {
      setPlaying(false);
      return;
    }
    const t = ctxRef.current.currentTime;
    const m = masterRef.current.gain;
    m.cancelScheduledValues(t);
    m.setValueAtTime(m.value, t);
    m.linearRampToValueAtTime(0, t + 0.8);
    setTimeout(() => {
      disposeRef.current?.();
      disposeRef.current = () => {};
    }, 900);
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  const setPreset = useCallback(
    (p: Preset) => {
      setPresetInternal(p);
      if (playing) start(p);
    },
    [playing, start],
  );

  const setVolume = useCallback(
    (v: number) => {
      setVolumeInternal(v);
      if (masterRef.current && ctxRef.current) {
        const t = ctxRef.current.currentTime;
        masterRef.current.gain.cancelScheduledValues(t);
        masterRef.current.gain.linearRampToValueAtTime(muted ? 0 : v, t + 0.3);
      }
    },
    [muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (masterRef.current && ctxRef.current) {
        const t = ctxRef.current.currentTime;
        masterRef.current.gain.cancelScheduledValues(t);
        masterRef.current.gain.linearRampToValueAtTime(next ? 0 : volume, t + 0.3);
      }
      return next;
    });
  }, [volume]);

  // Adaptive switching: if stress goes high AND we're not in flow, shift to a calmer preset.
  const lastAdaptRef = useRef(0);
  useEffect(() => {
    if (!playing) return;
    if (Date.now() - lastAdaptRef.current < 60_000) return;

    const flowState = metrics.focus > 75 && metrics.stress < 45;
    if (flowState) return; // preserve flow — never switch

    if (metrics.stress > 65 || metrics.fatigue > 65) {
      const currentSpec = PRESETS.find((p) => p.id === preset)!;
      // pick the calmest preset that's calmer than the current one
      const calmer = [...PRESETS]
        .filter((p) => p.calmness > currentSpec.calmness)
        .sort((a, b) => b.calmness - a.calmness)[0];
      if (calmer) {
        setPreset(calmer.id);
        lastAdaptRef.current = Date.now();
      }
    }
  }, [metrics.stress, metrics.fatigue, metrics.focus, playing, preset, setPreset]);

  useEffect(() => {
    return () => {
      disposeRef.current?.();
      try {
        ctxRef.current?.close();
      } catch {}
    };
  }, []);

  const value = useMemo(
    () => ({
      playing,
      preset,
      volume,
      muted,
      presets: PRESETS,
      play,
      pause,
      toggle,
      setPreset,
      setVolume,
      toggleMute,
    }),
    [playing, preset, volume, muted, play, pause, toggle, setPreset, setVolume, toggleMute],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMusic() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMusic must be used inside MusicProvider");
  return c;
}

// ─── Player UI ─────────────────────────────────────────────────────────

export function MusicPlayer() {
  const music = useMusic();
  const [expanded, setExpanded] = useState(false);
  const currentSpec = music.presets.find((p) => p.id === music.preset)!;

  return (
    <div className="fixed bottom-6 right-6 z-30 w-72 overflow-hidden rounded-2xl border border-neutral-800 bg-black/85 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-neutral-900 px-3 py-2">
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
          <Music className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs text-neutral-100">{currentSpec.label}</div>
          <div className="truncate text-[10px] text-neutral-500">{currentSpec.hint}</div>
        </div>
        <button
          onClick={music.toggle}
          className="rounded-full bg-cyan-400 p-1.5 text-neutral-950 hover:scale-105 transition-transform"
          aria-label={music.playing ? "Pause" : "Play"}
        >
          {music.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="rounded p-1 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-100"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="max-h-56 overflow-y-auto px-2 py-2">
            {music.presets.map((p) => (
              <button
                key={p.id}
                onClick={() => music.setPreset(p.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                  p.id === music.preset
                    ? "bg-cyan-400/10 text-cyan-100"
                    : "text-neutral-300 hover:bg-neutral-900",
                )}
              >
                <span>{p.label}</span>
                <span className="text-[10px] text-neutral-500">{p.hint}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-neutral-900 px-3 py-2">
            <button
              onClick={music.toggleMute}
              className="rounded p-1 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-100"
              aria-label={music.muted ? "Unmute" : "Mute"}
            >
              {music.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={music.volume}
              onChange={(e) => music.setVolume(parseFloat(e.target.value))}
              className="h-1 flex-1 accent-cyan-400"
            />
          </div>
        </>
      )}
    </div>
  );
}
