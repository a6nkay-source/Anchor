import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { AnchorTitle } from "@/components/anchor-title";
import { AmbientAudio } from "@/components/ambient-audio";

export default function Landing() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      <Spotlight
        className="left-1/2 top-0 -translate-x-1/2"
        fill="hsl(188 90% 70%)"
      />

      {/* corner nav */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between p-6">
        <span className="text-xs uppercase tracking-[0.24em] text-neutral-500">
          ANCHOR · 001
        </span>
        <AmbientAudio autostart />
      </div>

      {/* Spline scene as full-bleed background */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="h-full w-full"
        />
        {/* fade the model into the darkness at the edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* Content overlay */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-between p-6 pt-24 md:pt-32">
        <div className="flex flex-1 flex-col items-center justify-start gap-10 text-center">
          <AnchorTitle />

          <p
            className="max-w-md text-sm leading-relaxed text-neutral-400 opacity-0 md:text-base"
            style={{ animation: "fade-up 1s ease 1.4s forwards" }}
          >
            A quiet companion for the small tells your body gives away.
            <br />
            It watches, gently. It never judges.
          </p>

          <Link
            href="/app"
            className="group mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-sm font-medium text-cyan-100 opacity-0 backdrop-blur transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
            style={{ animation: "fade-up 1s ease 1.7s forwards" }}
          >
            Enter Anchor
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div
          className="pb-4 text-[10px] uppercase tracking-[0.3em] text-neutral-600 opacity-0"
          style={{ animation: "fade-up 1s ease 2.1s forwards" }}
        >
          be kind to yourself · not a medical device
        </div>
      </div>

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
