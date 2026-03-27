import type { FolderContext } from "@/modules/documents/services/create-folder";

export function parseFolderContextFromParams(
  type: string | null,
  id: string | null
): FolderContext | null {
  if (!type || !id) return null;
  switch (type) {
    case "listing":
      return { kind: "listing", id };
    case "client":
      return { kind: "client", id };
    case "offer":
      return { kind: "offer", id };
    case "contract":
      return { kind: "contract", id };
    case "appointment":
      return { kind: "appointment", id };
    case "conversation":
      return { kind: "conversation", id };
    default:
      return null;
  }
}
