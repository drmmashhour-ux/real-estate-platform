/** Admin host leads table — minimal row without `@prisma/client`. */

export type HostLeadRowView = {
  id: string;
  email: string | null;
  phone: string | null;
  funnelStatus: string;
  source: string;
  city: string | null;
  createdAt: Date | string;
};
