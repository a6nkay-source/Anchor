"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SignalBar } from "@/components/signal-bar";
import { useSignals } from "@/components/signals-store";

type Phase = "idle" | "loading-model" | "requesting-camera" | "running" | "error";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

// Blendshape categories that indicate tension / expression.
const TENSION_BROW = ["browDownLeft", "browDownRight", "browInnerUp"];
const TENSION_JAW = ["jawOpen", "mouthPressLeft", "mouthPressRight", "mouthFrownLeft", "mouthFrownRight"];

interface Smoothed {
  posture: number;
  blinkRate: number;
  gazeCentered: number;
  jaw: number;
  brow: number;
}

export function VisionPanel() {
  const { state, updateVision, resetVision, wellnessScore } = useSignals();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  // Rolling blink counter: timestamps of blinks in the last minute.
  const blinkTimesRef = useRef<number[]>([]);
  const wasEyesClosedRef = useRef(false);
  const smoothedRef = useRef<Smoothed>({
    posture: 80,
    blinkRate: 16,
    gazeCentered: 1,
    jaw: 0.2,
    brow: 0.2,
  });

  // Track baseline face size so we can detect leaning-in over time.
  const baselineFaceHeightRef = useRef<number | null>(null);
  const lastPushRef = useRef(0);
  const lastFaceDetectedRef = useRef(false);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
  }, [resetVision]);

  const start = useCallback(async () => {
    setErrorMsg(null);
    setPhase("loading-model");
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_ROOT);
      const landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
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
      runningRef.current = true;
      loop();
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (/Permission|denied|NotAllowed/i.test(msg)) {
        setErrorMsg("Camera permission denied. Allow it in your browser and try again.");
      } else if (/model/i.test(msg)) {
        setErrorMsg("Couldn't load the face model. Check your connection.");
      } else {
        setErrorMsg(msg);
      }
      setPhase("error");
      stop();
    }
  }, [stop, updateVision]);

  useEffect(() => () => stop(), [stop]);

  const loop = () => {
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
      const nose = face[1];
      const chin = face[152];
      const forehead = face[10];
      const leftCheek = face[234];
      const rightCheek = face[454];

      // face height in normalized coords
      const faceHeight = Math.abs(chin.y - forehead.y);
      if (baselineFaceHeightRef.current == null) {
        baselineFaceHeightRef.current = faceHeight;
      }
      const baseline = baselineFaceHeightRef.current;

      // Posture proxy: if face is significantly bigger than baseline, user leaned in.
      // If face slid down in the frame, user is slumping.
      const leanIn = Math.max(0, faceHeight / baseline - 1); // 0..~0.4
      const centerY = (forehead.y + chin.y) / 2;
      const slump = Math.max(0, centerY - 0.55); // frame center is 0.5; below = slump
      let posture = 100 - leanIn * 180 - slump * 200;

      // horizontal centering — if face is way off-center, gaze proxy is worse
      const centerX = (leftCheek.x + rightCheek.x) / 2;
      const offCenter = Math.abs(centerX - 0.5);
      const gazeCentered = Math.max(0, 1 - offCenter * 3.5);

      // blink detection via blendshape scores
      const blinkLeft = scoreOf(blend, "eyeBlinkLeft");
      const blinkRight = scoreOf(blend, "eyeBlinkRight");
      const eyesClosed = (blinkLeft + blinkRight) / 2 > 0.55;
      if (eyesClosed && !wasEyesClosedRef.current) {
        blinkTimesRef.current.push(performance.now());
      }
      wasEyesClosedRef.current = eyesClosed;

      // trim to last 60s
      const cutoff = performance.now() - 60_000;
      blinkTimesRef.current = blinkTimesRef.current.filter((t) => t > cutoff);
      const blinkWindow = blinkTimesRef.current.length; // per rolling window (not yet a minute — scale)
      const secondsObserved = Math.max(
        5,
        (performance.now() - (blinkTimesRef.current[0] ?? performance.now())) / 1000
      );
      const perMin = (blinkWindow / secondsObserved) * 60;
      const blinkRate = clamp01(perMin / 30) * 30; // clamp to 30/min max sensor

      const brow =
        avg(TENSION_BROW.map((n) => scoreOf(blend, n))) * 1.3;
      const jaw =
        avg(TENSION_JAW.map((n) => scoreOf(blend, n))) * 1.4;

      // smooth
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
          : scoreOf(blend, "mouthSmileLeft") + scoreOf(blend, "mouthSmileRight") >
            0.5
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

      // overlay: draw a soft dot mesh of ~40 sampled points
      ctx.fillStyle = "rgba(103, 232, 249, 0.55)";
      for (let i = 0; i < face.length; i += 12) {
        const p = face[i];
        ctx.fillRect(p.x * canvas.width - 1, p.y * canvas.height - 1, 2, 2);
      }
      // face bounding hint
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
  };

  const v = state.vision;
  const stateText =
    phase === "idle"
      ? "Camera off"
      : phase === "loading-model"
      ? "Loading face model…"
      : phase === "requesting-camera"
      ? "Waiting for permission…"
      : phase === "error"
      ? "Error"
      : v.faceDetected
      ? "Reading your face"
      : "No face in frame";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Vision</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
            Live camera signals.
          </h1>
        </div>
        {phase === "idle" || phase === "error" ? (
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
          >
            <Camera className="h-4 w-4" /> Start camera
          </button>
        ) : (
          <button
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-rose-400/40"
          >
            <CameraOff className="h-4 w-4" /> Stop
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="relative overflow-hidden bg-black">
          <div className="relative aspect-[4/3] w-full">
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full -scale-x-100"
            />
            {(phase === "idle" || phase === "loading-model" || phase === "requesting-camera") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-sm text-neutral-400">
                {phase === "idle" ? (
                  <>
                    <Camera className="h-6 w-6 text-neutral-500" />
                    Camera off. Anchor won&apos;t see anything until you turn it on.
                  </>
                ) : (
                  <>
                    <span className="loader" />
                    {stateText}
                  </>
                )}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-neutral-300">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    phase === "running"
                      ? "animate-pulse bg-emerald-400"
                      : "bg-neutral-600"
                  }`}
                />
                {stateText}
              </span>
              <span className="text-neutral-500">
                wellness {wellnessScore}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-neutral-950/60 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-100">
            Live readings
          </h3>
          <div className="space-y-5">
            <SignalBar
              label="Posture"
              value={Math.round(v.postureScore)}
              hint={
                v.postureScore > 75
                  ? "Sitting well."
                  : v.postureScore > 55
                  ? "Slightly leaning."
                  : "Slumped forward."
              }
            />
            <SignalBar
              label="Gaze centered"
              value={Math.round(v.gazeCentered * 100)}
              hint={v.gazeCentered > 0.65 ? "Looking at the screen." : "Drifting."}
            />
            <SignalBar
              label="Blink rate"
              value={Math.min(100, Math.round(v.blinkRate * 5))}
              hint={`${v.blinkRate.toFixed(0)} / min · ${
                v.blinkRate < 6 ? "locked in" : v.blinkRate > 22 ? "distracted" : "healthy"
              }`}
            />
            <SignalBar
              label="Jaw tension"
              value={100 - Math.round(v.jawTension * 100)}
              hint={v.jawTension > 0.55 ? "Tight." : "Soft."}
            />
            <SignalBar
              label="Brow tension"
              value={100 - Math.round(v.browTension * 100)}
              hint={v.browTension > 0.55 ? "Furrowed." : "Relaxed."}
            />
            <div className="pt-2 text-xs text-neutral-500">
              expression: <span className="text-neutral-300">{v.expression}</span>
            </div>
          </div>
        </Card>
      </div>

      {errorMsg && (
        <Card className="flex items-start gap-3 border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMsg}
        </Card>
      )}

      <Card className="bg-neutral-950/60 p-6 text-sm text-neutral-400">
        Anchor runs everything locally in your browser. Frames never leave your
        device — only the small numeric signals above feed the wellness score.
      </Card>
    </div>
  );
}

function scoreOf(cats: any[], name: string): number {
  const c = cats.find((x: any) => x.categoryName === name);
  return c ? c.score : 0;
}

function avg(arr: number[]): number {
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
