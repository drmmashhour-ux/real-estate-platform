import Link from "next/link";
import { CreateListingWizard } from "./create-listing-wizard";

export default function NewListingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/bnhub/host/dashboard"
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            ← Host dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Create a new listing</h1>
          <p className="mt-1 text-sm text-slate-400">
            Complete each step to publish your short-term rental.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <CreateListingWizard />
      </section>
    </main>
  );
}
