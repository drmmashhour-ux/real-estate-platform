"use client";

import { useCallback, useEffect, useState } from "react";

type Category = "all" | "product" | "growth" | "financials" | "competition" | "strategy";
type Difficulty = "all" | "easy" | "medium" | "hard";

type Row = {
  id: string;
  question: string;
  answer: string;
  category: "product" | "growth" | "financials" | "competition" | "strategy";
  difficulty: "easy" | "medium" | "hard";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const CAT_LABEL: Record<Exclude<Category, "all">, string> = {
  product: "Product",
  growth: "Growth",
  financials: "Financials",
  competition: "Competition",
  strategy: "Strategy",
};

const DIFF_LABEL: Record<Exclude<Difficulty, "all">, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function AdminInvestorQAPanel() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [draft, setDraft] = useState<Partial<Row> | null>(null);

  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      if (category !== "all") params.set("category", category);
      if (difficulty !== "all") params.set("difficulty", difficulty);
      const res = await fetch(`/api/admin/investor-qa?${params.toString()}`);
      const j = (await res.json()) as { items?: Row[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? "Load failed");
      const raw = Array.isArray(j.items) ? j.items : [];
      setItems(
        raw.map((r) => ({
          ...r,
          difficulty: (r as Row).difficulty ?? "medium",
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, category, difficulty]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveEdit() {
    if (!draft?.id) return;
    setSaving(draft.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/investor-qa/${encodeURIComponent(draft.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: draft.question,
          answer: draft.answer,
          category: draft.category,
          difficulty: draft.difficulty,
          sortOrder: draft.sortOrder,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setDraft(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this Q&A?")) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/investor-qa/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDraft(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(null);
    }
  }

  const [newRow, setNewRow] = useState({
    question: "",
    answer: "",
    category: "strategy" as Row["category"],
    difficulty: "medium" as Row["difficulty"],
  });

  async function addNew() {
    if (!newRow.question.trim() || !newRow.answer.trim()) {
      setError("Question and answer required");
      return;
    }
    setSaving("new");
    setError(null);
    try {
      const res = await fetch("/api/admin/investor-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRow),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Add failed");
      setNewRow({ question: "", answer: "", category: "strategy", difficulty: "medium" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search questions or answers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-amber-900/40 bg-black px-3 py-2 text-sm text-amber-50 placeholder:text-zinc-600"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="rounded-lg border border-amber-900/40 bg-black px-3 py-2 text-sm text-amber-100"
        >
          <option value="all">All categories</option>
          {(Object.keys(CAT_LABEL) as Exclude<Category, "all">[]).map((c) => (
            <option key={c} value={c}>
              {CAT_LABEL[c]}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="rounded-lg border border-amber-900/40 bg-black px-3 py-2 text-sm text-amber-100"
        >
          <option value="all">All difficulty</option>
          {(Object.keys(DIFF_LABEL) as Exclude<Difficulty, "all">[]).map((d) => (
            <option key={d} value={d}>
              {DIFF_LABEL[d]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-amber-700/40 px-3 py-2 text-sm text-amber-200/90 hover:bg-amber-950/40"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="rounded-xl border border-amber-500/20 bg-zinc-950/60 p-4">
        <h3 className="text-sm font-semibold text-amber-200">Add question</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select
            value={newRow.category}
            onChange={(e) => setNewRow((s) => ({ ...s, category: e.target.value as Row["category"] }))}
            className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-amber-50"
          >
            {(Object.keys(CAT_LABEL) as Exclude<Category, "all">[]).map((c) => (
              <option key={c} value={c}>
                {CAT_LABEL[c]}
              </option>
            ))}
          </select>
          <select
            value={newRow.difficulty}
            onChange={(e) => setNewRow((s) => ({ ...s, difficulty: e.target.value as Row["difficulty"] }))}
            className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-amber-50"
          >
            {(Object.keys(DIFF_LABEL) as Exclude<Difficulty, "all">[]).map((d) => (
              <option key={d} value={d}>
                {DIFF_LABEL[d]}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 grid gap-3">
          <input
            className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-amber-50"
            placeholder="Question"
            value={newRow.question}
            onChange={(e) => setNewRow((s) => ({ ...s, question: e.target.value }))}
          />
          <textarea
            className="min-h-[100px] rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300"
            placeholder="Answer"
            value={newRow.answer}
            onChange={(e) => setNewRow((s) => ({ ...s, answer: e.target.value }))}
          />
          <button
            type="button"
            disabled={saving === "new"}
            onClick={() => void addNew()}
            className="w-fit rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {saving === "new" ? "Saving…" : "Add"}
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

      <ul className="space-y-4">
        {items.map((row) => (
          <li key={row.id} className="rounded-xl border border-zinc-800/80 bg-black/50 p-4">
            {draft?.id === row.id ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, category: e.target.value as Row["category"] } : d))
                    }
                    className="rounded-lg border border-zinc-800 bg-black px-2 py-1 text-sm text-amber-50"
                  >
                    {(Object.keys(CAT_LABEL) as Exclude<Category, "all">[]).map((c) => (
                      <option key={c} value={c}>
                        {CAT_LABEL[c]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={draft.difficulty ?? "medium"}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, difficulty: e.target.value as Row["difficulty"] } : d))
                    }
                    className="rounded-lg border border-zinc-800 bg-black px-2 py-1 text-sm text-amber-50"
                  >
                    {(Object.keys(DIFF_LABEL) as Exclude<Difficulty, "all">[]).map((d) => (
                      <option key={d} value={d}>
                        {DIFF_LABEL[d]}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm font-medium text-amber-50"
                  value={draft.question}
                  onChange={(e) => setDraft((d) => (d ? { ...d, question: e.target.value } : d))}
                />
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-300"
                  value={draft.answer}
                  onChange={(e) => setDraft((d) => (d ? { ...d, answer: e.target.value } : d))}
                />
                <input
                  type="number"
                  className="w-28 rounded-lg border border-zinc-800 bg-black px-2 py-1 text-sm text-amber-50"
                  title="Sort order"
                  value={draft.sortOrder ?? 0}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, sortOrder: parseInt(e.target.value, 10) || 0 } : d))
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving === row.id}
                    onClick={() => void saveEdit()}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Save
                  </button>
                  <button type="button" onClick={() => setDraft(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-200/90">
                      {CAT_LABEL[row.category]}
                    </span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
                      {DIFF_LABEL[row.difficulty]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft({ ...row })}
                      className="text-xs text-amber-400/90 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(row.id)}
                      className="text-xs text-red-400/90 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 font-medium text-amber-50">{row.question}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{row.answer}</p>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
