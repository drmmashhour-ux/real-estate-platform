"use client";

import { useCallback, useEffect, useState } from "react";

type ListingOpt = { id: string; listingCode: string; title: string };

type Engine = { score: number; grade: string; flags: string[] };

export function EsgDashboardClient({
  listings,
  initialListingId,
}: {
  listings: ListingOpt[];
  initialListingId: string | null;
}) {
  const [listingId, setListingId] = useState<string>(initialListingId ?? listings[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [events, setEvents] = useState<
    Array<{ id: string; type: string; message: string; scoreImpact: number; createdAt: string }>
  >([]);

  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/esg/profile?listingId=${encodeURIComponent(listingId)}`, {
        credentials: "same-origin",
      });
      const j = (await res.json()) as {
        profile?: Record<string, unknown>;
        engine?: Engine;
        recommendations?: string[];
        events?: typeof events;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setProfile(j.profile ?? null);
      setEngine(j.engine ?? null);
      setRecommendations(j.recommendations ?? []);
      setEvents(j.events ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
      setProfile(null);
      setEngine(null);
      setRecommendations([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePatch(patch: Record<string, unknown>) {
    if (!listingId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/esg/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ...patch }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  if (listings.length === 0) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
        <p className="text-sm text-slate-400">No CRM listings available for ESG — create or claim a listing first.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">ESG</p>
          <h1 className="mt-2 text-3xl font-bold text-white">ESG dashboard</h1>
          <p className="mt-2 text-sm">
            <a
              className="text-premium-gold hover:underline"
              href="/dashboard/esg/action-center"
            >
              Open ESG Action Center (portfolio)
            </a>
            {" "}
            ·{" "}
            <a className="text-premium-gold hover:underline" href="/dashboard/esg/retrofit">
              Retrofit planner (portfolio)
            </a>
            {listingId ?
              <>
                {" "}
                ·{" "}
                <a
                  className="text-premium-gold hover:underline"
                  href={`/dashboard/esg/action-center/${encodeURIComponent(listingId)}`}
                >
                  Actions for this listing
                </a>
                {" "}
                ·{" "}
                <a
                  className="text-premium-gold hover:underline"
                  href={`/dashboard/esg/retrofit/${encodeURIComponent(listingId)}`}
                >
                  Retrofit for this listing
                </a>
              </>
            : null}
          </p>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Composite score uses energy, carbon, and sustainability inputs plus modifiers (solar, renovation,
            certification). Advisory only — not a third-party label.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-xs text-slate-500" htmlFor="esg-listing">
              Listing
            </label>
            <select
              id="esg-listing"
              className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-slate-100"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.listingCode} — {l.title.slice(0, 48)}
                  {l.title.length > 48 ? "…" : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={loading}
              onClick={() => void load()}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
        </header>

        {err ? <p className="text-sm text-rose-400">{err}</p> : null}
        {loading && !profile ? <p className="text-sm text-slate-500">Loading…</p> : null}

        {!profile && !loading ? (
          <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
            <p className="text-sm text-slate-400">
              No ESG profile yet for this listing. Save defaults to create one (stub scores until you add data).
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              onClick={() =>
                void savePatch({
                  energyScore: 55,
                  carbonScore: 55,
                  sustainabilityScore: 55,
                  certification: null,
                  solar: false,
                  renovation: false,
                  highCarbonMaterials: false,
                })
              }
            >
              Initialize ESG profile
            </button>
          </section>
        ) : null}

        {profile ? (
          <>
            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-200/90">ESG score card</h2>
                <p className="mt-4 text-5xl font-bold text-white">{engine?.score ?? "—"}</p>
                <p className="mt-1 text-lg text-emerald-200">Grade {engine?.grade ?? "—"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Certification: {String(profile.certification ?? "—")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
                <h2 className="text-sm font-semibold text-white">Impact metrics</h2>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  <li>Energy: {profile.energyScore != null ? String(profile.energyScore) : "—"}</li>
                  <li>Carbon: {profile.carbonScore != null ? String(profile.carbonScore) : "—"}</li>
                  <li>Sustainability: {profile.sustainabilityScore != null ? String(profile.sustainabilityScore) : "—"}</li>
                  <li>Solar: {profile.solar ? "Yes" : "No"}</li>
                  <li>Renovation focus: {profile.renovation ? "Yes" : "No"}</li>
                  <li>High-carbon materials flag: {profile.highCarbonMaterials ? "Yes" : "No"}</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h2 className="text-sm font-semibold text-white">Edit inputs</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-slate-500">
                  Energy (0–100)
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-2 text-sm"
                    defaultValue={profile.energyScore != null ? Number(profile.energyScore) : ""}
                    id="esg-energy"
                  />
                </label>
                <label className="block text-xs text-slate-500">
                  Carbon (0–100)
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-2 text-sm"
                    defaultValue={profile.carbonScore != null ? Number(profile.carbonScore) : ""}
                    id="esg-carbon"
                  />
                </label>
                <label className="block text-xs text-slate-500">
                  Sustainability (0–100)
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-2 text-sm"
                    defaultValue={profile.sustainabilityScore != null ? Number(profile.sustainabilityScore) : ""}
                    id="esg-sus"
                  />
                </label>
                <label className="block text-xs text-slate-500">
                  Certification
                  <select
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-2 text-sm"
                    defaultValue={String(profile.certification ?? "NONE")}
                    id="esg-cert"
                  >
                    <option value="NONE">NONE</option>
                    <option value="LEED">LEED</option>
                    <option value="WELL">WELL</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" defaultChecked={Boolean(profile.solar)} id="esg-solar" /> Solar
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" defaultChecked={Boolean(profile.renovation)} id="esg-renovation" /> Renovation
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" defaultChecked={Boolean(profile.highCarbonMaterials)} id="esg-hcm" /> High-carbon
                  materials
                </label>
              </div>
              <button
                type="button"
                className="mt-6 rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black"
                disabled={loading}
                onClick={() => {
                  const energy = Number((document.getElementById("esg-energy") as HTMLInputElement)?.value);
                  const carbon = Number((document.getElementById("esg-carbon") as HTMLInputElement)?.value);
                  const sus = Number((document.getElementById("esg-sus") as HTMLInputElement)?.value);
                  const cert = (document.getElementById("esg-cert") as HTMLSelectElement)?.value;
                  void savePatch({
                    energyScore: Number.isFinite(energy) ? energy : null,
                    carbonScore: Number.isFinite(carbon) ? carbon : null,
                    sustainabilityScore: Number.isFinite(sus) ? sus : null,
                    certification: cert === "NONE" ? null : cert,
                    solar: (document.getElementById("esg-solar") as HTMLInputElement)?.checked ?? false,
                    renovation: (document.getElementById("esg-renovation") as HTMLInputElement)?.checked ?? false,
                    highCarbonMaterials: (document.getElementById("esg-hcm") as HTMLInputElement)?.checked ?? false,
                  });
                }}
              >
                Save &amp; recompute
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h2 className="text-sm font-semibold text-white">AI recommendations</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              {engine?.flags?.length ? (
                <p className="mt-3 text-xs text-slate-500">Flags: {engine.flags.join(", ")}</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h2 className="text-sm font-semibold text-white">Event timeline</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {events.length === 0 ? <li className="text-slate-500">No events yet.</li> : null}
                {events.map((ev) => (
                  <li key={ev.id} className="border-b border-white/5 pb-3">
                    <span className="text-xs uppercase text-slate-500">{ev.type}</span>
                    <p className="text-slate-200">{ev.message}</p>
                    <p className="text-xs text-slate-500">
                      Impact {ev.scoreImpact} · {new Date(ev.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
