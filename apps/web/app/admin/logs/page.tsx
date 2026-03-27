import { redirect } from "next/navigation";

/** /admin/logs → audit logs */
export default function AdminLogsPage() {
  redirect("/admin/audit");
}
