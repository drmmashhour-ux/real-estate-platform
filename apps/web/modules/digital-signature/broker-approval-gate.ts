import { prisma } from "@/lib/db";
import { canonicalDocumentSha256 } from "./document-hash";

export function requireDigitalSignatureForLegalDocApproval(): boolean {
  if (process.env.LECIPM_REQUIRE_DIGITAL_SIGNATURE_FOR_APPROVAL === "0" || process.env.LECIPM_REQUIRE_DIGITAL_SIGNATURE_FOR_APPROVAL === "false") {
    return false;
  }
  return true;
}

export async function assertBrokerDigitalSignatureMatchesDocument(input: {
  artifactId: string;
  approverUserId: string;
}): Promise<void> {
  if (!requireDigitalSignatureForLegalDocApproval()) return;

  const artifact = await prisma.lecipmLegalDocumentArtifact.findUnique({
    where: { id: input.artifactId },
    include: { templateVersion: true },
  });
  if (!artifact) throw new Error("Artifact not found.");

  const expectedHash = canonicalDocumentSha256({
    templateVersionId: artifact.templateVersionId,
    templateVersionNumber: artifact.templateVersion.versionNumber,
    renderedHtml: artifact.renderedHtml,
  });

  const sig = await prisma.digitalSignature.findFirst({
    where: {
      legalDocumentArtifactId: input.artifactId,
      signedByUserId: input.approverUserId,
      signerRole: "BROKER",
      documentHash: expectedHash,
    },
  });
  if (!sig) {
    throw new Error(
      "Broker electronic signature required: sign the current document revision with consent before approval (hash mismatch or missing signature).",
    );
  }
}
