export type RealEstateListing = {
  id: string;
  ownerId: string;
  title: string;
  address: string;
  city: string;
  country: string;
  priceCents: number;
  propertyType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
