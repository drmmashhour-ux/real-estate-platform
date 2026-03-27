import { redirect } from "next/navigation";

/**
 * Deal-room folders are `DocumentFolder` rows; the main file browser is Storage until a room-specific UI ships.
 */
export default async function DashboardDocumentRoomAliasPage() {
  redirect("/dashboard/storage");
}
