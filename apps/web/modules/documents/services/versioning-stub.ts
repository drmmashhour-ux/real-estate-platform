/**
 * Future: PDF versioning, watermarking, stamping — keep boundary only.
 */
export async function versionDocumentFile(_documentFileId: string): Promise<null> {
  return null;
}

export async function stampContractPreview(_contractId: string): Promise<null> {
  return null;
}

export async function generateWatermarkedPdf(_buffer: Buffer): Promise<Buffer> {
  return _buffer;
}
