import Link from "next/link";

export default function SupportLookupPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/support" className="text-sm text-sky-400 hover:text-sky-300">← Support console</Link>
        <h1 className="mt-4 text-xl font-semibold">User lookup</h1>
        <p className="mt-2 text-slate-500">Look up users by ID or email to assist with tickets.</p>
      </div>
    </main>
  );
}
