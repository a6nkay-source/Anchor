import { courses } from "@/lib/mock-data";

export interface Concept {
  id: string;
  courseId: string;
  name: string;
  mastery: number; // 0-100
  status: "mastered" | "improving" | "weak";
  lastPracticed: string; // ISO
  recommendedMinutes: number;
}

const CONCEPT_SEEDS: Record<string, string[]> = {
  cs229: [
    "Gradient descent",
    "SGD variants",
    "Regularization",
    "Bias-variance",
    "Support vector machines",
    "Logistic regression",
    "Neural network intuition",
    "Backprop",
    "Softmax",
  ],
  math104: [
    "Sequences",
    "Cauchy criterion",
    "Compactness",
    "Uniform continuity",
    "Supremum & infimum",
    "Heine–Borel",
    "Metric spaces",
    "Continuity proofs",
  ],
  phil12: [
    "Attention economy",
    "Turkle on companionship",
    "Consent & surveillance",
    "Digital minimalism",
    "AI ethics frameworks",
    "Autonomy vs nudging",
  ],
  bio2a: [
    "DNA replication",
    "PCR",
    "Gel electrophoresis",
    "Transcription",
    "Translation",
    "Restriction enzymes",
    "CRISPR basics",
  ],
};

// Deterministic pseudo-mastery so it's stable across renders.
function seed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

let cache: Concept[] | null = null;

export function conceptsFor(courseId: string): Concept[] {
  return allConcepts().filter((c) => c.courseId === courseId);
}

export function allConcepts(): Concept[] {
  if (cache) return cache;
  const list: Concept[] = [];
  for (const c of courses) {
    const names = CONCEPT_SEEDS[c.id] ?? [];
    for (const [i, n] of names.entries()) {
      const m = Math.round(30 + seed(c.id + n) * 65);
      const daysAgo = Math.round(seed(n) * 20);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const status: Concept["status"] =
        m >= 80 ? "mastered" : m >= 55 ? "improving" : "weak";
      const recommendedMinutes = status === "weak" ? 25 : status === "improving" ? 15 : 8;
      list.push({
        id: `${c.id}:${i}`,
        courseId: c.id,
        name: n,
        mastery: m,
        status,
        lastPracticed: d.toISOString(),
        recommendedMinutes,
      });
    }
  }
  cache = list;
  return list;
}
