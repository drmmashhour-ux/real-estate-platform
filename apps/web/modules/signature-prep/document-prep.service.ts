import type { MapFormResult } from "../oaciq-mapper/mapper.types";
import { anchorForRole } from "./signature-field-mapper";
import { bufferToBase64, renderDraftSignablePdf } from "./pdf-renderer.service";

export type SignableBundle = {
  documents: { name: string; base64Pdf: string; documentId: string }[];
  anchorsUsed: { role: string; anchor: string }[];
};

/**
 * Converts mapped form fields into a draft PDF bundle for e-sign.
 * Broker must verify content against official instruments before sending.
 */
export async function buildSignableBundleFromMap(input: {
  formLabel: string;
  map: MapFormResult;
  participantRoles: string[];
}): Promise<SignableBundle> {
  const flatLines: { label: string; value: string }[] = [];
  for (const [k, v] of Object.entries(input.map.mappedFields)) {
    flatLines.push({ label: k, value: String(v ?? "") });
  }

  const anchors = input.participantRoles.map((role) => ({
    role,
    anchor: anchorForRole(role),
  }));

  const pdf = await renderDraftSignablePdf({
    title: `${input.formLabel} — draft signable bundle`,
    lines: flatLines.slice(0, 80),
    anchors,
  });

  const base64Pdf = bufferToBase64(pdf);

  return {
    documents: [
      {
        documentId: "1",
        name: `${input.formLabel}-bundle.pdf`,
        base64Pdf,
      },
    ],
    anchorsUsed: anchors,
  };
}
