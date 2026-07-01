"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

export interface VisionStats {
  active: boolean;
  postureScore: number;
  blinkRate: number;
  gazeCentered: number;
  expression: string;
  jawTension: number;
  browTension: number;
  faceDetected: boolean;
}

export interface TypingStats {
  active: boolean;
  wpm: number;
  backspaceRatio: number;
  cadenceVariance: number;
  hesitationScore: number;
  accuracy: number; // 0-100
  totalKeys: number;
}

export interface VoiceStats {
  active: boolean;
  lastReply: string | null;
  confidence: number; // 0-100 based on last call
  pace: number; // words / minute during last call
}

export interface WearableStats {
  connected: boolean;
  deviceName: string | null;
  heartRate?: number;
  hrv?: number;
  spO2?: number;
  respiratoryRate?: number;
  bloodPressure?: string;
}

export interface Nudge {
  id: string;
  ts: number;
  source: "vision" | "typing" | "voice" | "system" | "coach";
  text: string;
}

export type DistractionKind =
  | "tab-hidden"
  | "fullscreen-exit"
  | "blocked-click"
  | "app-blur";

export interface DistractionEvent {
  id: string;
  ts: number;
  kind: DistractionKind;
  detail?: string;
}

export type WellnessEventKind =
  | "poor-posture"
  | "eye-strain"
  | "low-blink-rate"
  | "mental-fatigue"
  | "high-stress"
  | "long-sitting"
  | "excessive-distractions"
  | "left-focus"
  | "low-productivity"
  | "no-breaks";

export interface WellnessEvent {
  id: string;
  ts: number;
  kind: WellnessEventKind;
  severity: "gentle" | "notable" | "urgent";
  message: string;
}

export interface Achievement {
  id: string;
  ts: number;
  label: string;
  detail: string;
  emoji?: string;
}

export interface HistorySnapshot {
  ts: number;
  wellness: number;
  focus: number;
  stress: number;
  fatigue: number;
  posture: number;
  blinkRate: number;
  typingSpeed: number;
}

interface State {
  vision: VisionStats;
  typing: TypingStats;
  voice: VoiceStats;
  wearable: WearableStats;
  nudges: Nudge[];
  distractions: DistractionEvent[];
  events: WellnessEvent[];
  achievements: Achievement[];
  recentCoachLines: string[]; // ring buffer for no-repeat
  history: HistorySnapshot[];
  sessionStartedAt: number | null;
}

type Action =
  | { type: "vision"; payload: Partial<VisionStats> }
  | { type: "typing"; payload: Partial<TypingStats> }
  | { type: "voice"; payload: Partial<VoiceStats> }
  | { type: "wearable"; payload: Partial<WearableStats> }
  | { type: "nudge"; payload: Omit<Nudge, "id" | "ts"> }
  | { type: "distraction"; payload: Omit<DistractionEvent, "id" | "ts"> }
  | { type: "wellness-event"; payload: Omit<WellnessEvent, "id" | "ts"> }
  | { type: "clear-event"; id: string }
  | { type: "achievement"; payload: Omit<Achievement, "id" | "ts"> }
  | { type: "coach-line"; payload: string }
  | { type: "snapshot"; payload: HistorySnapshot }
  | { type: "start-session" }
  | { type: "end-session" }
  | { type: "reset-vision" }
  | { type: "reset-typing" };

const initial: State = {
  vision: {
    active: false,
    postureScore: 80,
    blinkRate: 16,
    gazeCentered: 1,
    expression: "neutral",
    jawTension: 0.2,
    browTension: 0.2,
    faceDetected: false,
  },
  typing: {
    active: false,
    wpm: 0,
    backspaceRatio: 0,
    cadenceVariance: 0,
    hesitationScore: 100,
    accuracy: 100,
    totalKeys: 0,
  },
  voice: { active: false, lastReply: null, confidence: 0, pace: 0 },
  wearable: { connected: false, deviceName: null },
  nudges: [],
  distractions: [],
  events: [],
  achievements: [],
  recentCoachLines: [],
  history: [],
  sessionStartedAt: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "vision":
      return { ...state, vision: { ...state.vision, ...action.payload } };
    case "typing":
      return { ...state, typing: { ...state.typing, ...action.payload } };
    case "voice":
      return { ...state, voice: { ...state.voice, ...action.payload } };
    case "wearable":
      return { ...state, wearable: { ...state.wearable, ...action.payload } };
    case "nudge": {
      const nudge: Nudge = {
        ...action.payload,
        id: Math.random().toString(36).slice(2),
        ts: Date.now(),
      };
      return { ...state, nudges: [nudge, ...state.nudges].slice(0, 60) };
    }
    case "distraction": {
      const d: DistractionEvent = {
        ...action.payload,
        id: Math.random().toString(36).slice(2),
        ts: Date.now(),
      };
      return { ...state, distractions: [d, ...state.distractions].slice(0, 200) };
    }
    case "wellness-event": {
      const e: WellnessEvent = {
        ...action.payload,
        id: Math.random().toString(36).slice(2),
        ts: Date.now(),
      };
      return { ...state, events: [e, ...state.events].slice(0, 120) };
    }
    case "clear-event":
      return { ...state, events: state.events.filter((e) => e.id !== action.id) };
    case "achievement": {
      // do not double-award identical labels
      if (state.achievements.some((a) => a.label === action.payload.label)) return state;
      const a: Achievement = {
        ...action.payload,
        id: Math.random().toString(36).slice(2),
        ts: Date.now(),
      };
      return { ...state, achievements: [a, ...state.achievements].slice(0, 80) };
    }
    case "coach-line": {
      const line = action.payload.slice(0, 240);
      if (!line) return state;
      return {
        ...state,
        recentCoachLines: [line, ...state.recentCoachLines].slice(0, 12),
      };
    }
    case "snapshot":
      return { ...state, history: [...state.history, action.payload].slice(-240) };
    case "start-session":
      return { ...state, sessionStartedAt: Date.now(), distractions: [], history: [] };
    case "end-session":
      return { ...state, sessionStartedAt: null };
    case "reset-vision":
      return { ...state, vision: { ...initial.vision } };
    case "reset-typing":
      return { ...state, typing: { ...initial.typing } };
    default:
      return state;
  }
}

