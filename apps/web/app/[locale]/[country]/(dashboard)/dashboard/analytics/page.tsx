import { redirect } from "next/navigation";

/** Platform analytics: admin dashboard; mortgage experts use `/dashboard/expert/analytics`. */
export default function DashboardAnalyticsAliasPage() {
  redirect("/dashboard/admin");
}
