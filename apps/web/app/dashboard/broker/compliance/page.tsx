"use client";

import Link from "next/link";

export default function BrokerCompliancePage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[#D4AF37]">Compliance Center</h1>

      <p className="text-sm text-gray-400">
        Manage contracts, declarations, identity verification, and ensure OACIQ compliance.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <HubCard
          title="Contracts"
          description="Create and manage brokerage contracts"
          href="/dashboard/broker/contracts"
        />
        <HubCard
          title="Seller Declarations"
          description="Mandatory declaration forms"
          href="/dashboard/broker/declarations"
        />
        <HubCard
          title="Identity Verification"
          description="Verify buyer and seller identity"
          href="/dashboard/broker/identity"
        />
        <HubCard
          title="Compliance Status"
          description="Check listing compliance"
          href="/dashboard/broker/compliance/status"
        />
        <HubCard
          title="Unified OACIQ engine"
          description="Trust, AML, records, tax rule packs"
          href="/dashboard/broker/compliance/unified"
        />
        <HubCard
          title="AI Broker Assistant"
          description="Rédaction FR, conformité résidentielle, révision obligatoire"
          href="/dashboard/broker-assistant"
        />
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/45">Operational tools</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/broker/compliance/command-center" className="text-[#D4AF37] hover:underline">
            Command center
          </Link>
          <Link href="/dashboard/broker/compliance/audit" className="text-[#D4AF37] hover:underline">
            Audit trail
          </Link>
          <Link href="/dashboard/broker/compliance/health" className="text-[#D4AF37] hover:underline">
            Compliance health
          </Link>
          <Link href="/dashboard/broker/forms" className="text-[#D4AF37] hover:underline">
            OACIQ Forms Hub
          </Link>
          <Link href="/dashboard/broker/forms/review" className="text-[#D4AF37] hover:underline">
            Form review
          </Link>
        </div>
      </div>
    </div>
  );
}

function HubCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href}>
      <div className="cursor-pointer rounded-xl border border-[#D4AF37]/30 bg-black p-5 transition hover:border-[#D4AF37]">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
