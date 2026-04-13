"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = {
  documentType: string;
  version: string;
  mustAccept: boolean;
};

export function AcceptLegalForm({ statuses }: { statuses: Status[] }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allChecked = statuses.every((s) => accepted[s.documentType]);
  const canSubmit = allChecked && statuses.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/legal/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentTypes: statuses.map((s) => ({
            documentType: s.documentType,
            version: s.version,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to record acceptance");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {statuses.map((s) => (
        <label key={s.documentType} className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={accepted[s.documentType] ?? false}
            onChange={(e) =>
              setAccepted((prev) => ({ ...prev, [s.documentType]: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
          />
          <span className="text-slate-700">
            I have read and accept the {s.documentType.replace(/_/g, " ")} (version{" "}
            {s.version || "current"})
          </span>
        </label>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Accept and continue"}
      </button>
    </form>
  );
}
