import { TrustIndicators } from "@/src/modules/client-documents/ui/TrustIndicators";

type Props = {
  title: string;
  property: string;
  status: string;
  completionPercent: number;
  contradictionCount: number;
  warningCount: number;
};

export function DocumentHeader({ title, property, status, completionPercent, contradictionCount, warningCount }: Props) {
  return (
    <header className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-sm text-slate-400">{property}</p>
        </div>
        <span className="rounded-full border border-white/20 px-2 py-1 text-xs uppercase text-slate-200">{status.replace(/_/g, " ")}</span>
      </div>
      <TrustIndicators completionPercent={completionPercent} contradictionCount={contradictionCount} warningCount={warningCount} />
    </header>
  );
}
