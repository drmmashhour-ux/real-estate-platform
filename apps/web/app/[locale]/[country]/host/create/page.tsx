import { redirect } from "next/navigation";

/** Legacy URL — canonical wizard lives under /host/listings/new */
export default function HostCreateRedirectPage() {
  redirect("/host/listings/new");
}
