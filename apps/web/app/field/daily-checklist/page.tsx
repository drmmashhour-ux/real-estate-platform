import Link from "next/link";
import { FieldDailyChecklistClient } from "@/components/field/FieldDailyChecklistClient";

export const metadata = {
  title: "Checklist quotidienne — LECIPM Field",
  description:
    "Plan d’exécution par blocs horaires, suivi, KPI et règles pour les agents terrain LECIPM.",
};

export default function FieldDailyChecklistPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-[11px] text-zinc-500 sm:text-left sm:px-8">
        La checklist et les cases sont enregistrées sur cet appareil (local).{" "}
        <Link className="text-amber-500/90 hover:text-amber-400" href="/field/kpi">
          KPI
        </Link>{" "}
        ·{" "}
        <Link className="text-amber-500/90 hover:text-amber-400" href="/field/script">
          Script
        </Link>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-8 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/80">Field</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Checklist quotidienne</h1>
          <p className="text-sm text-zinc-400">
            Chronologie, tâches, suivi, KPI en direct, alertes et règles — pour maximiser démos et conversions.
          </p>
        </header>
        <FieldDailyChecklistClient />
      </div>
    </div>
  );
}
