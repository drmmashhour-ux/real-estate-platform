export interface CrmClientService {
  listByBroker(brokerId: string): Promise<import("../models/index.js").Client[]>;
}

export const crmClientServiceStub: CrmClientService = {
  async listByBroker() {
    return [];
  },
};
