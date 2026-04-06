"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bnhub_saved_listing_ids";

function readSaved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function writeSaved(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

async function logActivity(eventType: "listing_save", listingId: string) {
  await fetch("/api/ai/activity", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, listingId }),
  }).catch(() => {});
}

export function SaveListingButton({
  listingId,
  variant = "dark",
}: {
  listingId: string;
  variant?: "dark" | "light";
}) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [serverSync, setServerSync] = useState(false);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bnhub/favorites", { credentials: "same-origin" });
        if (!res.ok) {
          if (!cancelled) {
            setSaved(readSaved().has(listingId));
            setServerSync(false);
          }
          return;
        }
        const data = (await res.json()) as { listingIds?: string[] };
        const ids = Array.isArray(data.listingIds) ? data.listingIds : [];
        if (!cancelled) {
          setSaved(ids.includes(listingId));
          setServerSync(true);
        }
      } catch {
        if (!cancelled) {
          setSaved(readSaved().has(listingId));
          setServerSync(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const toggle = useCallback(async () => {
    const nextSaved = !saved;
    setSaved(nextSaved);

    if (serverSync) {
      try {
        const res = await fetch("/api/bnhub/favorites", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, favorited: nextSaved }),
        });
        if (!res.ok) {
          setSaved(!nextSaved);
        }
      } catch {
        setSaved(!nextSaved);
      }
      return;
    }

    const next = new Set(readSaved());
    if (nextSaved) {
      next.add(listingId);
      await logActivity("listing_save", listingId);
    } else {
      next.delete(listingId);
    }
    writeSaved(next);
  }, [listingId, saved, serverSync]);

  const shell =
    variant === "dark"
      ? saved
        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
        : "border-slate-600 bg-slate-800/80 text-slate-200 hover:border-slate-500"
      : saved
        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
        : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50";

  if (!mounted) {
    return (
      <span className="inline-flex h-10 min-w-[8rem] items-center justify-center rounded-xl border border-slate-700 px-3 text-sm opacity-0">
        Save
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${shell}`}
      aria-pressed={saved}
    >
      <svg className="h-4 w-4" fill={saved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {saved ? "Saved" : "Save listing"}
    </button>
  );
}
