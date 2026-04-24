import Link from "next/link";

export default function BrokerCommissionsHubPage() {
  return (
    <div className="p-6 mx-auto max-w-3xl space-y-8 text-white">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Commissions &amp; tax compliance</h1>
        <p className="text-sm text-gray-400">
          Commission splits and GST/QST records must stay aligned with transaction files. Trust funds cannot be booked as
          revenue; tax rows are required when commission is recognized.
        </p>
      </header>

      <ul className="space-y-3 text-sm text-gray-300 list-disc pl-5">
        <li>
          <strong className="text-gray-200">Trust misuse</strong> — recording{" "}
          <code className="text-amber-200/90">fundsSource: &quot;trust&quot;</code> with a revenue action is blocked (
          <code className="font-mono text-xs">TRUST_FUNDS_CANNOT_BE_REVENUE</code>).
        </li>
        <li>
          <strong className="text-gray-200">Tax record</strong> — won deals with commission require a{" "}
          <code className="font-mono text-xs">TaxRecord</code> row (
          <code className="font-mono text-xs">TAX_RECORD_REQUIRED</code>).
        </li>
        <li>
          <strong className="text-gray-200">AI</strong> — use <code className="font-mono text-xs">buildRevenueAssistantPrompt</code>{" "}
          for drafting and inconsistency hints only, not final tax amounts.
        </li>
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/broker/financial"
          className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Financial records
        </Link>
        <Link
          href="/dashboard/broker/financial/receipts/create"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
        >
          Receipt of cash
        </Link>
        <Link
          href="/dashboard/broker/trust"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
        >
          Trust &amp; deposits
        </Link>
      </div>
    </div>
  );
}
