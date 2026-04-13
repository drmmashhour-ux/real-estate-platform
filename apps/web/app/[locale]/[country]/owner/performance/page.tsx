import Link from "next/link";

export default function OwnerPerformancePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/owner" className="text-sm text-emerald-400 hover:text-emerald-300">← Owner dashboard</Link>
        <h1 className="mt-4 text-xl font-semibold">Portfolio performance</h1>
        <p className="mt-2 text-slate-500">Property performance and analytics coming soon.</p>
      </div>
    </main>
  );
}
