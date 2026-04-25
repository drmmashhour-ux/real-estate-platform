"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

const MARKETS = [
  { id: "montreal", label: "Greater Montréal" },
  { id: "quebec", label: "Québec City" },
  { id: "gatineau", label: "Gatineau / Outaouais" },
  { id: "sherbrooke", label: "Sherbrooke" },
  { id: "trois-rivieres", label: "Trois-Rivières" },
  { id: "other", label: "Other / multi-market" },
];

const SPECS = [
  { id: "condo", label: "Condo" },
  { id: "rental", label: "Rental" },
  { id: "luxury", label: "Luxury" },
  { id: "investment", label: "Investment" },
  { id: "new_construction", label: "New construction" },
  { id: "commercial", label: "Commercial" },
];

type Props = {
  locale: string;
  country: string;
  initialName?: string | null;
  initialPhone?: string | null;
};

export function BrokerAcquisitionOnboarding({ locale, country, initialName, initialPhone }: Props) {
  const router = useRouter();
  const base = `/${locale}/${country}`;
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(initialName?.trim() ?? "");
  const [phone, setPhone] = useState(initialPhone?.trim() ?? "");
  const [markets, setMarkets] = useState<string[]>([]);
  const [specs, setSpecs] = useState<string[]>([]);
  const [seekLeads, setSeekLeads] = useState(true);
  const [seekDeals, setSeekDeals] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (id: string, list: string[], set: (v: string[]) => void) => {
    if (list.includes(id)) set(list.filter((x) => x !== id));
    else set([...list, id]);
  };

  const savePartial = useCallback(async (complete: boolean) => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding/broker-profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          phone: phone.trim() || null,
          markets: markets.length ? markets : undefined,
          specializations: specs,
          goals: { seekLeads, seekDeals },
          complete,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Save failed");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      throw e;
    } finally {
      setSaving(false);
    }
  }, [displayName, phone, markets, specs, seekLeads, seekDeals]);

  async function next() {
    if (step === 0 && !displayName.trim()) {
      setErr("Add your name or team name.");
      return;
    }
    if (step === 1 && markets.length === 0) {
      setErr("Pick at least one market.");
      return;
    }
    if (step === 2 && specs.length === 0) {
      setErr("Pick at least one specialization.");
      return;
    }
    setErr(null);
    try {
      if (step < 3) {
        await savePartial(false);
        setStep((s) => s + 1);
      } else {
        await savePartial(true);
        router.push(`${base}/onboarding/broker/first-value`);
        router.refresh();
      }
    } catch {
      /* err set */
    }
  }

  function back() {
    setErr(null);
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 text-white">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-gold" : "bg-white/15"}`}
            aria-hidden
          />
        ))}
      </div>
      <div>
        <h2 className="font-serif text-xl font-semibold">
          {step === 0 && "Basic info"}
          {step === 1 && "Markets"}
          {step === 2 && "Specialization"}
          {step === 3 && "Goals"}
        </h2>
        <p className="mt-2 text-sm text-white/65">
          {step === 0 && "How should we address you in the CRM?"}
          {step === 1 && "Where do you mainly work?"}
          {step === 2 && "What do you focus on? (pick all that apply)"}
          {step === 3 && "What do you want from LECIPM in the next 90 days?"}
        </p>
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="text-white/70">Name or team</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-gold/50"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            <span className="text-white/70">Phone</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-brand-gold/50"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {MARKETS.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => toggle(m.id, markets, setMarkets)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  markets.includes(m.id) ? "border-brand-gold bg-brand-gold/15" : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 2 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {SPECS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => toggle(s.id, specs, setSpecs)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  specs.includes(s.id) ? "border-brand-gold bg-brand-gold/15" : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 text-sm">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <input type="checkbox" checked={seekLeads} onChange={() => setSeekLeads((v) => !v)} className="h-4 w-4" />
            <span>More qualified leads</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <input type="checkbox" checked={seekDeals} onChange={() => setSeekDeals((v) => !v)} className="h-4 w-4" />
            <span>Close more deals, faster</span>
          </label>
        </div>
      ) : null}

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-medium text-white/85 hover:bg-white/10"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          disabled={saving}
          onClick={() => void next()}
          className="rounded-xl bg-brand-gold px-6 py-3 text-sm font-semibold text-black hover:bg-brand-gold/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : step === 3 ? "Finish" : "Continue"}
        </button>
      </div>
    </div>
  );
}
