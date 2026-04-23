"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type Profile = {
  gstAccountNumberMasked: string | null;
  qstFileNumberMasked: string | null;
  neq: string | null;
  reportingFrequency: string | null;
  firstReturnDueAt: string | Date | null;
  legalName: string | null;
} | null;

type TaxRow = {
  id: string;
  taxableBaseCents: number;
  gstCents: number;
  qstCents: number;
  totalWithTaxCents: number;
  reportingPeriodKey: string | null;
  reported: boolean;
};

export type BrokerRevenuQuebecClientProps = {
  ownerType: string;
  ownerId: string;
  initialProfile: Profile;
  initialTaxes: TaxRow[];
};

export function BrokerRevenuQuebecClient({
  ownerType,
  ownerId,
  initialProfile,
  initialTaxes,
}: BrokerRevenuQuebecClientProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [taxes, setTaxes] = useState<TaxRow[]>(initialTaxes);

  const refresh = useCallback(async () => {
    const base = { ownerType, ownerId };
    const [pRes, tRes] = await Promise.all([
      fetch("/api/financial/revenu-quebec-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(base),
      }),
      fetch("/api/financial/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(base),
      }),
    ]);
    const pJson = (await pRes.json()) as { profile?: Profile };
    const tJson = (await tRes.json()) as { data?: TaxRow[] };
    if (pRes.ok) setProfile(pJson.profile ?? null);
    if (tRes.ok) setTaxes(tJson.data ?? []);
  }, [ownerType, ownerId]);

  const byPeriod = taxes.reduce<Record<string, { base: number; gst: number; qst: number }>>((acc, row) => {
    const k = row.reportingPeriodKey ?? "—";
    if (!acc[k]) acc[k] = { base: 0, gst: 0, qst: 0 };
    acc[k].base += row.taxableBaseCents;
    acc[k].gst += row.gstCents;
    acc[k].qst += row.qstCents;
    return acc;
  }, {});

  const dueRaw = profile?.firstReturnDueAt;
  const dueLabel =
    dueRaw == null ? "—" : new Date(dueRaw as string | number | Date).toLocaleDateString();

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Revenu Québec records</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:border-[#D4AF37]/50"
            onClick={() => void refresh()}
          >
            Refresh
          </button>
          <Link href="/dashboard/broker/financial" className="text-sm text-[#D4AF37] hover:underline">
            ← Financial OS
          </Link>
        </div>
      </div>

      <p className="max-w-2xl text-sm text-white/60">
        Dashboard shows masked account and file numbers only. Raw identifiers stay in secure settings — not in the UI
        payload.
      </p>

      <div className="space-y-2 rounded-xl border border-white/10 bg-black p-4 text-sm">
        <div>
          Legal name: <span className="text-white">{profile?.legalName ?? "—"}</span>
        </div>
        <div>
          GST account: <span className="text-white">{profile?.gstAccountNumberMasked ?? "—"}</span>
        </div>
        <div>
          QST file: <span className="text-white">{profile?.qstFileNumberMasked ?? "—"}</span>
        </div>
        <div>
          NEQ: <span className="text-white">{profile?.neq ?? "—"}</span>
        </div>
        <div>
          Reporting frequency: <span className="text-white">{profile?.reportingFrequency ?? "—"}</span>
        </div>
        <div>
          First return due: <span className="text-white">{dueLabel}</span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-[#D4AF37]">Totals by reporting period</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byPeriod).map(([period, v]) => (
            <div key={period} className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm">
              <p className="font-medium text-white">{period}</p>
              <p className="text-white/70">Base: {(v.base / 100).toFixed(2)}</p>
              <p className="text-white/70">GST: {(v.gst / 100).toFixed(2)}</p>
              <p className="text-white/70">QST: {(v.qst / 100).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#D4AF37]">Tax ledger</h2>
        {taxes.map((row) => (
          <div key={row.id} className="rounded-xl border border-white/10 bg-black p-4 text-sm">
            <div>Base: {(row.taxableBaseCents / 100).toFixed(2)}</div>
            <div>GST: {(row.gstCents / 100).toFixed(2)}</div>
            <div>QST: {(row.qstCents / 100).toFixed(2)}</div>
            <div>Total: {(row.totalWithTaxCents / 100).toFixed(2)}</div>
            <div>Period: {row.reportingPeriodKey ?? "—"}</div>
            <div>Reported: {row.reported ? "yes" : "no"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
