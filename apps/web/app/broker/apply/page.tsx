import { redirect } from "next/navigation";

/** /broker/apply → dashboard broker apply (same flow) */
export default function BrokerApplyRedirect() {
  redirect("/dashboard/broker/apply");
}
