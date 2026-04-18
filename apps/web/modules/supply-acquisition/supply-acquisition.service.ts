import { buildMontrealMarketSnapshot } from "@/modules/market-intelligence/montreal-market.service";
import { scoreAcquisitionTargets, type ScoredAcquisitionTarget } from "./acquisition-scorer.service";
import { buildHostOutreachDraft, type HostOutreachDraft } from "./host-acquisition.service";
import { buildBrokerRoiPreview, type BrokerPreviewDraft } from "./broker-acquisition.service";
import { buildSellerPitchDraft, type SellerPitchDraft } from "./seller-acquisition.service";

export type SupplyAcquisitionBundle = {
  snapshotGeneratedAt: string;
  targets: ScoredAcquisitionTarget[];
  sampleHostDraft: HostOutreachDraft | null;
  sampleBrokerPreview: BrokerPreviewDraft;
  sampleSellerPitch: SellerPitchDraft;
};

export async function buildSupplyAcquisitionBundle(): Promise<SupplyAcquisitionBundle> {
  const snap = await buildMontrealMarketSnapshot();
  const targets = scoreAcquisitionTargets(snap.opportunities);
  const top = targets[0] ?? null;
  return {
    snapshotGeneratedAt: snap.generatedAt,
    targets,
    sampleHostDraft: top ? buildHostOutreachDraft(top) : null,
    sampleBrokerPreview: buildBrokerRoiPreview(top),
    sampleSellerPitch: buildSellerPitchDraft(top),
  };
}
