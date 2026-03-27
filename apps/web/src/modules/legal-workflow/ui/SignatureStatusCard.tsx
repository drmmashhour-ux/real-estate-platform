type Signature = { id: string; signerName: string; signerEmail: string; status: string };

export function SignatureStatusCard({ signatures }: { signatures: Signature[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Signature readiness</p>
      <ul className="mt-2 space-y-1 text-xs text-slate-300">
        {signatures.length ? signatures.map((s) => <li key={s.id}>{s.signerName} ({s.signerEmail}) · {s.status}</li>) : <li className="text-slate-500">No signature entries yet.</li>}
      </ul>
    </div>
  );
}
