import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FieldDashboardClient } from "@/components/field/FieldDashboardClient";
import { getSession } from "@/lib/auth/get-session";

export const metadata: Metadata = {
  title: "Field Demo Team | LECIPM",
  description:
    "Tableau de bord terrain : pistes courtiers, script de démo, suivi des rencontres et objectifs quotidiens pour l’équipe démo LECIPM.",
};

export default async function FieldTeamPage() {
  const { user } = await getSession();
  if (!user) {
    redirect("/auth/login?next=/field");
  }

  return <FieldDashboardClient agentUserId={user.id} agentEmail={user.email} />;
}
