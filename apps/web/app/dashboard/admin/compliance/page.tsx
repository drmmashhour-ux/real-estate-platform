import { redirect } from "next/navigation";

/** Quick-link target from Executive Command Center → canonical compliance hub. */
export default function AdminComplianceRedirectPage() {
  redirect("/dashboard/compliance");
}
