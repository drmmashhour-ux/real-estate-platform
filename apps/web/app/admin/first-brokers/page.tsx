import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { FirstBrokersClient } from "./FirstBrokersClient";

export const metadata = {
  title: "First 10 courtiers — Montréal & Laval | LECIPM",
};

export default async function FirstBrokersPage() {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login?next=/admin/first-brokers");
  if (!(await isPlatformAdmin(userId))) {
    redirect("/dashboard/admin/command-center");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-2 text-center text-[11px] text-zinc-500">
        Données stockées côté serveur (fichier JSON) — ne pas y mettre d&apos;info sensible non chiffrée.
      </div>
      <FirstBrokersClient />
    </div>
  );
}
