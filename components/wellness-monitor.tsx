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

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const TENSION_BROW = ["browDownLeft", "browDownRight", "browInnerUp"];
const TENSION_JAW = ["jawOpen", "mouthPressLeft", "mouthPressRight", "mouthFrownLeft", "mouthFrownRight"];

export type MonitorPhase =
  | "idle"
  | "loading-model"
  | "requesting-camera"
  | "running"
  | "error";

export type CameraPermission = "unknown" | "granted" | "prompt" | "denied";

interface Ctx {
  phase: MonitorPhase;
  error: string | null;
  permission: CameraPermission;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  start: () => Promise<void>;
  stop: () => void;
  attach: (el: HTMLDivElement | null) => void; // where preview mounts
}

const MonitorCtx = createContext<Ctx | null>(null);

export function WellnessMonitorProvider({ children }: { children: React.ReactNode }) {
  const { updateVision, resetVision } = useSignals();
  const [phase, setPhase] = useState<MonitorPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<CameraPermission>("unknown");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  const smoothedRef = useRef({
    posture: 80,
    blinkRate: 16,
    gazeCentered: 1,
    jaw: 0.2,
    brow: 0.2,
  });
  const baselineFaceHeightRef = useRef<number | null>(null);
  const blinkTimesRef = useRef<number[]>([]);
  const wasEyesClosedRef = useRef(false);
  const lastPushRef = useRef(0);
  const lastFaceDetectedRef = useRef(false);
  const previewHostRef = useRef<HTMLDivElement | null>(null);

  const attach = useCallback((el: HTMLDivElement | null) => {
    previewHostRef.current = el;
    if (el && videoRef.current && !videoRef.current.parentElement?.isSameNode(el)) {
      el.appendChild(videoRef.current);
      el.appendChild(canvasRef.current!);
    }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (landmarkerRef.current) {
      try {
        landmarkerRef.current.close();
      } catch {}
      landmarkerRef.current = null;
    }
    baselineFaceHeightRef.current = null;
    blinkTimesRef.current = [];
    resetVision();
    setPhase("idle");
    setError(null);
  }, [resetVision]);

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let result: any;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    const face = result?.faceLandmarks?.[0];
    const blend = result?.faceBlendshapes?.[0]?.categories ?? [];

    if (face && face.length) {
      const forehead = face[10];
      const chin = face[152];
      const leftCheek = face[234];
      const rightCheek = face[454];

      const faceHeight = Math.abs(chin.y - forehead.y);
      if (baselineFaceHeightRef.current == null) {
        baselineFaceHeightRef.current = faceHeight;
      }
      const baseline = baselineFaceHeightRef.current;
      const leanIn = Math.max(0, faceHeight / baseline - 1);
      const centerY = (forehead.y + chin.y) / 2;
      const slump = Math.max(0, centerY - 0.55);
      let posture = 100 - leanIn * 180 - slump * 200;

      const centerX = (leftCheek.x + rightCheek.x) / 2;
      const offCenter = Math.abs(centerX - 0.5);
      const gazeCentered = Math.max(0, 1 - offCenter * 3.5);

      const blinkLeft = scoreOf(blend, "eyeBlinkLeft");
      const blinkRight = scoreOf(blend, "eyeBlinkRight");
      const eyesClosed = (blinkLeft + blinkRight) / 2 > 0.55;
      if (eyesClosed && !wasEyesClosedRef.current) {
        blinkTimesRef.current.push(performance.now());
      }
      wasEyesClosedRef.current = eyesClosed;

      const cutoff = performance.now() - 60_000;
      blinkTimesRef.current = blinkTimesRef.current.filter((t) => t > cutoff);
      const blinkWindow = blinkTimesRef.current.length;
      const secondsObserved = Math.max(
        5,
        (performance.now() - (blinkTimesRef.current[0] ?? performance.now())) / 1000
      );
      const perMin = (blinkWindow / secondsObserved) * 60;
      const blinkRate = Math.min(30, perMin);

      const brow = avg(TENSION_BROW.map((n) => scoreOf(blend, n))) * 1.3;
      const jaw = avg(TENSION_JAW.map((n) => scoreOf(blend, n))) * 1.4;

      const s = smoothedRef.current;
      const a = 0.15;
      s.posture = lerp(s.posture, clamp(posture, 0, 100), a);
      s.gazeCentered = lerp(s.gazeCentered, clamp01(gazeCentered), a);
      s.blinkRate = lerp(s.blinkRate, blinkRate, a * 0.6);
      s.jaw = lerp(s.jaw, clamp01(jaw), a);
      s.brow = lerp(s.brow, clamp01(brow), a);

      const expression =
        s.jaw > 0.55 || s.brow > 0.55
          ? "tense"
          : scoreOf(blend, "mouthSmileLeft") + scoreOf(blend, "mouthSmileRight") > 0.5
          ? "relaxed"
          : "neutral";

      const nowMs = performance.now();
      if (nowMs - lastPushRef.current > 120) {
        lastPushRef.current = nowMs;
        lastFaceDetectedRef.current = true;
        updateVision({
          active: true,
          faceDetected: true,
          postureScore: s.posture,
          blinkRate: s.blinkRate,
          gazeCentered: s.gazeCentered,
          jawTension: s.jaw,
          browTension: s.brow,
          expression,
        });
      }

      // overlay mesh
      ctx.fillStyle = "rgba(103, 232, 249, 0.55)";
      for (let i = 0; i < face.length; i += 12) {
        const p = face[i];
        ctx.fillRect(p.x * canvas.width - 1, p.y * canvas.height - 1, 2, 2);
      }
      ctx.strokeStyle = "rgba(103, 232, 249, 0.35)";
      ctx.lineWidth = 1;
      const w = canvas.width;
      const h = canvas.height;
      ctx.strokeRect(
        leftCheek.x * w,
        forehead.y * h,
        (rightCheek.x - leftCheek.x) * w,
        (chin.y - forehead.y) * h
      );
    } else if (lastFaceDetectedRef.current) {
      lastFaceDetectedRef.current = false;
      updateVision({ active: true, faceDetected: false });
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [updateVision]);

  const start = useCallback(async () => {
    if (phase === "running") return;
    setError(null);
    setPhase("loading-model");
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
      const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
      landmarkerRef.current = landmarker;

      setPhase("requesting-camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      updateVision({ active: true });
      setPhase("running");
      setPermission("granted");
      try {
        localStorage.setItem("anchor.monitor.autostart", "true");
      } catch {}
      runningRef.current = true;
      loop();
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (/Permission|denied|NotAllowed/i.test(msg)) {
        setError("Camera permission denied. Allow it in your browser and try again.");
      } else if (/model/i.test(msg)) {
        setError("Couldn't load the face model. Check your connection.");
      } else {
        setError(msg);
      }
      setPhase("error");
      runningRef.current = false;
    }
  }, [phase, updateVision, loop]);

  useEffect(() => () => stop(), [stop]);

  // Probe camera permission on mount and, if already granted, auto-start.
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        if ((navigator as any).permissions?.query) {
          const status: PermissionStatus = await (navigator as any).permissions.query({
            name: "camera",
          });
          if (cancelled) return;
          const p = status.state as CameraPermission;
          setPermission(p);
          status.onchange = () => {
            if (!cancelled) setPermission(status.state as CameraPermission);
          };
          const autostart =
            typeof window !== "undefined" &&
            localStorage.getItem("anchor.monitor.autostart") !== "false";
          if (p === "granted" && autostart) {
            // small delay so the app has painted before we ask MediaPipe to load
            setTimeout(() => {
              if (!cancelled) start();
            }, 400);
          }
        } else {
          setPermission("prompt");
        }
      } catch {
        setPermission("prompt");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ phase, error, permission, videoRef, canvasRef, start, stop, attach }),
    [phase, error, permission, start, stop, attach]
  );

  return (
    <MonitorCtx.Provider value={value}>
      {/* video + canvas live at the root; the panels graft them via attach() */}
      <div style={{ position: "fixed", left: -99999, top: -99999, pointerEvents: "none" }}>
        <video ref={videoRef} muted playsInline width={640} height={480} />
        <canvas ref={canvasRef} width={640} height={480} />
      </div>
      {children}
    </MonitorCtx.Provider>
  );
}

export function useMonitor() {
  const c = useContext(MonitorCtx);
  if (!c) throw new Error("useMonitor must be used inside WellnessMonitorProvider");
  return c;
}

function scoreOf(cats: any[], name: string): number {
  const c = cats.find((x: any) => x.categoryName === name);
  return c ? c.score : 0;
}
function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
