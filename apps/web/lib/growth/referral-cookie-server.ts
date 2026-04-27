import { REFERRAL_CODE_COOKIE } from "@/lib/growth/referral-constants";
import { isSecureCookieContext } from "@/lib/runtime-env";

/** `Set-Cookie` value to clear the first-touch referral cookie after successful processing. */
export function clearReferralCodeCookieHeader(): string {
  const sec = isSecureCookieContext() ? "; Secure" : "";
  return `${REFERRAL_CODE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${sec}`;
}
