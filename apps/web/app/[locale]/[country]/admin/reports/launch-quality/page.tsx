import Link from "next/link";
import ar from "@/locales/ar.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function LaunchQualityReportsPage() {
  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: { in: ["PUBLISHED", "APPROVED", "DRAFT"] } },
    select: {
      id: true,
      title: true,
      listingStatus: true,
      nightPriceCents: true,
      listingPhotos: { select: { id: true }, take: 7 },
    },
    take: 200,
    orderBy: { updatedAt: "desc" },
  });

  const missingPhotos = listings.filter((l) => l.listingPhotos.length < 3);
  const missingPrice = listings.filter((l) => l.nightPriceCents <= 0);

  const flatEn = Object.keys(flattenKeys(en as unknown as Record<string, unknown>));
  const flatFr = Object.keys(flattenKeys(fr as unknown as Record<string, unknown>));
  const flatAr = Object.keys(flattenKeys(ar as unknown as Record<string, unknown>));
  const missingFr = flatEn.filter((k) => !flatFr.includes(k));
  const missingAr = flatEn.filter((k) => !flatAr.includes(k));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← Admin
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Launch quality & localization</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sampling recent listings and JSON locale key parity (best-effort). Full QA lives in docs.
        </p>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-medium text-white">Listing quality (sample up to 200)</h2>
          <p className="mt-2 text-sm text-slate-400">
            &lt; 3 photos: <span className="text-amber-200">{missingPhotos.length}</span> · zero/invalid price:{" "}
            <span className="text-amber-200">{missingPrice.length}</span>
          </p>
          {missingPhotos.slice(0, 8).map((l) => (
            <p key={l.id} className="mt-1 font-mono text-xs text-slate-500">
              {l.id.slice(0, 8)}… {l.title.slice(0, 40)} ({l.listingPhotos.length} photos)
            </p>
          ))}
        </section>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h2 className="text-lg font-medium text-white">Localization keys (flattened)</h2>
          <p className="mt-2 text-sm text-slate-400">
            EN keys: {flatEn.length} · missing in FR: {missingFr.length} · missing in AR: {missingAr.length}
          </p>
          {missingFr.length > 0 && (
            <p className="mt-2 text-xs text-red-300">Example FR gaps: {missingFr.slice(0, 6).join(", ")}</p>
          )}
          {missingAr.length > 0 && (
            <p className="mt-2 text-xs text-red-300">Example AR gaps: {missingAr.slice(0, 6).join(", ")}</p>
          )}
        </section>
      </div>
    </main>
  );
}

function flattenKeys(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenKeys(v as Record<string, unknown>, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}
