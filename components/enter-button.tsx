"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { primeSpeech } from "@/lib/speech";

export function EnterButton() {
  return (
    <Link
      href="/app"
      onClick={() => primeSpeech()}
      className="group mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-sm font-medium text-cyan-100 opacity-0 backdrop-blur transition-all hover:border-cyan-400/60 hover:bg-cyan-400/20"
      style={{ animation: "fade-up 1s ease 1.7s forwards" }}
    >
      Enter Anchor
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
