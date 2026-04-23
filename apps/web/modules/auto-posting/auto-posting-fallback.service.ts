import type { PostingItem } from "./auto-posting.types";

export type ExportPackage = {
  postId: string;
  caption: string;
  hashtags: string;
  mediaUrl?: string;
  platform: string;
  instructions: string;
};

export function generateExportPackage(post: PostingItem): ExportPackage {
  return {
    postId: post.id,
    caption: post.caption,
    hashtags: post.hashtags.join(" "),
    mediaUrl: post.mediaUrl,
    platform: post.platform,
    instructions: `1. Download media from ${post.mediaUrl || "source"}\n2. Copy caption and hashtags\n3. Post to ${post.platform} manually.`,
  };
}

export function downloadCaptionFile(post: PostingItem) {
  const blob = new Blob([post.caption + "\n\n" + post.hashtags.join(" ")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `caption-${post.id}.txt`;
  a.click();
}
