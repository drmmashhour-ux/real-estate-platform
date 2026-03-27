import Link from "next/link";

type Props = { searchParams: Promise<{ code?: string }> };

export default async function ListingNotFoundPage({ searchParams }: Props) {
  const { code } = await searchParams;
  const label = code?.trim() ? code.trim() : "that code";

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16 text-center text-slate-200">
      <h1 className="text-xl font-semibold text-white">Listing not found</h1>
      <p className="mt-3 text-sm text-slate-400">
        We could not find a listing for <span className="font-mono text-slate-300">{label}</span>. Check the
        code and try again.
      </p>
      <Link
        href="/search/bnhub"
        className="mt-8 inline-flex justify-center rounded-xl bg-[#C9A646] px-6 py-3 text-sm font-semibold text-black"
      >
        Back to search
      </Link>
    </main>
  );
}
