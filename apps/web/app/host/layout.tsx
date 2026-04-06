import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { HostShell } from "@/components/host/HostShell";

export const dynamic = "force-dynamic";

export default async function HostSectionLayout({ children }: { children: React.ReactNode }) {
  const id = await getGuestId();
  if (!id) {
    redirect("/auth/login?next=/host");
  }
  return <HostShell>{children}</HostShell>;
}
