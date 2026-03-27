import Link from "next/link";
import { BecomeHostForm } from "./become-host-form";

export default function BecomeHostPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/search/bnhub"
            className="text-lg font-semibold text-slate-900"
          >
            BNHub
          </Link>
          <Link
            href="/bnhub/login"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">
          Become a host
        </h1>
        <p className="mt-2 text-slate-600">
          Apply to list your property. We&apos;ll review and get back to you
          within 1–2 business days.
        </p>

        <BecomeHostForm />
      </section>
    </main>
  );
}
