export type BanditArm = {
  id: string;
  domain: string;
  signalKey: string;
  actionType: string;
  weight: number;
  selectionCount: number;
  averageReward: number;
};
