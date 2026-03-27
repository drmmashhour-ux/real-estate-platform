"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { g } from "@/src/modules/bnhub-growth-engine/components/growth-ui-classes";

export default function Page() {
  const [leads, setLeads] = useState<
    { id: string; fullName: string | null; email: string | null; leadScore: number; leadTemperature: string }[]
  >([]);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/bnhub/host/growth/leads");
      const j = (await r.json()) as { leads: typeof leads };
      if (r.ok) setLeads(j.leads);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <Link href="/bnhub/host/growth" className="text-sm text-amber-400">
        ← Growth home
      </Link>
      <h1 className="text-2xl font-bold text-white">Your leads</h1>
      <ul className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
        {leads.map((l) => (
          <li key={l.id} className={`${g.card} border-0`}>
            <p className="font-medium text-white">{l.fullName ?? "—"}</p>
            <p className="text-sm text-zinc-500">{l.email}</p>
            <p className="text-xs text-amber-400">
              {l.leadTemperature} · {l.leadScore}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
