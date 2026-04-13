import { redirect } from "next/navigation";

/** /dashboard/design-templates → design templates app */
export default function DashboardDesignTemplatesPage() {
  redirect("/design-templates");
}
