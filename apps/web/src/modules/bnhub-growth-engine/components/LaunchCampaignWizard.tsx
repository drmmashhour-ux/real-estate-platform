"use client";

import { useState } from "react";
import type { BnhubGrowthAutonomyLevel, BnhubGrowthCampaignObjective, BnhubGrowthCampaignType } from "@prisma/client";
import { g } from "./growth-ui-classes";

type ListingOpt = { id: string; title: string; city: string | null };

const AUTONOMY: BnhubGrowthAutonomyLevel[] = ["OFF", "ASSISTED", "SUPERVISED_AUTOPILOT", "FULL_AUTOPILOT"];

export function LaunchCampaignWizard({ listings }: { listings: ListingOpt[] }) {
  const [step, setStep] = useState(0);
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [autonomy, setAutonomy] = useState<BnhubGrowthAutonomyLevel>("ASSISTED");
  const [objective, setObjective] = useState<BnhubGrowthCampaignObjective>("BOOKING_CONVERSION");
  const [type, setType] = useState<BnhubGrowthCampaignType>("LISTING_PROMO");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const oneClick = async () => {
    if (!listingId) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/bnhub/host/growth/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          campaignName: `Autopilot ${new Date().toISOString().slice(0, 10)}`,
          campaignType: type,
          objective,
          autonomyLevel: "SUPERVISED_AUTOPILOT",
        }),
      });
      const j = (await r.json()) as { id?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      if (j.id) {
        await fetch(`/api/bnhub/host/growth/campaigns/${j.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generateAssets: true, launch: true }),
        });
        window.location.href = `/bnhub/host/growth/campaigns/${j.id}`;
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!listingId) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/bnhub/host/growth/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          campaignName: `Campaign ${new Date().toLocaleDateString()}`,
          campaignType: type,
          objective,
          autonomyLevel: autonomy,
        }),
      });
      const j = (await r.json()) as { id?: string; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      if (j.id) window.location.href = `/bnhub/host/growth/campaigns/${j.id}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={g.card}>
      <h2 className={g.title}>Launch campaign wizard</h2>
      <p className={g.sub}>
        Pick listing → objective → autonomy → create. External channels are labeled mock/pending until connectors are
        production-ready; internal channels are real placements on BNHub.
      </p>
      <div className="mt-4 flex gap-2 text-xs text-zinc-500">
        {["Listing", "Objective", "Autonomy", "Review"].map((l, i) => (
          <button
            key={l}
            type="button"
            className={step === i ? "text-amber-400" : ""}
            onClick={() => setStep(i)}
          >
            {i + 1}. {l}
          </button>
        ))}
      </div>
      {step === 0 ? (
        <select className={`${g.input} mt-3`} value={listingId} onChange={(e) => setListingId(e.target.value)}>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} · {l.city}
            </option>
          ))}
        </select>
      ) : null}
      {step === 1 ? (
        <div className="mt-3 space-y-2">
          <label className="text-xs text-zinc-500">Type</label>
          <select className={g.input} value={type} onChange={(e) => setType(e.target.value as BnhubGrowthCampaignType)}>
            <option value="LISTING_PROMO">Listing promo</option>
            <option value="LEAD_GEN">Lead gen</option>
            <option value="BOOKING_CONVERSION">Booking conversion</option>
          </select>
          <label className="text-xs text-zinc-500">Objective</label>
          <select
            className={g.input}
            value={objective}
            onChange={(e) => setObjective(e.target.value as BnhubGrowthCampaignObjective)}
          >
            <option value="TRAFFIC">Traffic</option>
            <option value="LEADS">Leads</option>
            <option value="BOOKING_CONVERSION">Booking conversion</option>
          </select>
        </div>
      ) : null}
      {step === 2 ? (
        <select
          className={`${g.input} mt-3`}
          value={autonomy}
          onChange={(e) => setAutonomy(e.target.value as BnhubGrowthAutonomyLevel)}
        >
          {AUTONOMY.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      ) : null}
      {step === 3 ? (
        <p className="mt-3 text-sm text-zinc-400">
          Internal homepage + search boost + email queue will be attempted on launch. Meta/Google/TikTok/WhatsApp show
          setup tasks until credentials exist.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={g.btnGhost} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Back
        </button>
        <button
          type="button"
          className={g.btnGhost}
          disabled={step >= 3}
          onClick={() => setStep((s) => Math.min(3, s + 1))}
        >
          Next
        </button>
        {step === 3 ? (
          <button type="button" className={g.btn} disabled={busy} onClick={() => void submit()}>
            {busy ? "…" : "Create draft"}
          </button>
        ) : null}
      </div>
      <div className="mt-6 border-t border-zinc-800 pt-4">
        <p className="text-xs text-zinc-500">One-click (supervised autopilot + generate + internal launch)</p>
        <button type="button" className={`${g.btn} mt-2`} disabled={busy || !listingId} onClick={() => void oneClick()}>
          {busy ? "…" : "One-click Autopilot"}
        </button>
      </div>
      {err ? <p className="mt-2 text-sm text-red-400">{err}</p> : null}
    </div>
  );
}
