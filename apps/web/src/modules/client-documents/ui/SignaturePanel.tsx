import { useState } from "react";

export function SignaturePanel({ onSign }: { onSign: (name: string, email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-semibold text-white">Signature</p>
      <p className="mt-1 text-xs text-slate-400">Confirm you reviewed this document before signing.</p>
      <div className="mt-2 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" placeholder="Signer name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-white" placeholder="Signer email" />
        <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /> I have reviewed and understand this document.</label>
        <button type="button" disabled={!confirmed || !name.trim() || !email.trim()} onClick={() => onSign(name.trim(), email.trim())} className="w-full rounded-md bg-[#C9A646] px-3 py-2 text-xs font-medium text-black disabled:opacity-50">Submit signature</button>
      </div>
    </div>
  );
}
