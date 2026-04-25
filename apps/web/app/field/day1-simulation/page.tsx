import Link from "next/link";
import { FieldDay1SimulationClient } from "@/components/field/FieldDay1SimulationClient";

export const metadata = {
  title: "Simulation jour 1 — LECIPM Field",
  description:
    "Simulation du premier jour sur le terrain : appels, objections, démos, erreurs et coaching. Usage interne.",
};

export default function FieldDay1SimulationPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-[11px] text-zinc-500 sm:text-left sm:px-8">
        Usage interne LECIPM — exercice de mise en situation, pas une promesse commerciale.
        <Link href="/field/script" className="ml-2 text-amber-500/90 hover:text-amber-400">
          Script terrain →
        </Link>
      </div>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/80">Field</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Simulation — premier jour (jumeau)</h1>
          <p className="text-sm text-zinc-400">
            Parcours type : appels, objections, démos, erreurs fréquentes et retour coaching. Utilise les choix pour voir
            d’autres issues, ou joue la journée « canon » alignée sur l’histoire de référence.
          </p>
        </header>

        <FieldDay1SimulationClient />
      </div>
    </div>
  );
}
