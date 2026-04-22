export const dynamic = "force-dynamic";

export default function ResidenceAiPage() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-8">
      <h1 className="text-xl font-semibold text-amber-950">AI suggestions</h1>
      <p className="mt-3 max-w-xl text-sm text-amber-950/80">
        Personalized recommendations based on leads, occupancy, and marketplace signals (feature-flagged).
      </p>
    </div>
  );
}
