import { formatPreviewValue } from "../utils/path-resolver";

export function renderFieldValue(raw: unknown): string {
  return formatPreviewValue(raw);
}
