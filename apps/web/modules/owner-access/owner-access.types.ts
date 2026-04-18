import type { PlatformRole } from "@prisma/client";

/** Platform admin sees all qualifying rows; office executives see scoped offices. */
export type ExecutiveScope =
  | { kind: "platform" }
  | { kind: "office"; officeIds: string[]; brokerUserIds: string[] };

export type ExecutiveSession = {
  userId: string;
  role: PlatformRole;
  scope: ExecutiveScope;
};
