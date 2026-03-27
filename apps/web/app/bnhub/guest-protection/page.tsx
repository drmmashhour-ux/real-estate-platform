import Link from "next/link";

export default function GuestProtectionPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/search/bnhub" className="text-lg font-semibold text-slate-900">
            BNHub
          </Link>
          <Link
            href="/search/bnhub"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Find a stay
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-6">
          <p className="text-sm font-medium text-emerald-800">
            Your booking is protected. Report issues and we’ll help resolve them.
          </p>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Guest Protection
        </h1>
        <p className="mt-2 text-slate-600">
          We want every stay to match what you booked. Here’s how we protect you.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Report an issue if the place is not as described</h2>
            <p className="mt-2 text-sm text-slate-700">
              You can report an issue if the property doesn’t match the listing (photos, description, or amenities), or if you experience cleanliness, safety, or access problems. We review each report and work with the host to resolve issues.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Refund when verified</h2>
            <p className="mt-2 text-sm text-slate-700">
              If we verify that the listing was materially different or that major problems existed, a full or partial refund may apply. Refunds are processed according to our policy. If our payment integration is not yet connected, the refund decision is recorded and may be processed manually.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Support when you need it</h2>
            <p className="mt-2 text-sm text-slate-700">
              If something goes wrong during your stay—access problems, cleanliness issues, or safety concerns—you can report an issue from your booking page. Our team reviews reports and will contact you and the host to gather information and find a fair resolution.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Platform mediation</h2>
            <p className="mt-2 text-sm text-slate-700">
              When you and the host disagree, BNHub acts as a neutral mediator. We review evidence from both sides, our policies, and the listing description to decide outcomes. Our goal is to be fair to guests and hosts while upholding our standards. Refunds, when approved, are processed according to our refund policy.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          To report an issue with a booking, open your booking details and click &quot;Report an issue.&quot;
        </p>
        <Link
          href="/search/bnhub"
          className="mt-4 inline-block rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
        >
          Find a stay
        </Link>
      </section>
    </main>
  );
}
