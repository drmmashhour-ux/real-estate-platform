"use client";

import { useState } from "react";
import Link from "next/link";
import { SellerPlansMatrix } from "./seller-plans-matrix";
import type { PropertySegmentTab } from "./list-your-property-types";

export function ListYourPropertyPlansLeadsBundle() {
  const [segment, setSegment] = useState<PropertySegmentTab>("residential");

  return (
    <>
      <SellerPlansMatrix segment={segment} onSegmentChange={setSegment} />
      <LeadsHubCaptureForm propertySegment={segment} />
    </>
  );
}

function LeadsHubCaptureForm({ propertySegment }: { propertySegment: PropertySegmentTab }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [brokerRoute, setBrokerRoute] = useState<"real_estate" | "mortgage" | "both">("real_estate");
  const [leadUrgency, setLeadUrgency] = useState<"hot" | "mid" | "long_term">("mid");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setStatus("err");
      setMsg("Confirm consent to save your lead.");
      return;
    }
    setLoading(true);
    setStatus("idle");
    setMsg("");
    try {
      const res = await fetch("/api/lecipm/leads/hub-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          phone: phone.trim() || null,
          city: city.trim() || null,
          brokerRoute,
          leadUrgency,
          propertySegment,
          consent: true as const,
          sourcePage: "list_your_property",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setStatus("err");
        setMsg(typeof data.error === "string" ? data.error : "Could not save.");
        return;
      }
      setStatus("ok");
      setMsg(
        "Saved to Leads Hub. Mortgage-tagged requests route to platform mortgage experts first; real-estate desk tags follow your selection."
      );
      setEmail("");
      setName("");
      setPhone("");
      setCity("");
    } catch {
      setStatus("err");
      setMsg("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-premium-gold/45 focus:outline-none focus:ring-2 focus:ring-premium-gold/20";
  const label = "block text-xs font-medium text-slate-400";

  return (
    <section className="mt-16 scroll-mt-24 rounded-2xl border border-premium-gold/20 bg-gradient-to-br from-premium-gold/[0.06] to-black/40 p-6 sm:p-8">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold/85">Leads Hub</p>
        <h2 className="mt-2 font-serif text-xl font-semibold text-white sm:text-2xl">Stay on our radar</h2>
        <p className="mt-2 text-sm text-slate-400">
          Every visitor can be routed: <span className="text-slate-300">real-estate broker</span>,{" "}
          <span className="text-slate-300">mortgage desk</span> (platform experts first), or both — with{" "}
          <span className="text-slate-300">hot / mid / long-term</span> priority for ops.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Property segment for this row: <span className="text-slate-400">{propertySegment}</span> (match tabs above).
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className={label}>Work email *</label>
            <input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Name</label>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>City / region</label>
            <input className={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Montréal" />
          </div>
          <div>
            <label className={label}>Broker desk interest</label>
            <select
              className={`${input} bg-black/60`}
              value={brokerRoute}
              onChange={(e) => setBrokerRoute(e.target.value as typeof brokerRoute)}
            >
              <option value="real_estate">Real estate (listing / sale)</option>
              <option value="mortgage">Mortgage & financing (platform experts first)</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={label}>When do you need help?</label>
            <select
              className={`${input} bg-black/60`}
              value={leadUrgency}
              onChange={(e) => setLeadUrgency(e.target.value as typeof leadUrgency)}
            >
              <option value="hot">Hot — under ~1 month</option>
              <option value="mid">Mid — 1–3 months</option>
              <option value="long_term">Long-term — 6+ months</option>
            </select>
          </div>
          <label className="flex items-start gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-white/30 bg-black/50 text-premium-gold"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>I agree to be contacted about services matching my selections. I understand this is not legal advice.</span>
          </label>
          {status === "err" ? <p className="text-sm text-red-400">{msg}</p> : null}
          {status === "ok" ? <p className="text-sm text-emerald-400/95">{msg}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-premium-gold px-4 py-3 text-sm font-semibold text-black shadow-lg hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save to Leads Hub"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Ops view:{" "}
          <Link href="/admin/growth/pipeline" className="text-premium-gold hover:underline">
            Growth pipeline
          </Link>
        </p>
      </div>
    </section>
  );
}
