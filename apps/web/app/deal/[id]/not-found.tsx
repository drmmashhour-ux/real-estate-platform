import Link from "next/link";
import { MvpNav } from "@/components/investment/MvpNav";

export default function SharedDealNotFound() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant="live" />
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Deal not found</h1>
        <p className="mt-3 text-slate-400">This link may be invalid or the deal was removed.</p>
        <Link
          href="/analyze"
          className="mt-8 inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400"
        >
          Start analyzing now
        </Link>
      </div>
    </div>
  );
}
