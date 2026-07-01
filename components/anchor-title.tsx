"use client";

import { cn } from "@/lib/utils";

const LETTERS = ["A", "N", "C", "H", "O", "R"];

export function AnchorTitle({ className }: { className?: string }) {
  return (
    <div className={cn("flex select-none items-baseline", className)}>
      {LETTERS.map((ch, i) => (
        <span
          key={i}
          className="inline-block bg-gradient-to-b from-neutral-50 to-neutral-500 bg-clip-text text-transparent"
          style={{
            fontSize: "clamp(4rem, 14vw, 12rem)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            transform: "translateY(-140%)",
            opacity: 0,
            animation: `anchor-drop 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) forwards`,
            animationDelay: `${i * 0.12 + 0.2}s`,
          }}
        >
          {ch}
        </span>
      ))}
      <style>{`
        @keyframes anchor-drop {
          0% { transform: translateY(-140%); opacity: 0; filter: blur(8px); }
          60% { opacity: 1; filter: blur(0); }
          78% { transform: translateY(8%); }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
