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
  postureScore: number; // 0-100
  blinkRate: number; // per minute
  gazeCentered: number; // 0-1
  expression: string; // 'neutral' | 'tense' | 'relaxed' | ...
  jawTension: number; // 0-1
  browTension: number; // 0-1
  faceDetected: boolean;
}

export interface TypingStats {
  active: boolean;
  wpm: number;
  backspaceRatio: number; // 0-1
  cadenceVariance: number; // 0-1 (higher = choppier)
  hesitationScore: number; // 0-100 (higher = calmer)
}

export interface VoiceStats {
  active: boolean;
  lastReply: string | null;
}

export interface Nudge {
  id: string;
  ts: number;
  source: "vision" | "typing" | "voice" | "system";
  text: string;
}

interface State {
  vision: VisionStats;
  typing: TypingStats;
  voice: VoiceStats;
  nudges: Nudge[];
}

type Action =
  | { type: "vision"; payload: Partial<VisionStats> }
  | { type: "typing"; payload: Partial<TypingStats> }
  | { type: "voice"; payload: Partial<VoiceStats> }
  | { type: "nudge"; payload: Omit<Nudge, "id" | "ts"> }
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
  },
  voice: { active: false, lastReply: null },
  nudges: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "vision":
      return { ...state, vision: { ...state.vision, ...action.payload } };
    case "typing":
      return { ...state, typing: { ...state.typing, ...action.payload } };
    case "voice":
      return { ...state, voice: { ...state.voice, ...action.payload } };
    case "nudge": {
      const nudge: Nudge = {
        ...action.payload,
        id: Math.random().toString(36).slice(2),
        ts: Date.now(),
      };
      return { ...state, nudges: [nudge, ...state.nudges].slice(0, 40) };
    }
    case "reset-vision":
      return { ...state, vision: { ...initial.vision } };
    case "reset-typing":
      return { ...state, typing: { ...initial.typing } };
    default:
      return state;
  }
}

interface Ctx {
  state: State;
  updateVision: (p: Partial<VisionStats>) => void;
  updateTyping: (p: Partial<TypingStats>) => void;
  updateVoice: (p: Partial<VoiceStats>) => void;
  addNudge: (n: Omit<Nudge, "id" | "ts">) => void;
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
  const addNudge = useCallback(
    (n: Omit<Nudge, "id" | "ts">) => dispatch({ type: "nudge", payload: n }),
    []
  );
  const resetVision = useCallback(() => dispatch({ type: "reset-vision" }), []);
  const resetTyping = useCallback(() => dispatch({ type: "reset-typing" }), []);

  const { wellnessScore, wellnessLabel } = useMemo(() => {
    const v = state.vision;
    const t = state.typing;

    const visionScore = v.active
      ? clamp(
          0.45 * v.postureScore +
            0.15 * v.gazeCentered * 100 +
            0.2 * (1 - v.jawTension) * 100 +
            0.2 * (1 - v.browTension) * 100
        )
      : 80;

    const typingScore = t.active
      ? clamp(
          0.5 * t.hesitationScore +
            0.3 * (1 - Math.min(1, t.backspaceRatio * 2.5)) * 100 +
            0.2 * (1 - t.cadenceVariance) * 100
        )
      : 80;

    const score = Math.round(0.6 * visionScore + 0.4 * typingScore);
    let label = "steady";
    if (score < 45) label = "heavy";
    else if (score < 65) label = "tight";
    else if (score < 82) label = "steady";
    else label = "open";

    return { wellnessScore: score, wellnessLabel: label };
  }, [state.vision, state.typing]);

  const value = useMemo(
    () => ({
      state,
      updateVision,
      updateTyping,
      updateVoice,
      addNudge,
      resetVision,
      resetTyping,
      wellnessScore,
      wellnessLabel,
    }),
    [
      state,
      updateVision,
      updateTyping,
      updateVoice,
      addNudge,
      resetVision,
      resetTyping,
      wellnessScore,
      wellnessLabel,
    ]
  );

  return <SignalsCtx.Provider value={value}>{children}</SignalsCtx.Provider>;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function useSignals(): Ctx {
  const c = useContext(SignalsCtx);
  if (!c) throw new Error("useSignals must be used inside SignalsProvider");
  return c;
}

// Convenience hook — throttled snapshot for periodic reads (avoids re-render storms)
export function useSignalsRef() {
  const { state, wellnessScore, wellnessLabel } = useSignals();
  const ref = useRef({ state, wellnessScore, wellnessLabel });
  useEffect(() => {
    ref.current = { state, wellnessScore, wellnessLabel };
  }, [state, wellnessScore, wellnessLabel]);
  return ref;
}
