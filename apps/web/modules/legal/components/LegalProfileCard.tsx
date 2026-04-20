type Profile = {
  overallLegalRiskScore: number;
  latestRiskLevel: string;
  latentDefectRiskScore: number;
  disclosureRiskScore: number;
  fraudRiskScore: number;
  lastEvaluatedAt: string | null;
};

export function LegalProfileCard({ title, profile }: { title: string; profile: Profile | null }) {
  if (!profile) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{title}</p>
        <p className="mt-2 text-sm text-slate-500">No profile stored yet.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-premium-gold/25 bg-black/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">{title}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
        <div>
          <dt className="text-slate-500">Overall</dt>
          <dd className="font-semibold text-white">{Math.round(profile.overallLegalRiskScore)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Level</dt>
          <dd>{profile.latestRiskLevel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Latent</dt>
          <dd>{Math.round(profile.latentDefectRiskScore)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Disclosure</dt>
          <dd>{Math.round(profile.disclosureRiskScore)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Fraud</dt>
          <dd>{Math.round(profile.fraudRiskScore)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Updated</dt>
          <dd className="text-[11px] text-slate-500">{profile.lastEvaluatedAt ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
