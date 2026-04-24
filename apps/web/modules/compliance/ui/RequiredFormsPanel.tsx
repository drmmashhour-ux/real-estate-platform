"use client";

export function RequiredFormsPanel(props: {
  cashReceiptRequired: boolean;
  cashReceiptId?: string | null;
  invoiceId?: string | null;
  auditPackId?: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-zinc-950 p-4 text-white text-sm space-y-2">
      <h3 className="text-[#D4AF37] font-semibold">Required forms</h3>
      <ul className="space-y-1 text-gray-300">
        <li>
          Official cash receipt:{" "}
          {props.cashReceiptRequired ? (
            <span className={props.cashReceiptId ? "text-emerald-400" : "text-amber-400"}>
              {props.cashReceiptId ?? "required"}
            </span>
          ) : (
            <span className="text-gray-500">n/a</span>
          )}
        </li>
        <li>
          Tax invoice: <span className="font-mono">{props.invoiceId ?? "—"}</span>
        </li>
        <li>
          Audit export pack: <span className="font-mono">{props.auditPackId ?? "—"}</span>
        </li>
      </ul>
    </div>
  );
}
