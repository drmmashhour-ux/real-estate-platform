import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";

/** Use at the start of protected server layouts/guards so session checks are not skipped by prerender/caching. */
export async function ensureDynamicAuthRequest(): Promise<void> {
  noStore();
  await connection();
}
