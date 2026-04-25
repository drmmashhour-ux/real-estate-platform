import { redirect } from "next/navigation";

/** Quick-link target from Executive Command Center → broker market surface. */
export default function BrokerMarketWatchZonesRedirectPage() {
  redirect("/dashboard/broker");
}
