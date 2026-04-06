import { redirect } from "next/navigation";

/** Admin shortcut → host BNHub listing wizard (canonical create flow). */
export default function AdminNewListingRedirectPage() {
  redirect("/bnhub/host/listings/new");
}
