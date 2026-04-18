"use client";

import * as React from "react";

import { buildLeadConversationFlow } from "@/modules/growth/lead-conversation.service";
import { buildBrokerConversationFlow } from "@/modules/growth/broker-conversation.service";

const FLOW_LABELS = ["Lead", "Message", "Qualification", "Connection", "Broker", "Deal"] as const;

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-zinc-600 bg-zinc-800/80 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function recommendedForStage(
  index: number,
  city: string,
): { title: string; body: string; note?: string } {
  const lead = buildLeadConversationFlow(city);
  const broker = buildBrokerConversationFlow(city);
  switch (index) {
    case 0:
      return {
        title: "Lead",
        body: "New inbound — respond quickly with the Message step (instant script).",
      };
    case 1:
      return { title: "Message", body: lead[0].message };
    case 2:
      return { title: "Qualification", body: lead[1].message };
    case 3:
      return {
        title: "Connection",
        body: lead[3].message,
        note: `Engagement beat (before broker handoff): ${lead[2].message}`,
      };
    case 4:
      return { title: "Broker", body: broker[0].message };
    case 5:
      return { title: "Deal", body: lead[4].message };
    default:
      return { title: "", body: "" };
  }
}

export function DealConversationFlow({ defaultCity = "Montréal" }: { defaultCity?: string }) {
  const [city, setCity] = React.useState(defaultCity);
  const [current, setCurrent] = React.useState(0);
  const rec = React.useMemo(() => recommendedForStage(current, city), [current, city]);

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-4" data-growth-deal-conversation-flow>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Deal flow</p>
          <h3 className="mt-1 text-lg font-semibold text-zinc-100">Lead → … → Deal</h3>
          <p className="mt-1 max-w-xl text-[11px] text-zinc-500">
            Click a stage to highlight it. Recommended text is deterministic copy — paste manually.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          City
          <input
            className="w-44 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 text-xs text-zinc-500 md:text-sm">
        {FLOW_LABELS.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 ? <span className="text-zinc-600">→</span> : null}
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 font-medium ${
                current === i
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400/40"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
              onClick={() => setCurrent(i)}
            >
              {label}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Current stage</p>
        <p className="mt-1 text-sm font-semibold text-emerald-200/90">{FLOW_LABELS[current]}</p>
        <p className="mt-2 text-xs text-zinc-500">Recommended message</p>
        <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-300">{rec.body}</pre>
        {rec.note ? <p className="mt-2 text-xs text-zinc-500">{rec.note}</p> : null}
        <div className="mt-3">
          <CopyBtn text={rec.body} />
        </div>
      </div>
    </section>
  );
}
