import Link from "next/link";

export default function SupportConsolePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
            BNHUB Guest Support
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Support
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
            Contact the BNHUB Guest support team for account access, reservations, notifications, booking questions,
            and technical issues related to the mobile app and platform experience.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              ← Home
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-slate-200">How we can help</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>Account access and sign-in issues</li>
                <li>Reservation and booking detail questions</li>
                <li>Notification and app behavior issues</li>
                <li>Guest support chat and trip assistance</li>
                <li>Technical issues with BNHUB Guest</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-slate-200">Contact support</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <p>
                  Support website:{" "}
                  <a href="https://lecipm.com/support" className="text-sky-300 hover:text-sky-200">
                    https://lecipm.com/support
                  </a>
                </p>
                <p>
                  Support email:{" "}
                  <a href="mailto:info@lecipm.com" className="text-premium-gold hover:underline">
                    info@lecipm.com
                  </a>
                </p>
                <p>
                  Include your account email, reservation reference if available, device type, and a short
                  description of the issue.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-slate-200">Internal operations</h2>
            <p className="mt-2 text-sm text-slate-500">
              Platform operators can use the internal support tools that are currently available for account and user lookup.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/support/lookup" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200">User lookup</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
