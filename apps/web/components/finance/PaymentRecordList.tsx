import type { PaymentRecordStatus, PaymentRecordType } from "@/types/tenancy-finance-enums-client";

export type PaymentRow = {
  id: string;
  type: PaymentRecordType;
  status: PaymentRecordStatus;
  amount: number;
  currency: string;
  createdAt: string;
};

export function PaymentRecordList(props: { payments: PaymentRow[] }) {
  if (props.payments.length === 0) {
    return <p className="text-sm text-slate-500">No payment records yet.</p>;
  }
  return (
    <ul className="divide-y divide-white/10 rounded border border-white/10">
      {props.payments.map((p) => (
        <li key={p.id} className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm">
          <span>
            {p.type} · {p.status}
          </span>
          <span>
            {p.amount.toFixed(2)} {p.currency}
          </span>
          <span className="w-full text-xs text-slate-500">{p.createdAt}</span>
        </li>
      ))}
    </ul>
  );
}
