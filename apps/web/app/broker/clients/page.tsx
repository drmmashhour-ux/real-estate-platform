import Link from "next/link";

export default function BrokerClientsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/broker" className="text-sm text-emerald-400 hover:text-emerald-300">← Broker CRM</Link>
        <h1 className="mt-4 text-xl font-semibold">Clients</h1>
        <p className="mt-2 text-slate-500">Client management coming soon.</p>
      </div>
    </main>
  );
}
