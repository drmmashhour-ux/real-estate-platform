import { BNHubLoginForm } from "./bnhub-login-form";
import { isDemoAuthAllowed } from "@/lib/auth/demo-auth-allowed";

export default function BNHubLoginPage() {
  const demoAuthAllowed = isDemoAuthAllowed();
  return <BNHubLoginForm demoAuthAllowed={demoAuthAllowed} />;
}
