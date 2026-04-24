"use client";

export function TrustAccountPanel(props: {
  trustAccountId?: string | null;
  payer?: string;
  beneficiary?: string;
  contractLinked?: boolean;
  cashReceiptId?: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-zinc-950 p-4 text-white text-sm space-y-2">
      <h3 className="text-[#D4AF37] font-semibold">Trust account</h3>
      <div className="grid gap-1 text-gray-300">
        <div>
          Account:{" "}
          <span className="font-mono text-white">{props.trustAccountId ?? "— not linked —"}</span>
        </div>
        <div>Payer: {props.payer ?? "—"}</div>
        <div>Beneficiary: {props.beneficiary ?? "—"}</div>
        <div>Contract linkage: {props.contractLinked ? "yes" : "no"}</div>
        <div>Cash receipt: {props.cashReceiptId ?? "—"}</div>
      </div>
    </div>
  );
}
