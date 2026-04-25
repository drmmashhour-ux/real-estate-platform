import type { Metadata } from "next";
import FieldTeamDashboardClient from "@/components/team/FieldTeamDashboardClient";
import { requireFieldTeamAdminPage } from "@/lib/admin/field-team-admin";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Field Demo Team — Admin | LECIPM",
  description:
    "Recruit, interview, train, and manage Field Demo Specialists: candidates, rubric, training links, active team, and performance.",
};

export default async function AdminFieldTeamPage() {
  const { user } = await getSession();
  requireFieldTeamAdminPage(user);

  return <FieldTeamDashboardClient />;
}
