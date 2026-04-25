import { FieldKpiDashboardClient } from "@/components/field/FieldKpiDashboardClient";
import Link from "next/link";

export const metadata = {
  title: "KPI terrain — LECIPM",
  description:
    "Cibles journalières et hebdo, suivi, alertes et coaching pour les agents terrain LECIPM.",
};

export default function FieldKpiPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-[11px] text-zinc-500 sm:text-left sm:px-8">
        KPI interne — chiffres d’exemple jusqu’au branchement CRM / démo.{" "}
        <Link className="text-amber-500/90 hover:text-amber-400" href="/admin/kpi">
          Vue manager
        </Link>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-8 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/80">Field</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">KPI — jour & semaine</h1>
          <p className="text-sm text-zinc-400">Objectifs, progression, score pondéré, alertes et classement.</p>
        </header>
        <FieldKpiDashboardClient />
      </div>
    </div>
  );
}
