import Link from "next/link";

export default function InvestorPage() {
  return (
    <main className="min-h-screen bg-[#0c0a09] px-6 py-10 text-[#f5f0e8]">
      <Link href="/" className="text-sm text-[#8a7a66] hover:text-[#f5f0e8]">
        ← Home
      </Link>
      <h1 className="mt-6 font-serif text-3xl font-light">Investor</h1>
      <p className="mt-2 text-[#b8a995]">
        Use <code className="text-[#c4b8a8]">lib/ai.ts</code> (analyzeDeal) and{" "}
        <code className="text-[#c4b8a8]">lib/finance.ts</code> (welcomeTax) from your
        tools.
      </p>
    </main>
  );
}
