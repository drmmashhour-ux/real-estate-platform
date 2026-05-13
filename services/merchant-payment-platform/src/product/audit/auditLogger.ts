import { randomUUID } from "node:crypto";

export type ProductAuditCategory = "api_request" | "merchant_action" | "transaction_action";

export interface ProductAuditLog {
  id: string;
  category: ProductAuditCategory;
  action: string;
  actorUserId?: string;
  merchantId?: string;
  transactionId?: string;
  correlationId: string;
  metadata: Readonly<Record<string, string | number | boolean>>;
  createdAt: Date;
}

export class ProductAuditLogger {
  private readonly logs: ProductAuditLog[] = [];

  record(input: Omit<ProductAuditLog, "id" | "createdAt">): ProductAuditLog {
    const log = Object.freeze({
      id: randomUUID(),
      category: input.category,
      action: input.action,
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
      ...(input.merchantId ? { merchantId: input.merchantId } : {}),
      ...(input.transactionId ? { transactionId: input.transactionId } : {}),
      correlationId: input.correlationId,
      metadata: Object.freeze({ ...input.metadata }),
      createdAt: new Date(),
    });
    this.logs.push(log);
    return log;
  }

  list(): readonly ProductAuditLog[] {
    return Object.freeze([...this.logs]);
  }
}
