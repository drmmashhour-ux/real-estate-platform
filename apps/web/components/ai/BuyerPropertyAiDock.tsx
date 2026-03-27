"use client";

import { HubAiDock } from "./HubAiDock";

export function BuyerPropertyAiDock(props: {
  listingId: string;
  title?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
}) {
  return (
    <div className="mt-6">
      <HubAiDock
        hub="buyer"
        context={{
          listingId: props.listingId,
          title: props.title,
          price: props.price,
          bedrooms: props.bedrooms,
          bathrooms: props.bathrooms,
        }}
      />
    </div>
  );
}
