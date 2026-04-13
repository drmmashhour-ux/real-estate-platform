import { redirect } from "next/navigation";

/** Admin shortcut → new short-term stay listing (same wizard as host). */
export default function AdminNewStayRedirectPage() {
  redirect("/bnhub/host/listings/new");
}