export interface DerivedMetrics {
  focus: number; // 0-100 sustained-attention proxy
  productivity: number;
  wellness: number;
  stress: number; // 0-100
  fatigue: number;
  burnoutRisk: number;
  mood: string;
  energy: number;
  eyeStrain: number;
  neckPosition: number; // 0-100 (100=neutral)
  shoulderPosition: number;
  facialTension: number;
  typingFatigue: number;
  wellnessLabel: string;
}

function derive(state: State): DerivedMetrics {
  const v = state.vision;
  const t = state.typing;
  const w = state.wearable;

  // clamps
  const clip = (n: number) => Math.max(0, Math.min(100, n));

  // Focus proxy — gaze centered + no distractions recent + steady typing
  const recentDistractions = state.distractions.filter(
    (d) => Date.now() - d.ts < 60_000
  ).length;
  const focus = clip(
    (v.active ? v.gazeCentered * 90 : 70) - recentDistractions * 12 +
      (t.active && t.cadenceVariance < 0.4 ? 8 : 0)
  );

  // Productivity — typing speed + focus
  const productivity = clip(
    (t.active ? Math.min(100, (t.wpm / 60) * 100) : 60) * 0.6 + focus * 0.4
  );

  // Fatigue — falling blink (too few blinks = eye strain), high hesitation
  const fatigue = clip(
    (v.active ? Math.max(0, 25 - v.blinkRate) * 2.4 : 15) +
      (t.active ? (100 - t.hesitationScore) * 0.35 : 5)
  );

  // Eye strain — blink rate very low
  const eyeStrain = clip(
    v.active ? Math.max(0, 15 - v.blinkRate) * 6 : 10
  );

  // Facial tension — average of jaw + brow
  const facialTension = clip(((v.jawTension + v.browTension) / 2) * 100);

  // Stress — facial tension + fatigue + backspace ratio, moderated by hr if available
  const stress = clip(
    facialTension * 0.5 +
      fatigue * 0.3 +
      (t.active ? Math.min(60, t.backspaceRatio * 250) : 10) +
      (w.connected && w.hrv ? Math.max(0, 20 - w.hrv) * 2 : 0)
  );

  // Wellness (mirrors composite) — inverse of stress + facial tension + fatigue
  const wellness = clip(
    100 - stress * 0.55 - facialTension * 0.2 - fatigue * 0.15
  );

  // Burnout risk — sustained low wellness in recent history
  const last20 = state.history.slice(-20);
  const avgWellness = last20.length
    ? last20.reduce((s, x) => s + x.wellness, 0) / last20.length
    : wellness;
  const burnoutRisk = clip(100 - avgWellness);

  // Mood — expression + energy
  const mood =
    v.expression === "relaxed"
      ? "settled"
      : v.expression === "tense"
      ? "on edge"
      : stress > 60
      ? "tight"
      : "steady";

  // Energy — typing speed + wellness
  const energy = clip((t.active ? (t.wpm / 70) * 80 : 60) * 0.5 + wellness * 0.5);

  // Neck / shoulder — inferred from posture score
  const neckPosition = clip(v.postureScore * 0.9 + 10);
  const shoulderPosition = clip(v.postureScore * 0.85 + 15);

  // Typing fatigue — inverse of hesitationScore combined with total keys
  const typingFatigue = clip(
    (t.active ? (100 - t.hesitationScore) * 0.7 : 5) +
      Math.min(30, t.totalKeys / 200)
  );

  let wellnessLabel = "steady";
  if (wellness < 40) wellnessLabel = "heavy";
  else if (wellness < 60) wellnessLabel = "tight";
  else if (wellness < 82) wellnessLabel = "steady";
  else wellnessLabel = "open";

  return {
    focus,
    productivity,
    wellness,
    stress,
    fatigue,
    burnoutRisk,
    mood,
    energy,
    eyeStrain,
    neckPosition,
    shoulderPosition,
    facialTension,
    typingFatigue,
    wellnessLabel,
  };
}

