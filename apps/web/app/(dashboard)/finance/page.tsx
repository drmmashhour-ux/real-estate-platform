import { redirect } from "next/navigation";

export default function FinanceShortcutPage() {
  redirect("/dashboard/billing");
}
