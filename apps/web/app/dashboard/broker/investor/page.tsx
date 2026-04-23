import { redirect } from "next/navigation";

/** Quick-link target from Executive Command Center → investor hub. */
export default function BrokerInvestorRedirectPage() {
  redirect("/dashboard/investor");
}
