export interface RealEstateListingService {
  listByCity(city: string): Promise<import("../models/index.js").RealEstateListing[]>;
}

export const realEstateListingServiceStub: RealEstateListingService = {
  async listByCity() {
    return [];
  },
};
