import { redirect } from "next/navigation";

/** @deprecated Use `/admin/soft-launch` — kept for bookmarks. */
export default function AdminLaunchLegacyRedirectPage() {
  redirect("/admin/soft-launch");
}
