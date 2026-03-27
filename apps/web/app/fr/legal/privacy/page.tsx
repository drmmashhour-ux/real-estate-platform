import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { PRIVACY_FR_HTML } from "@/lib/legal/default-legal-fr";

export default async function PrivacyPageFr() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.PRIVACY);
  const content = doc?.content?.trim() || PRIVACY_FR_HTML;

  return (
    <>
      <h1 className="text-3xl font-bold text-white">Politique de confidentialité</h1>
      <div
        className="prose prose-invert mt-8 max-w-none prose-headings:text-[#E8C547] prose-p:text-[#D4D4D4] prose-a:text-[#C9A646]"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
