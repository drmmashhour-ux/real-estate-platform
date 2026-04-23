import { addDays, format, setHours, setMinutes } from "date-fns";
import type { WeeklyContentItem, WeeklyContentPlan, MarketingWeekPlanConfig } from "./marketing-week-plan.types";
import { createVideoJob } from "../auto-video/auto-video-job.service";
import type { AutoVideoRequest, AutoVideoSourceType } from "../auto-video/auto-video.types";
import { createContentItem } from "../marketing-content/content-calendar.service";

const PLATFORMS = ["TIKTOK", "INSTAGRAM", "YOUTUBE_SHORTS"] as const;
const SLOTS = ["11:00", "14:00", "19:00"];

export function generateWeeklyPlan(config: MarketingWeekPlanConfig): WeeklyContentPlan {
  const items: WeeklyContentItem[] = [];
  
  for (let day = 1; day <= 7; day++) {
    // Each day: 2 videos, 1 poster, 1 story (optional, lets do it)
    const dailyConfig: Array<{ type: WeeklyContentItem["type"]; platform: WeeklyContentItem["platform"] }> = [
      { type: "VIDEO", platform: "TIKTOK" },
      { type: "VIDEO", platform: "INSTAGRAM" },
      { type: "POSTER", platform: "INSTAGRAM" },
      { type: "STORY", platform: "INSTAGRAM" },
    ];

    dailyConfig.forEach((conf, index) => {
      // Rotate focus area, audience, goal
      const area = config.focusAreas[(day + index) % config.focusAreas.length]!;
      const audience = config.audiences[(day + index) % config.audiences.length]!;
      const goal = config.goals[(day + index) % config.goals.length]!;

      let title = "";
      let hook = "";
      let script = "";
      let caption = "";
      let cta = "";
      let sourceType: AutoVideoSourceType = "MANUAL";

      // Distribution mix logic
      const roll = (day * 10 + index) % 100;
      if (roll < 30) {
        // Listings showcase
        title = `Luxury Residence in ${area} (${conf.platform} Day ${day} #${index})`;
        hook = `Searching for your dream home in ${area}?`;
        script = `Take a look at this stunning property in ${area}. Premium finishes, open layout, and located in the heart of ${config.city}.`;
        cta = "Book a private viewing";
        sourceType = "LISTING";
      } else if (roll < 55) {
        // Broker focused
        title = `Join LECIPM in ${config.city} (${conf.platform} Batch ${day} #${index})`;
        hook = "Stop chasing leads and start closing deals.";
        script = `Our platform routes high-intent buyers directly to you. Join the elite network of Montreal brokers today.`;
        cta = "Apply to join our network";
        sourceType = "BROKER_ACQ";
      } else if (roll < 80) {
        // Investor focused
        title = `Investor Brief: ${area} (${conf.platform} ${day}/${format(addDays(new Date(), day - 1), "MMM")} #${index})`;
        hook = "The highest yield areas in Montreal right now.";
        script = `We analyzed the data for ${area}. Low vacancy, rising rents, and high liquidity make this a top choice for Q2.`;
        cta = "Get the full investor report";
        sourceType = "INVESTOR_OP";
      } else {
        // Lifestyle / Location
        title = `Gems of ${area} (${conf.platform} Day ${day} #${index})`;
        hook = `The best coffee and walks in ${area}.`;
        script = `Montreal is more than just buildings. It's the lifestyle. Discover our favourite spots in ${area} this weekend.`;
        cta = "Explore the Montreal hub";
        sourceType = "MANUAL";
      }

      const hashtags = [
        config.city.toLowerCase(),
        area.toLowerCase().replace(/\s+/g, ""),
        audience.toLowerCase(),
        "lecipm",
        "luxuryrealestate"
      ];
      
      caption = `${title}\n\n${hook}\n\n${script}\n\n${hashtags.map(h => `#${h}`).join(" ")}\n\n${cta}`;

      const item: WeeklyContentItem = {
        id: `wci_${day}_${index}`,
        day,
        time: SLOTS[index % SLOTS.length]!,
        platform: conf.platform,
        type: conf.type,
        title,
        hook,
        script,
        caption,
        hashtags,
        cta,
        city: config.city,
        area,
        audience,
        goal,
        status: "READY_FOR_APPROVAL",
      };

      if (item.type === "VIDEO") {
        const videoRequest: AutoVideoRequest = {
          id: `req_${item.id}`,
          sourceType,
          sourceId: "mock_source",
          targetPlatform: item.platform === "YOUTUBE_SHORTS" ? "YOUTUBE" : item.platform as any,
          targetAspectRatio: "9:16",
          audience: item.audience,
          goal: item.goal as any,
          title: item.title,
          hook: item.hook,
          cta: item.cta,
          mediaAssets: [
            { id: "m1", kind: "image", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", label: "Hero" }
          ],
          sceneStyle: "LUXURY_STATIC",
          status: "READY_FOR_APPROVAL",
          templateId: sourceType === "LISTING" ? "LISTING_SPOTLIGHT" : 
                      sourceType === "BROKER_ACQ" ? "BROKER_RECRUITMENT" :
                      sourceType === "INVESTOR_OP" ? "INVESTOR_OPPORTUNITY" : "LUXURY_SHOWCASE",
          attribution: { landingPagePath: `/city/${config.city.toLowerCase()}` },
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
        const job = createVideoJob(videoRequest);
        item.videoRequestId = job.id;
      }

      items.push(item);
    });
  }

  return {
    id: `plan_mtl_${Date.now()}`,
    config,
    items,
    generatedAtIso: new Date().toISOString(),
  };
}

export function deployPlanToCalendar(plan: WeeklyContentPlan) {
  const now = new Date();
  plan.items.forEach(item => {
    const scheduledDate = addDays(now, item.day - 1);
    const [hours, minutes] = item.time.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(scheduledDate, hours!), minutes!);

    createContentItem({
      title: item.title,
      type: item.type === "STORY" ? "POSTER" : item.type as any,
      platform: item.platform === "YOUTUBE_SHORTS" ? "YOUTUBE" : item.platform as any,
      hook: item.hook,
      script: item.script,
      caption: item.caption,
      audience: item.audience as any,
      goal: item.goal as any,
      status: "READY_FOR_APPROVAL",
      scheduledDate: format(scheduledAt, "yyyy-MM-dd"),
    });
  });
}
