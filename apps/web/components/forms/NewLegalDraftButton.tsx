"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewLegalDraftButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch("/api/legal-drafting/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateKey: "oaciq_promise_to_purchase_v1", language: "fr" }),
        });
        const data = await res.json();
        if (res.ok && data.draft?.id) {
          router.push(`/dashboard/forms/${data.draft.id}`);
        }
        setLoading(false);
      }}
      className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
    >
      {loading ? "Creating…" : "New draft (sample template)"}
    </button>
  );
}
