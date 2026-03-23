import { redirect } from "next/navigation";

export default function InvoiceRedirectPage() {
  redirect("/invoices");
}
