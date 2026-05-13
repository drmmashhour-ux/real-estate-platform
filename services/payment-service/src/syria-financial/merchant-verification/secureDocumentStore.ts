import { documentReferenceSchema, type DocumentReference, type SecureDocumentStorage } from "./types.js";

export class InMemorySecureDocumentReferenceStore implements SecureDocumentStorage {
  private readonly references = new Map<string, DocumentReference>();

  async createReference(reference: DocumentReference): Promise<DocumentReference> {
    const parsed = documentReferenceSchema.parse(reference);
    this.references.set(parsed.documentId, Object.freeze(parsed));
    return parsed;
  }

  async getReference(documentId: string): Promise<DocumentReference | null> {
    return this.references.get(documentId) ?? null;
  }
}
