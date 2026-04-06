import Link from "next/link";
import { InsuranceLeadsAdminClient } from "@/components/admin/InsuranceLeadsAdminClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminInsurancePage() {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm text-[#D4AF37] hover:underline">
              ← Admin
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Insurance leads</h1>
            <p className="mt-1 text-sm text-white/50">
              Partner handoffs with stored consent. Create active partners in the database (see docs / Prisma).
            </p>
          </div>
        </div>
        <InsuranceLeadsAdminClient />
      </div>
    </div>
  );
}
