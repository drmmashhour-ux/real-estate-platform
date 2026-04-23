import { redirect } from "next/navigation";

/** Quick-link target from Executive Command Center → admin transactions. */
export default function AdminFinancialTransactionsRedirectPage() {
  redirect("/dashboard/admin/transactions");
}
