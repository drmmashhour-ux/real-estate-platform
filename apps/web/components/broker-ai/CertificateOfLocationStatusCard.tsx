import type { CertificateOfLocationViewModel } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";

const TONE: Record<CertificateOfLocationViewModel["statusBadge"]["tone"], string> = {
  neutral: "border-zinc-700 text-zinc-300",
  info: "border-amber-500/50 text-amber-200/90",
  warn: "border-amber-500 text-amber-100",
  danger: "border-rose-800/80 text-rose-200/90",
  ok: "border-amber-200/30 text-amber-100",
};

function Badge(props: { label: string; tone: CertificateOfLocationViewModel["statusBadge"]["tone"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${TONE[props.tone]}`}
    >
      {props.label}
    </span>
  );
}

export function CertificateOfLocationStatusCard(props: { viewModel: CertificateOfLocationViewModel }) {
  const v = props.viewModel;
  if (v.emptyState) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-500">
        {v.emptyState}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-amber-900/30 bg-gradient-to-br from-zinc-950 to-black p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/80">Certificate of location</p>
      <h3 className="mt-2 text-lg font-semibold text-amber-50">{v.headline}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge label={v.statusBadge.label} tone={v.statusBadge.tone} />
        <Badge label={v.readinessBadge.label} tone={v.readinessBadge.tone} />
        <Badge label={v.riskBadge.label} tone={v.riskBadge.tone} />
      </div>
    </div>
  );
}
