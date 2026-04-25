import { permanentRedirect } from "next/navigation";

/** Legacy URL — canonical is `/bnhub/montreal`. */
export default function MontrealStaysLegacyRedirect() {
  permanentRedirect("/bnhub/montreal");
}
