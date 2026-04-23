"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { DisputeDetailPage } from "@/components/lecipm-dashboard-mock/pages/DisputeDetailPage";

/** Production dashboard shell for dispute detail — reuses design-system dispute workspace (live API). */
export default function DashboardDisputeDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  if (!id) {
    return (
      <div className="min-h-screen bg-black px-4 py-10 text-white">
        <p className="text-sm text-zinc-400">Missing dispute id.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-ds-text">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/admin/disputes" className="text-xs font-medium text-ds-gold hover:underline">
          ← Admin disputes
        </Link>
        <DisputeDetailPage disputeId={id} />
      </div>
    </div>
  );
}
