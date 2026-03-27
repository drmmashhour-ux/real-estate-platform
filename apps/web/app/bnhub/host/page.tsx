import { redirect } from "next/navigation";

/** Canonical host area — dashboard is the main entry. */
export default function BnhubHostIndexPage() {
  redirect("/bnhub/host/dashboard");
}