interface Ctx {
  state: State;
  metrics: DerivedMetrics;
  updateVision: (p: Partial<VisionStats>) => void;
  updateTyping: (p: Partial<TypingStats>) => void;
  updateVoice: (p: Partial<VoiceStats>) => void;
  updateWearable: (p: Partial<WearableStats>) => void;
  addNudge: (n: Omit<Nudge, "id" | "ts">) => void;
  logDistraction: (n: Omit<DistractionEvent, "id" | "ts">) => void;
  fireEvent: (n: Omit<WellnessEvent, "id" | "ts">) => void;
  clearEvent: (id: string) => void;
  awardAchievement: (n: Omit<Achievement, "id" | "ts">) => void;
  rememberCoachLine: (text: string) => void;
  startSession: () => void;
  endSession: () => void;
  resetVision: () => void;
  resetTyping: () => void;
  wellnessScore: number;
  wellnessLabel: string;
}

const SignalsCtx = createContext<Ctx | null>(null);

export function SignalsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const updateVision = useCallback(
    (p: Partial<VisionStats>) => dispatch({ type: "vision", payload: p }),
    []
  );
  const updateTyping = useCallback(
    (p: Partial<TypingStats>) => dispatch({ type: "typing", payload: p }),
    []
  );
  const updateVoice = useCallback(
    (p: Partial<VoiceStats>) => dispatch({ type: "voice", payload: p }),
    []
  );
  const updateWearable = useCallback(
    (p: Partial<WearableStats>) => dispatch({ type: "wearable", payload: p }),
    []
  );
  const addNudge = useCallback(
    (n: Omit<Nudge, "id" | "ts">) => dispatch({ type: "nudge", payload: n }),
    []
  );
  const logDistraction = useCallback(
    (n: Omit<DistractionEvent, "id" | "ts">) =>
      dispatch({ type: "distraction", payload: n }),
    []
  );
  const fireEvent = useCallback(
    (n: Omit<WellnessEvent, "id" | "ts">) =>
      dispatch({ type: "wellness-event", payload: n }),
    []
  );
  const clearEvent = useCallback(
    (id: string) => dispatch({ type: "clear-event", id }),
    []
  );
  const awardAchievement = useCallback(
    (n: Omit<Achievement, "id" | "ts">) =>
      dispatch({ type: "achievement", payload: n }),
    []
  );
  const rememberCoachLine = useCallback(
    (text: string) => dispatch({ type: "coach-line", payload: text }),
    []
  );
  const startSession = useCallback(() => dispatch({ type: "start-session" }), []);
  const endSession = useCallback(() => dispatch({ type: "end-session" }), []);
  const resetVision = useCallback(() => dispatch({ type: "reset-vision" }), []);
  const resetTyping = useCallback(() => dispatch({ type: "reset-typing" }), []);

  const metrics = useMemo(() => derive(state), [state]);
  const wellnessScore = Math.round(metrics.wellness);
  const wellnessLabel = metrics.wellnessLabel;

  // periodic snapshot for history + trend charts
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({
        type: "snapshot",
        payload: {
          ts: Date.now(),
          wellness: metrics.wellness,
          focus: metrics.focus,
          stress: metrics.stress,
          fatigue: metrics.fatigue,
          posture: state.vision.postureScore,
          blinkRate: state.vision.blinkRate,
          typingSpeed: state.typing.wpm,
        },
      });
    }, 15_000);
    return () => clearInterval(id);
  }, [metrics, state.vision, state.typing]);

  const value = useMemo(
    () => ({
      state,
      metrics,
      updateVision,
      updateTyping,
      updateVoice,
      updateWearable,
      addNudge,
      logDistraction,
      fireEvent,
      clearEvent,
      awardAchievement,
      rememberCoachLine,
      startSession,
      endSession,
      resetVision,
      resetTyping,
      wellnessScore,
      wellnessLabel,
    }),
    [
      state,
      metrics,
      updateVision,
      updateTyping,
      updateVoice,
      updateWearable,
      addNudge,
      logDistraction,
      fireEvent,
      clearEvent,
      awardAchievement,
      rememberCoachLine,
      startSession,
      endSession,
      resetVision,
      resetTyping,
      wellnessScore,
      wellnessLabel,
    ]
  );

  return <SignalsCtx.Provider value={value}>{children}</SignalsCtx.Provider>;
}

export function useSignals(): Ctx {
  const c = useContext(SignalsCtx);
  if (!c) throw new Error("useSignals must be used inside SignalsProvider");
  return c;
}
