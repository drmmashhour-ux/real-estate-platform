"use client";

import { useState } from "react";
import { handleObjection, type ObjectionKey } from "@/modules/gtm/objection-handler.service";

const KEYS: ObjectionKey[] = [
  "fees_too_high",
  "why_not_airbnb",
  "compliance_trust",
  "stripe_security",
  "need_guarantee",
];

export function ObjectionHelper() {
  const [key, setKey] = useState<ObjectionKey>("fees_too_high");
  const pack = handleObjection(key);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-200">
      <h2 className="text-lg font-semibold text-white">Objection helper</h2>
      <p className="mt-1 text-xs text-zinc-500">Factual framing — not a script to mislead.</p>
      <select
        className="mt-4 rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
        value={key}
        onChange={(e) => setKey(e.target.value as ObjectionKey)}
      >
        {KEYS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <p className="mt-4 font-medium text-amber-200/90">{pack.objection}</p>
      <ul className="mt-2 list-inside list-disc space-y-2 text-sm text-zinc-400">
        {pack.responses.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
