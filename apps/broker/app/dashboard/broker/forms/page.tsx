"use client";

import Link from "next/link";

export default function FormsHubPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[#D4AF37]">OACIQ Forms Hub</h1>

      <p className="text-sm text-gray-400">
        Access official OACIQ forms and draft them with AI assistance.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FormCard
          title="Seller Declaration"
          draftKey="seller_declaration"
          link="https://www.oaciq.com/en/broker/brokerage-forms"
        />
        <FormCard
          title="Brokerage Contract"
          draftKey="brokerage_contract"
          link="https://www.oaciq.com/en/broker/brokerage-forms"
        />
        <FormCard
          title="Promise to Purchase"
          draftKey="promise_to_purchase"
          link="https://www.oaciq.com/en/broker/brokerage-forms"
        />
        <FormCard
          title="Amendments"
          draftKey="amendments"
          link="https://www.oaciq.com/en/broker/brokerage-forms"
        />
        <FormCard
          title="Identity Verification"
          draftKey="identity_verification"
          link="https://www.oaciq.com/en/broker/brokerage-forms"
        />
      </div>
    </div>
  );
}

function FormCard({ title, link, draftKey }: { title: string; link: string; draftKey: string }) {
  return (
    <div className="space-y-3 rounded-xl border border-[#D4AF37]/30 bg-black p-5">
      <h2 className="font-semibold text-white">{title}</h2>

      <div className="flex flex-wrap gap-2">
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#D4AF37] underline">
          View Official Form
        </a>

        <Link href={`/dashboard/broker/forms/draft?type=${encodeURIComponent(draftKey)}`} className="text-xs text-white underline">
          Draft with AI
        </Link>
      </div>
    </div>
  );
}
