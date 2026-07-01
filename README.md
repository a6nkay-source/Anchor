# Anchor

An AI-powered academic operating system that quietly watches over you while you study — camera vision, typing rhythm, voice check-ins, and a full academic workspace, all under one calm design.

## What's inside

### Wellness
- **Overview** — live wellness score aggregated from every signal
- **Vision** — webcam + MediaPipe FaceLandmarker, live posture, gaze, blink rate, jaw/brow tension. Frames never leave the browser
- **Typing** — live WPM, backspace ratio, cadence variance, hesitation score
- **Voice** — 30-second grounding call with speech-to-text (Web Speech API) and TTS
- **Signals** — rolling log of every whisper Anchor has spoken

### Study
- **Courses** — grades, GPA trend sparkline, exam countdowns
- **Assignments** — Kanban board with drag-and-drop status
- **Calendar** — week grid with lectures, study blocks, exams
- **Notes** — Markdown editor with tag search
- **Flashcards** — decks with a review flow that persists mastery
- **AI Tutor** — Socratic full-page chat, groundable on any note

### Community
- **Messages** — mock classmates, group threads, one-click Anchor summarization

### System
- **Focus Room** — pomodoro-style timer with a demo distraction blocker (visual only, everything reversible)
- **Parent view** — opt-in demo dashboard: study/focus hours, wellness trend, screen time, deadlines, weekly AI summary
- **Settings** — privacy toggles for every capability + JSON export

### Floating Assistant
A draggable, minimizable, expandable Anchor chip that lives on every page. Context-aware headers per route, persistent memory in `localStorage`, one-click suggestions, and full chat via NVIDIA-hosted Gemma.

### Landing
Minimal futuristic entry — Spline robot, falling silver "ANCHOR" letters, a Web Audio ambient pad (no assets), and a single **Enter Anchor** button.

## Stack

- **Next.js 14 App Router** + TypeScript
- **Tailwind CSS** + shadcn primitives
- **@mediapipe/tasks-vision** for FaceLandmarker
- **@splinetool/react-spline** for the 3D hero
- **Web Audio + Web Speech APIs** for ambient sound, TTS, and STT
- **NVIDIA-hosted Gemma** through a Next server route (`/api/call`) so the API key never touches the client

## Getting started

```bash
npm install
cp .env.local.example .env.local
# put your NVIDIA API key in .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment

```
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL=google/diffusiongemma-26b-a4b-it
```

Any OpenAI-compatible chat endpoint would work with minor changes in [app/api/call/route.ts](app/api/call/route.ts).

## Privacy

- Camera and microphone are **off by default**
- The camera feed is processed locally in the browser; only tiny numeric signals (posture score, blink rate, etc.) feed the wellness score
- The API proxy strips the key server-side; the browser never sees it
- Every capability has a toggle in **Settings**

## Demo notes

This is a demo. Assignments, calendar, courses, messages, and the Parent view use realistic mock data (`lib/mock-data.ts`). The distraction blocker in Focus Mode is visual only — nothing is actually blocked in the browser.

## License

MIT.
