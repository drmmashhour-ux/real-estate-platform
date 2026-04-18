import Link from "next/link";

export function InvestorDashboard({
  basePath,
  showPitchLinks,
}: {
  basePath: string;
  showPitchLinks: boolean;
}) {
  return (
    <section className="rounded-2xl border border-amber-900/40 bg-amber-950/15 p-6">
      <h2 className="text-lg font-semibold text-amber-100">Investor pitch</h2>
      <p className="mt-1 text-sm text-zinc-500">
        JSON deck + exports use database metrics only. Diligence CSV/JSON: POST{" "}
        <code className="text-zinc-400">/api/launch/investor/export</code>.
      </p>
      {showPitchLinks ? (
        <ul className="mt-4 space-y-2 text-sm text-amber-200/90">
          <li>
            <Link href={`${basePath}/investor`} className="hover:underline">
              Pitch preview &amp; export UI →
            </Link>
          </li>
        </ul>
      ) : (
        <p className="mt-4 text-xs text-zinc-600">Enable FEATURE_INVESTOR_PITCH_V1 + investor metrics.</p>
      )}
    </section>
  );
}
