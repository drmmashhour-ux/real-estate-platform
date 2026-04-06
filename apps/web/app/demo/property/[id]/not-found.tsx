import Link from "next/link";

export default function DemoPropertyNotFound() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-10 text-center">
      <h1 className="text-xl font-semibold text-white">Demo listing not found</h1>
      <p className="mt-2 text-sm text-slate-500">Use a slug from search (<code className="text-amber-400/90">bnhub</code>,{" "}
        <code className="text-amber-400/90">resale</code>) or a seeded listing id.</p>
      <Link href="/demo/search" className="mt-6 inline-block text-sm text-amber-400 hover:underline">
        ← Back to demo search
      </Link>
    </div>
  );
}
