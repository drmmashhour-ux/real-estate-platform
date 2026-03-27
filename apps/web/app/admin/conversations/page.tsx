import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/session";
import { AdminConversationsClient } from "./admin-conversations-client";

export const dynamic = "force-dynamic";

export default async function AdminConversationsPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">
          ← Admin
        </Link>
        <AdminConversationsClient />
      </div>
    </main>
  );
}
