"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Ref = { id: string; designUrl: string; title: string | null; createdAt: string };

export function SavedDesigns({ listingId }: { listingId: string }) {
  const [refs, setRefs] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/design-studio/references?listingId=${encodeURIComponent(listingId)}`, {
      credentials: "same-origin",
    })
      .then((res) => res.json())
      .then((data) => setRefs(data.references ?? []))
      .catch(() => setRefs([]))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) return null;
  if (refs.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Your saved design(s)</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Designs you created in Canva and saved to this listing. Open in Canva to edit or download.
      </p>
      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
        You will edit this design in your own Canva account. Your designs stay private.
      </p>
      <ul className="mt-4 space-y-2">
        {refs.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-2">
            <a
              href={r.designUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              {r.title || "Canva design"} →
            </a>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={`/design-templates?listingId=${encodeURIComponent(listingId)}`}
        className="mt-3 inline-block text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
      >
        Create another design →
      </Link>
    </div>
  );
}
