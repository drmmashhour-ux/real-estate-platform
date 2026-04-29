"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClientIntakeProfileFormView } from "@/types/client-intake-profile-form-client";

type Props = {
  brokerClientId: string;
  initial: ClientIntakeProfileFormView;
};

export function ClientIntakeProfileForm({ brokerClientId, initial }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [legalFirstName, setLegalFirstName] = useState(initial.legalFirstName ?? "");
  const [legalLastName, setLegalLastName] = useState(initial.legalLastName ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [currentAddress, setCurrentAddress] = useState(initial.currentAddress ?? "");
  const [city, setCity] = useState(initial.city ?? "");
  const [provinceState, setProvinceState] = useState(initial.provinceState ?? "");
  const [postalCode, setPostalCode] = useState(initial.postalCode ?? "");
  const [country, setCountry] = useState(initial.country ?? "");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/intake/profile/${encodeURIComponent(brokerClientId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          legalFirstName,
          legalLastName,
          email,
          phone,
          currentAddress,
          city,
          provinceState,
          postalCode,
          country,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Save failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-3 text-sm">
      {err ? <p className="text-rose-400">{err}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-slate-500">Legal first name</span>
          <input
            value={legalFirstName}
            onChange={(e) => setLegalFirstName(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Legal last name</span>
          <input
            value={legalLastName}
            onChange={(e) => setLegalLastName(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-slate-500">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-slate-500">Current address</span>
        <textarea
          value={currentAddress}
          onChange={(e) => setCurrentAddress(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs text-slate-500">City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Province / state</span>
          <input
            value={provinceState}
            onChange={(e) => setProvinceState(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Postal code</span>
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-slate-500">Country</span>
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-slate-100"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
