import type { AutoVideoRequest, AutoVideoScene, AutoVideoTemplateId } from "./auto-video.types";
import { buildScene } from "./auto-video-scene.service";

export function generateScenesFromTemplate(
  templateId: AutoVideoTemplateId,
  request: AutoVideoRequest
): AutoVideoScene[] {
  const scenes: AutoVideoScene[] = [];
  const primaryMedia = request.mediaAssets[0]?.id;
  const secondaryMedia = request.mediaAssets[1]?.id || primaryMedia;

  // 1. Hook
  scenes.push(
    buildScene(
      "HOOK",
      "The Hook",
      { headline: request.hook, voiceover: request.hook },
      primaryMedia
    )
  );

  // 2. Feature / Value
  switch (templateId) {
    case "LISTING_SPOTLIGHT":
    case "LUXURY_SHOWCASE":
      scenes.push(
        buildScene(
          "FEATURE",
          "Main Feature",
          { headline: request.title, sub: "Exclusively on LECIPM" },
          secondaryMedia
        )
      );
      break;
    case "BNHUB_WEEKEND_STAY":
      scenes.push(
        buildScene(
          "FEATURE",
          "The Experience",
          { headline: "Perfect Weekend Getaway", sub: "Book via BNHub" },
          secondaryMedia
        )
      );
      break;
    case "BROKER_RECRUITMENT":
      scenes.push(
        buildScene(
          "FEATURE",
          "Why Join Us",
          { headline: "Built for Success", sub: "Premium Tools & Support" },
          secondaryMedia
        )
      );
      break;
    case "INVESTOR_OPPORTUNITY":
      scenes.push(
        buildScene(
          "PRICING",
          "Yield Potential",
          { headline: "High ROI Opportunity", sub: "Market-leading Cap Rate" },
          secondaryMedia
        )
      );
      break;
    default:
      scenes.push(
        buildScene(
          "FEATURE",
          "Value Proposition",
          { headline: request.title },
          secondaryMedia
        )
      );
  }

  // 3. CTA
  scenes.push(
    buildScene(
      "CTA",
      "Final Call",
      { headline: request.cta, sub: "lecipm.com" },
      primaryMedia,
      { text: "TAP LINK", position: "br" }
    )
  );

  return scenes;
}
