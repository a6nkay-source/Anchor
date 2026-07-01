// Reliable browser TTS. Waits for voices to load, picks a warm English voice,
// cancels any prior utterance so lines don't stack.

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReady: Promise<void> | null = null;

function ensureVoices(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (voicesReady) return voicesReady;

  voicesReady = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) return resolve();

    const pick = () => {
      const voices = synth.getVoices();
      if (voices.length === 0) return false;
      cachedVoice =
        voices.find((v) => /samantha|karen|serena|ava|zoe/i.test(v.name) && v.lang.startsWith("en")) ??
        voices.find((v) => v.lang === "en-US" && v.default) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        voices[0];
      return true;
    };

    if (pick()) return resolve();
    const handler = () => {
      if (pick()) {
        synth.removeEventListener("voiceschanged", handler);
        resolve();
      }
    };
    synth.addEventListener("voiceschanged", handler);
    // Fallback: resolve after 1.5s even if voices never fire
    setTimeout(() => {
      pick();
      resolve();
    }, 1500);
  });
  return voicesReady;
}

// Prime the audio subsystem on the first user gesture. Some browsers
// (Safari, iOS) refuse speech until a gesture has fired.
export function primeSpeech() {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {}
  ensureVoices();
}

export async function speak(text: string, opts: { rate?: number; muted?: boolean } = {}) {
  if (opts.muted) return;
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  const clean = (text || "").trim();
  if (!clean) return;

  try {
    await ensureVoices();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = opts.rate ?? 0.95;
    u.pitch = 1.0;
    u.volume = 1.0;
    if (cachedVoice) u.voice = cachedVoice;
    synth.speak(u);
  } catch {
    /* best-effort */
  }
}

export function stopSpeech() {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis?.cancel();
  } catch {}
}
