// Realistic mock data for the demo. Enough breadth that every page
// feels lived-in without needing a backend.

export interface Course {
  id: string;
  code: string;
  title: string;
  color: string;
  professor: string;
  meetingTimes: string;
  currentGrade: number; // 0-100
  letterGrade: string;
  credits: number;
  nextExam?: { name: string; date: string };
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  due: string; // ISO
  status: "todo" | "doing" | "review" | "done";
  points: number;
  estMinutes: number;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  courseId?: string;
  start: string; // ISO
  durationMin: number;
  type: "lecture" | "study" | "exam" | "break" | "personal";
}

export interface Note {
  id: string;
  title: string;
  courseId?: string;
  updated: string; // ISO
  body: string; // markdown
  tags: string[];
}

export interface FlashcardDeck {
  id: string;
  title: string;
  courseId?: string;
  cards: { q: string; a: string }[];
  masteredPct: number; // 0-100
  lastReviewed?: string;
}

export interface Message {
  id: string;
  from: string;
  ts: string;
  body: string;
  self?: boolean;
}

export interface Thread {
  id: string;
  name: string;
  kind: "dm" | "group";
  avatarInitials: string;
  members?: string[];
  lastPreview: string;
  unread: number;
  messages: Message[];
}

export const courses: Course[] = [
  {
    id: "cs229",
    code: "CS 229",
    title: "Machine Learning",
    color: "#67e8f9",
    professor: "Prof. Chen",
    meetingTimes: "MWF 10:30–11:50",
    currentGrade: 87,
    letterGrade: "B+",
    credits: 4,
    nextExam: { name: "Midterm 2", date: "2026-07-14" },
  },
  {
    id: "math104",
    code: "MATH 104",
    title: "Real Analysis",
    color: "#a78bfa",
    professor: "Prof. Kaur",
    meetingTimes: "TTh 1:00–2:30",
    currentGrade: 79,
    letterGrade: "B",
    credits: 3,
    nextExam: { name: "Problem set defense", date: "2026-07-08" },
  },
  {
    id: "phil12",
    code: "PHIL 12",
    title: "Ethics & Technology",
    color: "#fda4af",
    professor: "Prof. Iqbal",
    meetingTimes: "MW 3:30–4:50",
    currentGrade: 92,
    letterGrade: "A-",
    credits: 3,
    nextExam: { name: "Final essay", date: "2026-08-02" },
  },
  {
    id: "bio2a",
    code: "BIO 2A",
    title: "Molecular Biology",
    color: "#86efac",
    professor: "Prof. Alvarez",
    meetingTimes: "MWF 9:00–9:50",
    currentGrade: 84,
    letterGrade: "B",
    credits: 4,
    nextExam: { name: "Lab report", date: "2026-07-10" },
  },
];

const now = new Date();
const inDays = (n: number, hour = 23, minute = 59) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const assignments: Assignment[] = [
  {
    id: "a1",
    courseId: "cs229",
    title: "Problem Set 4 — Gradient methods",
    due: inDays(2),
    status: "doing",
    points: 40,
    estMinutes: 180,
    notes: "Half done, blocked on 3b.",
  },
  {
    id: "a2",
    courseId: "math104",
    title: "Metric-space proofs writeup",
    due: inDays(4),
    status: "todo",
    points: 30,
    estMinutes: 150,
  },
  {
    id: "a3",
    courseId: "phil12",
    title: "Reading response: Turkle ch. 3",
    due: inDays(1),
    status: "review",
    points: 15,
    estMinutes: 60,
  },
  {
    id: "a4",
    courseId: "bio2a",
    title: "Lab 5: PCR gel analysis",
    due: inDays(3),
    status: "todo",
    points: 25,
    estMinutes: 120,
  },
  {
    id: "a5",
    courseId: "cs229",
    title: "Weekly journal — SVMs",
    due: inDays(0, 22),
    status: "todo",
    points: 10,
    estMinutes: 45,
  },
  {
    id: "a6",
    courseId: "phil12",
    title: "Discussion prep",
    due: inDays(-1),
    status: "done",
    points: 5,
    estMinutes: 30,
  },
  {
    id: "a7",
    courseId: "math104",
    title: "Study group — supremum bound",
    due: inDays(-2),
    status: "done",
    points: 0,
    estMinutes: 60,
  },
];

