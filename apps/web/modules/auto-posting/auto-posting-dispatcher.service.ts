import { listPostingQueue, updatePostStatus } from "./auto-posting-queue.service";
import { postToInstagram, postToFacebookPage, postToLinkedIn, postToYouTubeShortsMetadata, queueTikTokExport } from "./auto-posting-platforms.service";
import type { PostingItem } from "./auto-posting.types";

export async function dispatchDuePosts() {
  const now = new Date();
  const due = listPostingQueue().filter(p => 
    p.status === "APPROVED" || 
    (p.status === "SCHEDULED" && p.scheduledAt && new Date(p.scheduledAt) <= now)
  );
  
  for (const post of due) {
    await dispatchPost(post);
  }
}

export async function dispatchPost(post: PostingItem) {
  updatePostStatus(post.id, "POSTING");
  
  try {
    let result;
    switch (post.platform) {
      case "INSTAGRAM":
        result = await postToInstagram(post);
        break;
      case "FACEBOOK":
        result = await postToFacebookPage(post);
        break;
      case "LINKEDIN":
        result = await postToLinkedIn(post);
        break;
      case "YOUTUBE_SHORTS":
        result = await postToYouTubeShortsMetadata(post);
        break;
      case "TIKTOK":
        result = await queueTikTokExport(post);
        break;
      default:
        throw new Error(`Unsupported platform: ${post.platform}`);
    }
    
    if (result.success) {
      if (result.fallbackTriggered) {
        updatePostStatus(post.id, "EXPORTED");
      } else {
        updatePostStatus(post.id, "POSTED");
      }
    } else {
      updatePostStatus(post.id, "FAILED");
    }
  } catch (error: any) {
    console.error(`Dispatch failed for post ${post.id}:`, error);
    updatePostStatus(post.id, "FAILED");
  }
}
