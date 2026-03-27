import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { AdminChannelManagerClient } from "./admin-channel-manager-client";

export default async function AdminChannelManagerPage() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    redirect("/login?next=/admin/bnhub/channel-manager");
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-50">
      <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
        ← Admin
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">BNHub channel manager</h1>
      <p className="mt-2 text-sm text-slate-400">All host connections, sync health, and recent logs.</p>
      <div className="mt-8">
        <AdminChannelManagerClient />
      </div>
    </main>
  );
}
