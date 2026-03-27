import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0c0a09] px-6 py-10 text-[#f5f0e8]">
      <Link href="/" className="text-sm text-[#8a7a66] hover:text-[#f5f0e8]">
        ← Home
      </Link>
      <h1 className="mt-6 font-serif text-3xl font-light">Dashboard</h1>
      <p className="mt-2 text-[#b8a995]">Broker &amp; pipeline overview (extend here).</p>
    </main>
  );
}
