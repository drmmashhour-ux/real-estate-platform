"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  LAUNCH_CALL_SCRIPT,
  LAUNCH_CLOSING_SCRIPT,
  LAUNCH_DM_FIRST_CONTACT,
  LAUNCH_DM_FOLLOW_UP,
  LAUNCH_DM_URGENCY,
  LAUNCH_FOLLOW_UP_SEQUENCE,
  personalizeLaunchTemplate,
} from "@/lib/launch/sales-scripts";

const GOLD = "var(--color-premium-gold)";
const CARD = "#121212";

function CopyBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <div className="rounded-2xl border border-white/10 p-4" style={{ background: CARD }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-black"
          style={{ background: GOLD }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#D1D5DB]">{text}</p>
    </div>
  );
}

function SectionHeader({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="border-b border-premium-gold/25 pb-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-premium-gold">
        Part {n}
      </p>
      <h2 className="mt-1 text-xl font-bold text-white">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-[#737373]">{hint}</p> : null}
    </div>
  );
}

export function SalesScriptsClient() {
  const [previewCity, setPreviewCity] = useState("Montreal");
  const [previewName, setPreviewName] = useState("Sam");

  const dm1 = personalizeLaunchTemplate(LAUNCH_DM_FIRST_CONTACT, {
    city: previewCity,
    name: previewName,
  });

  return (
    <div className="space-y-12">
      <div className="rounded-2xl border border-premium-gold/30 bg-gradient-to-br from-[#1a1508] to-[#0B0B0B] p-5">
        <p className="text-xs font-semibold text-premium-gold">
          Launch + sales system · same copy powers{" "}
          <Link href="/dashboard/leads" className="underline hover:text-white">
            CRM → Leads
          </Link>{" "}
          and lead detail DMs.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link href="/dashboard/admin/daily" className="rounded-lg border border-white/20 px-3 py-2 text-premium-gold hover:bg-white/5">
            Daily action →
          </Link>
          <Link href="/dashboard/admin/content" className="rounded-lg border border-white/20 px-3 py-2 text-[#B3B3B3] hover:bg-white/5">
            Content &amp; traffic →
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeader
          n={1}
          title="DM scripts"
          hint="High-conversion templates — personalize city & first name for DM #1."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[#9CA3AF]">
            Sample first name
            <input
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white"
            />
          </label>
          <label className="text-xs text-[#9CA3AF]">
            City
            <input
              value={previewCity}
              onChange={(e) => setPreviewCity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <div className="mt-4 space-y-4">
          <CopyBlock title="DM #1 — First contact" text={dm1} />
          <CopyBlock title="DM #2 — Follow-up" text={LAUNCH_DM_FOLLOW_UP} />
          <CopyBlock title="DM #3 — Urgency" text={LAUNCH_DM_URGENCY} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader n={2} title="Call scripts" hint="Structured flow: intro → needs → value → close." />
        <div className="mt-4 space-y-4">
          <CopyBlock title="1. Introduction" text={LAUNCH_CALL_SCRIPT.intro} />
          <div className="rounded-2xl border border-white/10 p-4" style={{ background: CARD }}>
            <h3 className="text-sm font-bold text-white">2. Needs</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-[#D1D5DB]">
              {LAUNCH_CALL_SCRIPT.needs.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <CopyBlock title="3. Value" text={LAUNCH_CALL_SCRIPT.value} />
          <CopyBlock title="4. Close" text={LAUNCH_CALL_SCRIPT.close} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader n={3} title="Closing scripts" hint="Use after rapport and needs are clear." />
        <div className="mt-4">
          <CopyBlock title="Close" text={LAUNCH_CLOSING_SCRIPT} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          n={4}
          title="Follow-up scripts"
          hint="Day 1 / 3 / 7 rhythm — pair with reminders in Daily dashboard."
        />
        <div className="mt-4 space-y-4">
          {LAUNCH_FOLLOW_UP_SEQUENCE.map((step) => (
            <CopyBlock key={step.day} title={step.label} text={step.body} />
          ))}
        </div>
      </section>
    </div>
  );
}