export const calendar: CalendarEvent[] = [
  { id: "e1", title: "CS 229 lecture", courseId: "cs229", start: inDays(0, 10, 30), durationMin: 80, type: "lecture" },
  { id: "e2", title: "MATH 104 lecture", courseId: "math104", start: inDays(0, 13, 0), durationMin: 90, type: "lecture" },
  { id: "e3", title: "Focus block — PSet 4", courseId: "cs229", start: inDays(0, 15, 30), durationMin: 90, type: "study" },
  { id: "e4", title: "Anchor break", start: inDays(0, 17, 0), durationMin: 15, type: "break" },
  { id: "e5", title: "PHIL 12 lecture", courseId: "phil12", start: inDays(1, 15, 30), durationMin: 80, type: "lecture" },
  { id: "e6", title: "Bio lab prep", courseId: "bio2a", start: inDays(1, 19, 0), durationMin: 60, type: "study" },
  { id: "e7", title: "CS 229 midterm 2", courseId: "cs229", start: inDays(3, 10, 30), durationMin: 90, type: "exam" },
  { id: "e8", title: "Reading response due", courseId: "phil12", start: inDays(1, 23, 0), durationMin: 15, type: "personal" },
  { id: "e9", title: "Study group — analysis", courseId: "math104", start: inDays(2, 19, 30), durationMin: 90, type: "study" },
];

export const notes: Note[] = [
  {
    id: "n1",
    courseId: "cs229",
    title: "Gradient descent — variants",
    tags: ["optimization", "week 6"],
    updated: inDays(0, 14),
    body: `# Gradient descent — variants\n\n**Vanilla GD:** step in the direction of −∇f. Sensitive to feature scale.\n\n**Momentum:** carry a velocity term v ← βv − η∇f. Escapes plateaus.\n\n**Adam:** adaptive per-parameter learning rate. Default first move for messy data.\n\n> Prof. Chen: "Adam is fast but noisy — don't trust it for the last mile."\n\n## Questions for office hours\n- Why does the projected-gradient trick blow up when the constraint set is unbounded?\n- Is Nesterov strictly better in convex problems?`,
  },
  {
    id: "n2",
    courseId: "math104",
    title: "Compactness in metric spaces",
    tags: ["proofs"],
    updated: inDays(-1, 21),
    body: `# Compactness\n\nA set K is compact iff every sequence in K has a convergent subsequence with limit in K.\n\n**Equivalence:** in metric spaces, sequential compactness ↔ compactness (Heine–Borel over ℝⁿ closed & bounded).\n\n- Continuous image of a compact set is compact.\n- Compact sets are complete and totally bounded.`,
  },
  {
    id: "n3",
    courseId: "phil12",
    title: "Turkle — alone together",
    tags: ["reading"],
    updated: inDays(-1, 15),
    body: `# Turkle ch. 3\n\nCore idea: intimacy without demands. We're drawn to entities that ask nothing back.\n\nCounterpoint: even one-sided companionship can be practice for the real kind.\n\nAnchor connection: how does a "quiet companion" avoid becoming the very thing Turkle warned about? By staying in the background and pointing you outward.`,
  },
  {
    id: "n4",
    title: "Ideas / random",
    tags: ["scratch"],
    updated: inDays(0, 8),
    body: `# random\n\n- try 25/5 pomodoro before the calc pset\n- ask about jaw tension in the vision demo\n- read Simone Weil quote from earlier today`,
  },
];

export const flashcards: FlashcardDeck[] = [
  {
    id: "d1",
    courseId: "cs229",
    title: "CS 229 — mid-term core",
    masteredPct: 62,
    lastReviewed: inDays(-1, 20),
    cards: [
      { q: "Define the bias-variance tradeoff in one sentence.", a: "Bias = error from wrong assumptions; variance = error from sensitivity to fluctuations in the training set." },
      { q: "What does the softmax function output?", a: "A probability distribution over K classes." },
      { q: "L2 vs L1 regularization — which is sparse?", a: "L1 encourages sparsity; L2 shrinks coefficients smoothly." },
      { q: "State the perceptron convergence guarantee.", a: "If the data is linearly separable, the perceptron converges in a finite number of updates." },
      { q: "When would you pick Adam over SGD?", a: "Noisy or sparse gradients, or when tuning lr per-parameter matters more than final accuracy." },
    ],
  },
  {
    id: "d2",
    courseId: "math104",
    title: "Analysis — definitions",
    masteredPct: 44,
    lastReviewed: inDays(-3, 19),
    cards: [
      { q: "Define a Cauchy sequence.", a: "For every ε>0 there exists N such that |x_n − x_m| < ε for all n,m ≥ N." },
      { q: "Define uniform continuity.", a: "For every ε>0 there exists δ>0 such that |f(x)−f(y)|<ε whenever |x−y|<δ, δ independent of the point." },
      { q: "State the Bolzano–Weierstrass theorem.", a: "Every bounded sequence in ℝⁿ has a convergent subsequence." },
    ],
  },
  {
    id: "d3",
    courseId: "bio2a",
    title: "Bio 2A — molecular vocab",
    masteredPct: 88,
    lastReviewed: inDays(0, 9),
    cards: [
      { q: "What does DNA polymerase do?", a: "Catalyzes 5′→3′ synthesis of a new DNA strand using a template." },
      { q: "Purpose of PCR?", a: "Amplify a target DNA region through repeated cycles of denaturation, annealing, and extension." },
    ],
  },
];

