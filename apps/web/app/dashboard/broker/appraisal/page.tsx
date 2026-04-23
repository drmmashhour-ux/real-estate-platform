import { redirect } from "next/navigation";

/** Quick-link target from Executive Command Center → acquisition / analysis hub. */
export default function BrokerAppraisalRedirectPage() {
  redirect("/dashboard/investor/acquisition");
}
