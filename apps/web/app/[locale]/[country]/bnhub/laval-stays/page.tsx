import { permanentRedirect } from "next/navigation";

/** Legacy URL — canonical is `/bnhub/laval`. */
export default function LavalStaysLegacyRedirect() {
  permanentRedirect("/bnhub/laval");
}
