import Link from "next/link";

export default function BrokerFormsReviewHubPage() {
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-semibold text-[#D4AF37]">Draft review</h1>

      <p className="mt-4 max-w-2xl text-sm text-white/80">
        You must review all AI-generated fields before signing. Use the checklist for a specific form type, or continue from
        your drafting flow only after validation and consistency checks pass.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/broker/forms/review/promise_to_purchase"
          className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black"
        >
          Promise to purchase
        </Link>
        <Link
          href="/dashboard/broker/forms/review/counter_proposal"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white"
        >
          Counter-proposal
        </Link>
      </div>

      <p className="mt-8 text-xs text-white/50">
        Broker review gates: <code className="text-white/70">aiGenerated && !brokerReviewed</code> is blocked on{" "}
        <code className="text-white/70">POST /api/drafting/generate</code>.
      </p>
    </div>
  );
}
