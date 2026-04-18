const API_BASE = process.env.PANDADOC_API_BASE ?? "https://api.pandadoc.com/public/v1";

/**
 * PandaDoc: multipart PDF upload then send.
 * @see https://developers.pandadoc.com/reference/upload-document
 */
export async function pandadocUploadPdfAndSend(input: {
  name: string;
  base64Pdf: string;
  recipients: { email: string; role: string; firstName?: string; lastName?: string }[];
}): Promise<{ id: string; status: string }> {
  const apiKey = process.env.PANDADOC_API_KEY;
  if (!apiKey) throw new Error("PANDADOC_API_KEY not configured");

  const buffer = Buffer.from(input.base64Pdf, "base64");
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([buffer], { type: "application/pdf" }),
    "signable-bundle.pdf",
  );
  formData.append(
    "data",
    JSON.stringify({
      name: input.name,
      recipients: input.recipients.map((r, i) => ({
        email: r.email,
        role: r.role || `Signer${i + 1}`,
        first_name: r.firstName ?? r.email.split("@")[0],
        last_name: r.lastName ?? "",
      })),
    }),
  );

  const createRes = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    headers: {
      Authorization: `API-Key ${apiKey}`,
    },
    body: formData,
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`PandaDoc upload failed: ${createRes.status} ${errText}`);
  }
  const created = (await createRes.json()) as { id: string; status: string };

  const sendRes = await fetch(`${API_BASE}/documents/${created.id}/send`, {
    method: "POST",
    headers: {
      Authorization: `API-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ silent: false }),
  });
  if (!sendRes.ok) {
    const errText = await sendRes.text();
    throw new Error(`PandaDoc send failed: ${sendRes.status} ${errText}`);
  }
  const sent = (await sendRes.json()) as { id?: string; status?: string };
  return { id: sent.id ?? created.id, status: sent.status ?? "document.sent" };
}
