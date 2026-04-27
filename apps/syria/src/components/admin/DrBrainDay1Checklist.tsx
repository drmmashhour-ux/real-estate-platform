"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "syria_drbrain_day1_checklist_v1";

type ItemId =
  | "preflight"
  | "webhook"
  | "escrow"
  | "killSwitch"
  | "noCriticalTickets"
  | "dbHealthy"
  | "buildVersion";

const DEFAULT_IDS: ItemId[] = [
  "preflight",
  "webhook",
  "escrow",
  "killSwitch",
  "noCriticalTickets",
  "dbHealthy",
  "buildVersion",
];

type Props = {
  labels: Record<ItemId, string>;
  sectionTitle: string;
};

export function DrBrainDay1Checklist(props: Props) {
  const { labels, sectionTitle } = props;
  const [checked, setChecked] = useState<Partial<Record<ItemId, boolean>>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw) as Partial<Record<ItemId, boolean>>);
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(id: ItemId) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-950">
      <p className="font-semibold">{sectionTitle}</p>
      <ul className="mt-3 space-y-2">
        {DEFAULT_IDS.map((id) => (
          <li key={id} className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={Boolean(checked[id])}
              onChange={() => toggle(id)}
              aria-label={labels[id]}
            />
            <span>{labels[id]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-emerald-900">
        Stored in this browser only — never blocks deployments or DR.BRAIN checks.
      </p>
    </section>
  );
}
