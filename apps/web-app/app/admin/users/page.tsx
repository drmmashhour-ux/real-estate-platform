import Link from "next/link";

export default function AdminUsersPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/admin" className="text-sm text-amber-400 hover:text-amber-300">← Admin</Link>
        <h1 className="mt-4 text-xl font-semibold">User management</h1>
        <p className="mt-2 text-slate-500">User list and moderation coming soon.</p>
      </div>
    </main>
  );
}
