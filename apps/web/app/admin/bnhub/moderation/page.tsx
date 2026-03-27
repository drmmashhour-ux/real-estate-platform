import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { AdminShortTermModeration } from "@/src/modules/bnhub/ui/AdminShortTermModeration";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    redirect("/admin");
  }
  return <AdminShortTermModeration />;
}

