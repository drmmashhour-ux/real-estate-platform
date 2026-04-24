import { mkdir, unlink, writeFile } from "fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { scanBufferBeforeStorage } from "@/lib/security/malware-scan";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { SUPABASE_STORAGE_BUCKETS } from "@/lib/supabase/buckets";

const PDF = "application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Upload broker liability certificate PDF to private `documents` bucket at `broker-insurance/{brokerId}/…`.
 * Returns storage key for `BrokerInsurance.documentStorageKey`.
 */
export async function uploadBrokerInsurancePdf(params: {
  brokerId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ storageKey: string }> {
  const { brokerId, buffer, contentType } = params;
  if (buffer.length > MAX_BYTES) {
    throw new Error(`File too large (max ${MAX_BYTES / (1024 * 1024)}MB)`);
  }
  if (contentType !== PDF) {
    throw new Error("Only PDF uploads are accepted");
  }
  const scan = await scanBufferBeforeStorage({
    bytes: buffer,
    mimeType: contentType,
    context: "broker_professional_insurance_pdf",
  });
  if (!scan.ok) {
    throw new Error(scan.userMessage);
  }

  const filename = `${randomUUID()}.pdf`;
  const objectPath = `broker-insurance/${brokerId}/${filename}`;

  if (isSupabaseAdminConfigured()) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage.from(SUPABASE_STORAGE_BUCKETS.documents).upload(objectPath, buffer, {
      contentType: PDF,
      upsert: false,
    });
    if (error) {
      throw new Error(error.message || "Storage upload failed");
    }
    return { storageKey: objectPath };
  }

  const relative = path.join("broker-insurance", brokerId, filename);
  const dir = path.join(process.cwd(), "private", "uploads", "broker-insurance", brokerId);
  await mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, filename);
  await writeFile(diskPath, buffer);
  return { storageKey: `local:${relative}` };
}

export async function deleteBrokerInsuranceObject(storageKey: string): Promise<void> {
  if (storageKey.startsWith("local:")) {
    const rel = storageKey.slice("local:".length);
    const diskPath = path.join(process.cwd(), "private", "uploads", rel);
    try {
      await unlink(diskPath);
    } catch {
      /* ignore */
    }
    return;
  }
  if (!isSupabaseAdminConfigured()) return;
  const admin = getSupabaseAdmin();
  await admin.storage.from(SUPABASE_STORAGE_BUCKETS.documents).remove([storageKey]);
}
