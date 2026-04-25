const STORAGE_KEY = "leci-frequent-v1";
const MAX = 12;

type Store = {
  questions: string[];
  updatedAt: string;
};

function load(): Store {
  if (typeof window === "undefined") return { questions: [], updatedAt: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { questions: [], updatedAt: "" };
    const p = JSON.parse(raw) as Store;
    if (!Array.isArray(p.questions)) return { questions: [], updatedAt: "" };
    return { questions: p.questions.filter((q) => typeof q === "string"), updatedAt: p.updatedAt ?? "" };
  } catch {
    return { questions: [], updatedAt: "" };
  }
}

function save(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

/** Remember recent user questions (optional memory). */
export function recordLeciUserQuestion(text: string) {
  const q = text.trim();
  if (q.length < 4) return;
  const prev = load();
  const next = [q, ...prev.questions.filter((x) => x !== q)].slice(0, MAX);
  save({ questions: next, updatedAt: new Date().toISOString() });
}

export function readLeciFrequentQuestions(): string[] {
  return load().questions;
}
