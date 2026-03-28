"use client";

import { useCallback, useEffect, useState } from "react";

type Entry = {
  id: string;
  locale: string;
  word: string;
  kind: string;
  createdAt: string;
};

export function SpellDictionaryAdminClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [word, setWord] = useState("");
  const [locale, setLocale] = useState<"en" | "fr" | "both">("both");
  const [kind, setKind] = useState<"allow" | "ignore">("allow");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/spell-dictionary");
    const data = (await res.json()) as { entries?: Entry[] };
    if (Array.isArray(data.entries)) setEntries(data.entries);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/spell-dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, locale, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setWord("");
      setMsg("Saved.");
      await refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/spell-dictionary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMsg("Delete failed");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Spell dictionary</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
          Add brand names, streets, or legal terms so they aren&apos;t flagged. <strong className="text-premium-gold">Allow</strong> and{" "}
          <strong className="text-premium-gold">Ignore</strong> behave the same (word is never marked wrong). Use locale{" "}
          <code className="text-premium-gold">both</code> for English and French checks.
        </p>
      </div>

      <form onSubmit={addWord} className="max-w-xl space-y-4 rounded-2xl border border-premium-gold/25 bg-[#121212] p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#B3B3B3]">Word or phrase</label>
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white placeholder:text-[#B3B3B3]/50"
            placeholder="e.g. Mont-Royal, FSBO"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#B3B3B3]">Locale</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "fr" | "both")}
              className="w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
            >
              <option value="both">Both EN + FR</option>
              <option value="en">English only</option>
              <option value="fr">French only</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#B3B3B3]">Kind</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "allow" | "ignore")}
              className="w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2 text-sm text-white"
            >
              <option value="allow">Allow (valid word)</option>
              <option value="ignore">Ignore (same)</option>
            </select>
          </div>
        </div>
        {msg ? <p className="text-sm text-premium-gold">{msg}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-premium-gold px-5 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {loading ? "Saving…" : "Add to dictionary"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead>
            <tr className="text-left text-[#B3B3B3]">
              <th className="px-4 py-3 font-medium">Word</th>
              <th className="px-4 py-3 font-medium">Locale</th>
              <th className="px-4 py-3 font-medium">Kind</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-[#E5E5E5]">
            {entries.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-medium text-white">{r.word}</td>
                <td className="px-4 py-2">{r.locale}</td>
                <td className="px-4 py-2">{r.kind}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => void remove(r.id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? <p className="p-6 text-sm text-[#B3B3B3]">No custom entries yet.</p> : null}
      </div>
    </div>
  );
}
