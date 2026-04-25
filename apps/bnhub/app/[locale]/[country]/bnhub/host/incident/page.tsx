import Link from "next/link";
import { IncidentReportForm } from "./incident-report-form";

export default function HostIncidentPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/bnhub/host/dashboard" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
            ← Host dashboard
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Report an incident</h1>
          <p className="mt-1 text-slate-400">
            Report property damage, guest issues, or safety concerns. Our trust & safety team will review.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <IncidentReportForm />
      </section>
    </main>
  );
}
