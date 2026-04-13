"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { HubTheme } from "@/lib/hub/themes";

type FavItem = { projectId: string; project?: { id: string; name: string; city: string; startingPrice: number } };

export function FavoritesClient({ theme }: { theme: HubTheme }) {
  const [list, setList] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects/favorites", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
        Loading favorites…
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
        <p className="text-slate-400">No favorite projects yet.</p>
        <Link href="/projects" className="mt-4 inline-block text-teal-400 hover:underline">
          Explore projects →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((fav) => {
        const p = fav.project;
        const id = fav.projectId;
        return (
          <Link
            key={id}
            href={`/projects/${id}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-teal-500/30 hover:bg-white/[0.06]"
          >
            <h3 className="font-semibold text-white">{p?.name ?? "Project"}</h3>
            <p className="mt-1 text-sm text-slate-400">{p?.city ?? ""}</p>
            {p?.startingPrice != null && (
              <p className="mt-2 text-sm font-medium text-teal-400">
                From ${p.startingPrice >= 1000 ? `${(p.startingPrice / 1000).toFixed(0)}k` : p.startingPrice.toLocaleString()}
              </p>
            )}
            <span className="mt-4 inline-block text-sm text-teal-400">View project →</span>
          </Link>
        );
      })}
    </div>
  );
}
