import { listDocumentVersions } from "./versioning.service";
import { listSuggestionDecisions } from "./audit-trail.service";

export async function getDealReviewBundle(dealId: string, documentIds: string[]) {
  const [decisions, versionsByDoc] = await Promise.all([
    listSuggestionDecisions(dealId),
    Promise.all(documentIds.map((id) => listDocumentVersions(id))),
  ]);
  return { decisions, versionsByDoc };
}
