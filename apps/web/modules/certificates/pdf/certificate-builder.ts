import { IMMOVABLE_CERTIFICATE_DISCLAIMER_EN, IMMOVABLE_CERTIFICATE_DISCLAIMER_FR } from "../lib/disclaimer";
import { ImmovableCertificate } from "../types/immovable-certificate.types";

export function buildCertificateHTML(cert: ImmovableCertificate): string {
  console.log("[certificate:pdf]", cert.id);

  return `
  <html>
  <body style="font-family: Arial;">
    <h1>CERTIFICATE OF THE STATE OF THE IMMOVABLE</h1>

    <p style="font-size: 11px; border: 1px solid #444; padding: 8px; margin-bottom: 16px;">
      ${IMMOVABLE_CERTIFICATE_DISCLAIMER_EN}
    </p>

    <h2>Identification</h2>
    <p>${cert.syndicateName}</p>
    <p>${cert.buildingAddress}</p>

    <h2>Condition</h2>
    <p>${cert.condition.level}</p>

    <h3>Deficiencies</h3>
    <p>${cert.condition.deficiencies.join(", ")}</p>

    <h2>Financial</h2>
    <p>Annual: ${cert.financial.annualContribution ?? "-"}</p>
    <p>Estimated Work: ${cert.financial.estimatedWorkCost ?? "-"}</p>

    <h2>Conclusion</h2>
    <p>
      ${cert.conclusion.needsWork ? "Requires intervention" : "Good condition"}
    </p>

    <hr />

    <h1>CERTIFICAT (FR)</h1>

    <h2>État</h2>
    <p>${cert.condition.level}</p>

    <h2>Conclusion</h2>
    <p>
      ${cert.conclusion.majorWork ? "Travaux majeurs requis" : ""}
    </p>

    <p style="font-size: 11px; border: 1px solid #444; padding: 8px; margin-top: 16px;">
      ${IMMOVABLE_CERTIFICATE_DISCLAIMER_FR}
    </p>

    <p style="font-size: 12px;">
      ${IMMOVABLE_CERTIFICATE_DISCLAIMER_EN}
    </p>
  </body>
  </html>
  `;
}
