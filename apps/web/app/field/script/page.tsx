import { ScriptPanel } from "@/components/field/ScriptPanel";
import { Check } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Script terrain — LECIPM",
  description:
    "Script mot à mot et minuteur de démo pour les agents terrain LECIPM. Usage interne — ne pas paraphraser en rendez-vous.",
};

const RULES = [
  { text: "Garder la démo courte (≤ 10 min)", ok: true },
  { text: "Suivre le script exactement", ok: true },
  { text: "Poser des questions (découverte)", ok: true },
  { text: "Pousser vers un essai sur dossier", ok: true },
];

export default function FieldScriptPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-[11px] text-zinc-500 sm:text-left sm:px-8">
        Usage interne LECIPM — script obligatoire tel quel sur le terrain. Ajustements uniquement via ops / conformité.
        <Link href="/admin/scaling" className="ml-2 text-amber-500/90 hover:text-amber-400">
          Tableau d’équipe →
        </Link>
      </div>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500/80">Field</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Script terrain + minuteur</h1>
          <p className="text-sm text-zinc-400">Ouverture → découverte → démo → objections → clôture. Démonstration plafonnée à 10 minutes.</p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Règles de performance</h2>
          <ul className="mt-3 space-y-2">
            {RULES.map((r) => (
              <li key={r.text} className="flex items-start gap-2 text-sm text-zinc-200">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {r.text}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Déroulé (mot à mot)</h2>
          <ScriptPanel />
        </section>
      </div>
    </div>
  );
}