export const threads: Thread[] = [
  {
    id: "t1",
    name: "Priya",
    kind: "dm",
    avatarInitials: "PR",
    lastPreview: "did you finish 3b yet?",
    unread: 2,
    messages: [
      { id: "m1", from: "Priya", ts: inDays(0, 14), body: "3b is killing me lol" },
      { id: "m2", from: "Priya", ts: inDays(0, 14, 2), body: "did you finish 3b yet?" },
    ],
  },
  {
    id: "t2",
    name: "CS 229 study group",
    kind: "group",
    avatarInitials: "CS",
    members: ["You", "Priya", "Dev", "Zara"],
    lastPreview: "meeting still on for 7?",
    unread: 0,
    messages: [
      { id: "m3", from: "Zara", ts: inDays(0, 11), body: "reading ch. 6 tonight, anyone want to compare notes?" },
      { id: "m4", from: "Dev", ts: inDays(0, 12), body: "in — will share deck by 5" },
      { id: "m5", from: "You", ts: inDays(0, 12, 30), body: "same, i'll upload my anki export", self: true },
      { id: "m6", from: "Priya", ts: inDays(0, 13), body: "meeting still on for 7?" },
    ],
  },
  {
    id: "t3",
    name: "Prof. Chen",
    kind: "dm",
    avatarInitials: "TC",
    lastPreview: "office hours moved to 3pm Thursday",
    unread: 1,
    messages: [
      { id: "m7", from: "Prof. Chen", ts: inDays(-1, 17), body: "office hours moved to 3pm Thursday" },
    ],
  },
  {
    id: "t4",
    name: "Analysis crew",
    kind: "group",
    avatarInitials: "AN",
    members: ["You", "Milo", "Ren"],
    lastPreview: "supremum bound wrecked me",
    unread: 0,
    messages: [
      { id: "m8", from: "Ren", ts: inDays(-1, 20), body: "supremum bound wrecked me" },
      { id: "m9", from: "You", ts: inDays(-1, 21), body: "same. Kaur's hint about ε/2 helped tho", self: true },
    ],
  },
];

export const parentWeekly = {
  studyHours: [3.2, 4.1, 2.6, 5.0, 4.4, 1.8, 3.7], // Mon..Sun
  focusHours: [2.1, 3.2, 1.9, 4.1, 3.4, 1.0, 2.6],
  wellness: [72, 68, 61, 75, 79, 83, 81],
  screenTimeStudy: [58, 72, 44, 88, 76, 32, 61],
  assignmentsDone: 6,
  assignmentsTotal: 9,
  upcomingDeadlines: [
    { title: "CS 229 PSet 4", when: inDays(2) },
    { title: "MATH 104 writeup", when: inDays(4) },
    { title: "Bio lab report", when: inDays(3) },
  ],
  summary:
    "Aanya had a steady week — 24.8 study hours, mostly focused. Sleep looked short on Wednesday and her jaw tension spiked during CS 229 blocks. She's on track for CS 229 midterm 2 and slightly behind on MATH 104.",
};

export const gpa = {
  current: 3.58,
  trend: [3.42, 3.48, 3.51, 3.55, 3.58],
  target: 3.7,
};

export function humanDue(iso: string) {
  const d = new Date(iso);
  const diff = (d.getTime() - Date.now()) / 3600_000;
  if (diff < -24) return `overdue ${Math.abs(Math.round(diff / 24))}d`;
  if (diff < 0) return `overdue ${Math.abs(Math.round(diff))}h`;
  if (diff < 24) return `in ${Math.max(1, Math.round(diff))}h`;
  return `in ${Math.round(diff / 24)}d`;
}

export function courseById(id?: string) {
  return courses.find((c) => c.id === id);
}
