/** Admin BNHub hospitality catalog — fields used by `AdminHospitalityClient`. */

export type BnhubServiceAdminRow = {
  id: string;
  serviceCode: string;
  name: string;
  category: string;
  isActive: boolean;
  isPremiumTier: boolean;
};
