"use client";

import Link from "next/link";

import { AlertCard } from "@/components/soins/AlertCard";
import { StatusBadge } from "@/components/soins/StatusBadge";
import type { SoinsUrgencyLevel } from "@/design-system/soins-hub";

export type ResidentDashVm = {
  residentName: string;
  residenceTitle: string;
  city: string;
  statusLevel: SoinsUrgencyLevel;
  statusLabel: string;
  todaySummary: string;
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
  }>;
  /** e.g. /fr/ca/dashboard/soins/resident */
  basePath: string;
};

export function SoinsResidentDashboardClient(props: { vm: ResidentDashVm }) {
  const v = props.vm;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D4AF37]/18 pb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/75">Espace résident</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-white">Bonjour, {v.residentName}</h1>
          <p className="mt-2 text-[17px] text-white/55">
            {v.residenceTitle} · {v.city}
          </p>
        </div>
        <StatusBadge level={v.statusLevel} label={v.statusLabel} />
      </div>

      <section className="mt-8 rounded-3xl border border-emerald-500/25 bg-emerald-500/8 p-6">
        <h2 className="text-lg font-semibold text-emerald-200">Aujourd’hui</h2>
        <p className="mt-3 text-[17px] leading-relaxed text-white/85">{v.todaySummary}</p>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[#D4AF37]">Alertes récentes</h2>
          <Link
            href={`${v.familyHref.replace("/family", "")}/family/alerts`}
            className="text-sm font-medium text-[#D4AF37] underline-offset-4 hover:underline"
          >
            Voir tout
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {v.alerts.length === 0 ? (
            <p className="text-white/45">Aucune alerte récente.</p>
          ) : (
            v.alerts.slice(0, 4).map((a) => (
              <AlertCard
                key={a.id}
                id={a.id}
                title={a.type}
                message={a.message}
                severity={a.severity}
                createdAt={a.createdAt}
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href={`${v.basePath}/chat`}
          className="rounded-2xl border border-[#D4AF37]/22 bg-[#101010] px-5 py-6 text-center text-lg font-semibold text-white transition hover:border-[#D4AF37]/50"
        >
          Messages
        </Link>
        <Link
          href={`${v.basePath}/alerts`}
          className="rounded-2xl border border-[#D4AF37]/22 bg-[#101010] px-5 py-6 text-center text-lg font-semibold text-white transition hover:border-[#D4AF37]/50"
        >
          Alertes
        </Link>
      </section>
    </div>
  );
}
