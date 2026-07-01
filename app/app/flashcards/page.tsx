"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { flashcards as seed, courseById, type FlashcardDeck } from "@/lib/mock-data";
import { Layers, RotateCcw, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>(seed);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);

  const activeDeck = decks.find((d) => d.id === activeId);
  const card = activeDeck?.cards[i];

  const next = (gotIt: boolean) => {
    if (!activeDeck || !card) return;
    if (gotIt) setCorrect((c) => c + 1);
    if (i + 1 < activeDeck.cards.length) {
      setI(i + 1);
      setFlipped(false);
    } else {
      // finish deck — bump masteredPct a bit
      const pct = Math.min(
        100,
        Math.round(activeDeck.masteredPct + ((correct + (gotIt ? 1 : 0)) / activeDeck.cards.length) * 15)
      );
      setDecks((all) =>
        all.map((d) =>
          d.id === activeDeck.id
            ? {
                ...d,
                masteredPct: pct,
                lastReviewed: new Date().toISOString(),
              }
            : d
        )
      );
      setActiveId(null);
      setI(0);
      setFlipped(false);
      setCorrect(0);
    }
  };

  if (activeDeck && card) {
    const pct = (i / activeDeck.cards.length) * 100;
    return (
      <div>
        <PageHeader
          eyebrow={`Reviewing ${activeDeck.title}`}
          title={`Card ${i + 1} of ${activeDeck.cards.length}`}
          actions={
            <button
              onClick={() => {
                setActiveId(null);
                setI(0);
                setFlipped(false);
                setCorrect(0);
              }}
              className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:border-rose-400/40 hover:text-rose-200"
            >
              End review
            </button>
          }
        />

        <div className="mx-auto max-w-2xl">
          <div className="mb-4 h-1 overflow-hidden rounded-full bg-neutral-900">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <Card
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[280px] cursor-pointer items-center justify-center bg-neutral-950/60 p-10 text-center transition-transform hover:scale-[1.01]"
          >
            <div>
              <span className="mb-3 block text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                {flipped ? "answer" : "prompt"}
              </span>
              <p className="text-xl leading-relaxed text-neutral-100">
                {flipped ? card.a : card.q}
              </p>
              {!flipped && (
                <p className="mt-6 text-xs text-neutral-500">tap to reveal</p>
              )}
            </div>
          </Card>

          {flipped && (
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => next(false)}
                className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-400/10 px-5 py-2 text-sm text-rose-200 hover:border-rose-400/60"
              >
                <X className="h-4 w-4" /> Still learning
              </button>
              <button
                onClick={() => next(true)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
              >
                <Check className="h-4 w-4" /> Got it
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Flashcards."
        subtitle="Drill decks on your own or ask the Tutor to quiz you."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {decks.map((d) => {
          const course = courseById(d.courseId);
          return (
            <Card
              key={d.id}
              className="group flex flex-col justify-between bg-neutral-950/60 p-6 transition-colors hover:border-cyan-400/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20">
                    <Layers className="h-4 w-4 text-cyan-300" />
                  </div>
                  {course && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: `${course.color}22`,
                        color: course.color,
                      }}
                    >
                      {course.code}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-medium text-neutral-100">
                  {d.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  {d.cards.length} cards
                  {d.lastReviewed && (
                    <>
                      {" · "}
                      last reviewed{" "}
                      {new Date(d.lastReviewed).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </>
                  )}
                </p>
              </div>

              <div className="mt-6">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">mastery</span>
                  <span className="tabular-nums text-neutral-500">
                    {d.masteredPct}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                    style={{ width: `${d.masteredPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    setActiveId(d.id);
                    setI(0);
                    setFlipped(false);
                    setCorrect(0);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Start
                </button>
                <button
                  onClick={() =>
                    setDecks((all) =>
                      all.map((x) =>
                        x.id === d.id ? { ...x, masteredPct: 0 } : x
                      )
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:border-rose-400/40 hover:text-rose-200"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
