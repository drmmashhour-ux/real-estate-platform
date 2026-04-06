import Link from "next/link";
import { FormsExampleClient } from "./forms-example-client";
import { getOaciqExampleLibrary } from "@/lib/forms/oaciq-examples";

export const dynamic = "force-dynamic";

export default function AdminFormsExamplesPage() {
  const examples = getOaciqExampleLibrary();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin/forms" className="text-sm text-amber-400 hover:text-amber-300">
          ← Forms
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-emerald-400/90">
          Review-first testing
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          OACIQ form refill examples
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          This page lets you test example form text before wiring live folder ingestion. It is meant to confirm that the platform can identify a known legal form, understand its structure, and separate autofill suggestions from mandatory review fields.
        </p>

        <FormsExampleClient examples={examples} />
      </div>
    </main>
  );
}
