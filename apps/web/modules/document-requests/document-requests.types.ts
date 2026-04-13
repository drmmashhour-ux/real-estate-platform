import type {
  CoordinationTargetRole,
  DealRequestCategory,
  DealRequestItemStatus,
  DealRequestStatus,
} from "@prisma/client";

export type { CoordinationTargetRole, DealRequestCategory, DealRequestItemStatus, DealRequestStatus };

export type CreateDealRequestInput = {
  requestType: string;
  requestCategory: DealRequestCategory;
  title: string;
  summary?: string | null;
  targetRole: CoordinationTargetRole;
  targetEntityType?: string | null;
  targetEntityId?: string | null;
  dueAt?: Date | null;
  metadata?: Record<string, unknown>;
  items?: Array<{
    itemKey: string;
    itemLabel: string;
    isRequired?: boolean;
  }>;
};

export type PatchDealRequestInput = {
  status?: DealRequestStatus;
  title?: string;
  summary?: string | null;
  dueAt?: Date | null;
  blockedReason?: string | null;
  metadata?: Record<string, unknown>;
  brokerApprovedAt?: Date | null;
};
