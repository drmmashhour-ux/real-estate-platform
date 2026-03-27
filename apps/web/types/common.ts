/** Cross-cutting domain primitives (IDs, pagination, etc.). */

export type TenantId = string;
export type UserId = string;

export type Pagination = {
  limit: number;
  offset: number;
};
