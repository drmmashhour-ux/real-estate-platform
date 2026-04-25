"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Rocket, Target, Users, ClipboardList } from "lucide-react";

type LaunchRow = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  nightPriceCents: number;
  ownerId: string;
  hostEmail: string | null;
  hostName: string | null;
  bookings: number;
  createdAt: string;
  experienceTags: string[];
  reputationRankBoost: number;
};

export function BnhubLaunchDashboardClient({
  initial,
}: {
  initial: {
    publishedCount: number;
    draftCount: number;
    activeHosts: number;
    bookingCount: number;
    targetListings: number;
    gapToTarget: number;
    listings: LaunchRow[];
  };
}) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    ownerEmail: "",
    title: "",
    city: "",
    address: "",
    description: "",
    price: "129",
    photos: "",
    amenities: "Wi‑Fi, Kitchen, Heating",
    publish: true,
    flagNew: true,
    flagSpecial: false,
  });

  const progressPct = useMemo(
    () => Math.min(100, Math.round((data.publishedCount / data.targetListings) * 100)),
    [data.publishedCount, data.targetListings],
  );

  async function refresh() {
    const r = await fetch("/api/admin/bnhub-launch/snapshot", { credentials: "same-origin" });
    if (r.ok) {
      const j = (await r.json()) as typeof initial;
      setData(j);
    }
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/bnhub-launch/listing", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: form.ownerEmail,
          title: form.title,
          city: form.city,
          address: form.address,
          description: form.description,
          price: Number(form.price),
          photos: form.photos,
          amenities: form.amenities,
          publish: form.publish,
          flagNewListing: form.flagNew,
          flagSpecialOffer: form.flagSpecial,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg(j.error ?? "Failed");
        return;
      }
      setMsg(`Created ${j.listingCode}.`);
      setForm((f) => ({
        ...f,
        title: "",
        description: "",
        photos: "",
      }));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patchListing(id: string, patch: Record<string, unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/bnhub-launch/listing/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg(j.error ?? "Update failed");
        return;
      }
      setMsg("Listing updated.");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function cad(cents: number) {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
      cents / 100,
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 text-zinc-100 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">BNHub launch</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">First listings &amp; first bookings</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Seed {data.targetListings} high-quality stays (configure with{" "}
          <code className="text-zinc-300">BNHUB_LAUNCH_TARGET_LISTINGS</code>, 10–20), promote discovery, and track traction.
          Quality bar: 3+ photos, 120+ character description, 3+ amenities.
        </p>
        <Link href="/admin/revenue" className="text-sm text-amber-400 hover:text-amber-300">
          Revenue dashboard →
        </Link>
      </header>

      {msg ? (
        <p className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200">{msg}</p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Rocket className="h-5 w-5" />} label="Listings acquired" value={String(data.publishedCount)} />
          <Stat icon={<Users className="h-5 w-5" />} label="Active hosts" value={String(data.activeHosts)} />
          <Stat icon={<Target className="h-5 w-5" />} label="Bookings" value={String(data.bookingCount)} />
          <Stat icon={<ClipboardList className="h-5 w-5" />} label="Draft listings" value={String(data.draftCount)} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Target: {data.targetListings} listings</h2>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-amber-500/90 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          {data.gapToTarget > 0 ? `${data.gapToTarget} listings to go` : "Target reached — keep quality high."}
        </p>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">First listings strategy — manual seed</h2>
          <p className="mt-1 text-sm text-zinc-500">Host must already exist — enter their account email.</p>
          <form onSubmit={submitCreate} className="mt-5 space-y-4">
            <Field label="Host email *">
              <input
                required
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Property name *">
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City *">
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Price / night (CAD) *">
                <input
                  required
                  type="number"
                  min={1}
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <Field label="Address *">
              <input
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </Field>
            <Field label={`Description * (min ${120} chars)`}>
              <textarea
                required
                minLength={120}
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Photo URLs * (one per line or comma, https only, min 3)">
              <textarea
                required
                rows={4}
                value={form.photos}
                onChange={(e) => setForm((f) => ({ ...f, photos: e.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Amenities * (comma-separated, min 3)">
              <input
                required
                value={form.amenities}
                onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              />
            </Field>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.publish}
                  onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))}
                />
                Publish immediately
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.flagNew}
                  onChange={(e) => setForm((f) => ({ ...f, flagNew: e.target.checked }))}
                />
                “New listing” badge
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.flagSpecial}
                  onChange={(e) => setForm((f) => ({ ...f, flagSpecial: e.target.checked }))}
                />
                “Special offer” badge
              </label>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create listing
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Tasks</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span className="text-amber-400">□</span>
              Reach {data.targetListings} published listings with the quality bar (photos, description, amenities).
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400">□</span>
              Tag a cohort with <strong className="text-white">New listing</strong> /{" "}
              <strong className="text-white">Special offer</strong> for first bookings.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400">□</span>
              Share search link: <span className="font-mono text-xs text-zinc-500">/en/ca/search/bnhub</span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-400">□</span>
              Host onboarding: <Link className="text-amber-400 hover:underline" href="/bnhub/host/onboarding">/bnhub/host/onboarding</Link>
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Tracking</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Bookings per listing. Launch conversion rate = share of listings that have secured at least one booking (proxy until
          view-level funnel exists).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="py-2 pr-3">Listing</th>
                <th className="py-2 pr-3">Host</th>
                <th className="py-2 pr-3">City</th>
                <th className="py-2 pr-3">Price</th>
                <th className="py-2 pr-3">Bookings</th>
                <th className="py-2 pr-3">Conv. rate</th>
                <th className="py-2 pr-3">Promote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.listings.map((row) => (
                <tr key={row.id} className="text-zinc-300">
                  <td className="py-3 pr-3">
                    <div className="font-medium text-white">{row.title}</div>
                    <div className="font-mono text-xs text-zinc-500">{row.listingCode}</div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-zinc-500">
                      {row.experienceTags.map((t) => (
                        <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-xs">{row.hostEmail ?? row.ownerId.slice(0, 8)}</td>
                  <td className="py-3 pr-3">{row.city}</td>
                  <td className="py-3 pr-3 tabular-nums">{cad(row.nightPriceCents)}</td>
                  <td className="py-3 pr-3 tabular-nums">{row.bookings}</td>
                  <td className="py-3 pr-3 tabular-nums" title={row.bookings >= 1 ? "At least one booking" : "Awaiting first booking"}>
                    {row.bookings >= 1 ? "100%" : "0%"}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          patchListing(row.id, {
                            newListing: true,
                            specialOffer: false,
                            visibilityBoost: true,
                          })
                        }
                        className="rounded-lg border border-zinc-600 px-2 py-1 text-left text-xs hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Feature listing
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          patchListing(row.id, {
                            visibilityOnly: true,
                            visibilityBoost: true,
                          })
                        }
                        className="rounded-lg border border-zinc-600 px-2 py-1 text-left text-xs hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Boost visibility
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          patchListing(row.id, {
                            newListing: true,
                            specialOffer: true,
                            visibilityBoost: false,
                            discountPercent: 10,
                          })
                        }
                        className="rounded-lg border border-zinc-600 px-2 py-1 text-left text-xs hover:bg-zinc-800 disabled:opacity-50"
                      >
                        Apply 10% discount
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2 text-amber-400/90">{icon}</div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
