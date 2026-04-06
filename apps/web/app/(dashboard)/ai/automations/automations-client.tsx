"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOLD = "#D4AF37";

type Rule = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  frequency: string;
  lastRunAt: string | null;
};

export function AutomationsClient({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function runAll() {
    setRunning(true);
    await fetch("/api/ai/automations/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setRunning(false);
    router.refresh();
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch("/api/ai/automations/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        disabled={running}
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
        style={{ backgroundColor: GOLD }}
        onClick={() => void runAll()}
      >
        {running ? "Running…" : "Run all automations now"}
      </button>
      <ul className="space-y-3">
        {rules.map((r) => (
          <li key={r.id} className="rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{r.name}</p>
                <p className="text-xs text-white/45">{r.key} · {r.frequency}</p>
                {r.description ? <p className="mt-1 text-white/55">{r.description}</p> : null}
                <p className="mt-1 text-xs text-white/35">Last run: {r.lastRunAt ?? "—"}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={r.enabled}
                  onChange={(e) => void toggle(r.id, e.target.checked)}
                />
                Enabled
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
