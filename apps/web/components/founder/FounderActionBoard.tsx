"use client";

import { useEffect, useState } from "react";

type ActionRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
};

export function FounderActionBoard() {
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/founder/actions", { credentials: "include" });
        const json = (await res.json()) as { actions?: ActionRow[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Erreur");
        setActions(json.actions ?? []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Erreur");
      }
    })();
  }, []);

  if (err) {
    return (
      <p className="text-sm text-zinc-500">
        Actions fondateur: {err} (activer <code className="text-amber-200/80">FEATURE_FOUNDER_ACTION_TRACKING_V1</code>)
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Actions suivies</h3>
      <ul className="mt-2 space-y-2 text-sm text-zinc-300">
        {actions.length === 0 && <li className="text-zinc-500">Aucune action enregistrée.</li>}
        {actions.map((a) => (
          <li key={a.id} className="flex justify-between gap-2 border-b border-zinc-800/80 pb-2">
            <span>{a.title}</span>
            <span className="text-xs text-zinc-500">
              {a.status} · {a.priority}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
