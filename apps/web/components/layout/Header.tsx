import { cookies } from "next/headers";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const cookieStore = await cookies();
  const guestId = cookieStore.get("lecipm_guest_id")?.value ?? null;
  const roleCookie = cookieStore.get("hub_user_role")?.value ?? null;

  return (
    <HeaderClient
      loggedIn={Boolean(guestId)}
      roleCookie={roleCookie}
    />
  );
}

