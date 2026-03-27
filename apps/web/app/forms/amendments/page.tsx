import Link from "next/link";
import { AmendmentsFormClient } from "./AmendmentsFormClient";
import { amendmentsDefaultPayload } from "@/lib/forms/templates/amendments";

export const metadata = {
  title: "Amendments form | OACIQ",
  description: "Amendment to brokerage contract / extension of acceptance or time period.",
};

export default function AmendmentsFormPage() {
  const defaultPayload = amendmentsDefaultPayload();
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/forms" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
          ← Forms
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Amendments</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Amendment to brokerage contract or extension of acceptance/time period. Complete and submit; data will be sent to the administrator for review.
        </p>
        <AmendmentsFormClient initialPayload={defaultPayload} />
      </div>
    </main>
  );
}
