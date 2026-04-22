"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PortfolioDetailClient({ portfolioId }: { portfolioId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  return (
    <section className="flex flex-wrap gap-2 border-b pb-6">
      {err ?
        <p className="w-full text-sm text-destructive">{err}</p>
      : null}
      <button
        type="button"
        className="rounded border px-3 py-1 text-xs"
        onClick={async () => {
          setErr(null);
          const res = await fetch(`/api/portfolio/${portfolioId}/decisions`, { method: "POST" });
          if (!res.ok) setErr(await res.text());
          else router.refresh();
        }}
      >
        Refresh AI proposals
      </button>
      <button
        type="button"
        className="rounded border px-3 py-1 text-xs"
        onClick={async () => {
          setErr(null);
          const res = await fetch(`/api/portfolio/${portfolioId}/allocation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalBudget: 250000 }),
          });
          if (!res.ok) setErr(await res.text());
          else router.refresh();
        }}
      >
        Generate allocation ($250k demo)
      </button>
    </section>
  );
}
