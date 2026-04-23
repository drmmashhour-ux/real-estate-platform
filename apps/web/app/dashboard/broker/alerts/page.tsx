import { redirect } from "next/navigation";

/** Quick-link target from Executive Command Center → digest / activity (alerts vary by locale). */
export default function BrokerAlertsRedirectPage() {
  redirect("/dashboard/broker/digest");
}
