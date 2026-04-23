import type { AIWorkflow } from "@prisma/client";

export type WorkflowClientDto = {
  id: string;
  ownerType: string;
  ownerId: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  requiresApproval: boolean;
  steps: unknown;
  result: unknown;
  createdAt: string;
  updatedAt: string;
};

export function workflowToClientDto(wf: AIWorkflow): WorkflowClientDto {
  return {
    id: wf.id,
    ownerType: wf.ownerType,
    ownerId: wf.ownerId,
    type: wf.type,
    status: wf.status,
    title: wf.title,
    description: wf.description,
    requiresApproval: wf.requiresApproval,
    steps: wf.steps,
    result: wf.result,
    createdAt: wf.createdAt.toISOString(),
    updatedAt: wf.updatedAt.toISOString(),
  };
}
