import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // For FSBO, we want to auto-create two drafts: Brokerage and Disclosure.
  // We'll redirect to the first one (Brokerage).
  redirect("/drafts/turbo?type=BROKERAGE_CONTRACT&role=SELLER");
}
