import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Legacy URL — Seller Hub wizard lives under /dashboard/seller/create */
export default async function SellCreateRedirectPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/auth/login?returnUrl=/dashboard/seller/create");
  }
  redirect("/dashboard/seller/create");
}
