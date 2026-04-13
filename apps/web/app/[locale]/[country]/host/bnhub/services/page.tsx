import { redirect } from "next/navigation";

/** Canonical host hospitality routes live under `/bnhub/host/…`. */
export default function HostBnhubServicesAliasPage() {
  redirect("/bnhub/host/dashboard");
}
