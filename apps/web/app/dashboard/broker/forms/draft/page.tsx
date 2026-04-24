import Link from "next/link";
import { PlatformRole } from "@prisma/client";
import { getSession } from "@/lib/auth/get-session";
import { evaluateBrokerLicenceForBrokerage } from "@/lib/compliance/oaciq/broker-licence-service";
import { DraftFormClient } from "./DraftFormClient";

export default async function DraftFormPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const rawType = typeof sp.type === "string" ? sp.type.trim() : "";
  const initialType = rawType || null;

  const { user } = await getSession();
  if (!user || user.role !== PlatformRole.BROKER) {
    return (
      <div className="space-y-3 p-6">
        <p className="font-mono text-red-400">ACCESS_DENIED_NOT_LICENSED</p>
        <p className="text-sm text-white/60">A verified broker account with an active licence is required.</p>
        <Link href="/dashboard/broker/forms" className="text-sm text-[#D4AF37] hover:underline">
          Back to OACIQ Forms Hub
        </Link>
      </div>
    );
  }

  const licence = await evaluateBrokerLicenceForBrokerage({ brokerUserId: user.id, scope: {} });
  if (!licence.allowed) {
    return (
      <div className="space-y-3 p-6">
        <p className="font-mono text-red-400">ACCESS_DENIED_NOT_LICENSED</p>
        <p className="text-sm text-white/60">{licence.reasons.join(" · ") || "Licence or scope check failed."}</p>
        <Link href="/dashboard/broker/forms" className="text-sm text-[#D4AF37] hover:underline">
          Back to OACIQ Forms Hub
        </Link>
      </div>
    );
  }

  return <DraftFormClient initialType={initialType} />;
}
