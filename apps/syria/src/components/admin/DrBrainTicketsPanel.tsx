"use client";

import type { DrBrainTicket } from "@repo/drbrain";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  tickets: DrBrainTicket[];
  investorDemo: boolean;
  labels: {
    sectionTitle: string;
    ack: string;
    resolve: string;
    ignore: string;
    recommendedSummary: string;
    working: string;
    demoNotice: string;
    empty: string;
  };
};

export function DrBrainTicketsPanel(props: Props) {
  const { tickets, investorDemo, labels } = props;
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function postAction(ticketId: string, action: "ACKNOWLEDGE" | "RESOLVE" | "IGNORE") {
    if (investorDemo) return;
    setError(null);
    setBusyId(ticketId);
    try {
      const res = await fetch("/api/admin/drbrain/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || body.ok === false) {
        setError(body.message ?? "Ticket update failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Ticket update failed");
    } finally {
      setBusyId(null);
    }
  }

  const btn =
    "rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium hover:bg-stone-50 disabled:opacity-50";

  return (
    <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-stone-900">{labels.sectionTitle}</p>
      {investorDemo ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">{labels.demoNotice}</p>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}

      {tickets.length === 0 ? (
        <p className="text-sm text-stone-600">{labels.empty}</p>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border border-stone-100 bg-stone-50/80 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    t.severity === "CRITICAL"
                      ? "bg-red-100 text-red-900"
                      : t.severity === "WARNING"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-stone-200 text-stone-800"
                  }`}
                >
                  {t.severity}
                </span>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-900">{t.category}</span>
                <span className="text-xs text-stone-500">{new Date(t.createdAt).toISOString().slice(0, 16)} UTC</span>
              </div>
              <p className="mt-2 font-medium text-stone-900">{t.title}</p>
              <p className="mt-1 text-xs text-stone-700">{t.description}</p>
              <p className="mt-2 text-xs font-semibold text-stone-600">{labels.recommendedSummary}</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-stone-700">
                {(t.recommendedActions ?? []).slice(0, 4).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t.status}</span>
                {!investorDemo && (t.status === "OPEN" || t.status === "ACKNOWLEDGED") ? (
                  <>
                    <button
                      type="button"
                      className={btn}
                      disabled={busyId !== null}
                      onClick={() => postAction(t.id, "ACKNOWLEDGE")}
                    >
                      {busyId === t.id ? labels.working : labels.ack}
                    </button>
                    <button
                      type="button"
                      className={btn}
                      disabled={busyId !== null}
                      onClick={() => postAction(t.id, "RESOLVE")}
                    >
                      {labels.resolve}
                    </button>
                    <button
                      type="button"
                      className={btn}
                      disabled={busyId !== null}
                      onClick={() => postAction(t.id, "IGNORE")}
                    >
                      {labels.ignore}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
