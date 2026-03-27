import { getActiveDocument } from "@/lib/legal/documents";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";
import { TERMS_FR_HTML } from "@/lib/legal/default-legal-fr";

export default async function TermsPageFr() {
  const doc = await getActiveDocument(LEGAL_DOCUMENT_TYPES.TERMS);
  const content = doc?.content?.trim() || TERMS_FR_HTML;
  const version = doc?.version ?? null;

  return (
    <>
      <h1 className="text-3xl font-bold text-white">Conditions d&apos;utilisation</h1>
      {version && <p className="mt-2 text-sm text-[#737373]">Version {version}</p>}
      <div
        className="prose prose-invert mt-8 max-w-none prose-headings:text-[#E8C547] prose-p:text-[#D4D4D4] prose-a:text-[#C9A646]"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
}
