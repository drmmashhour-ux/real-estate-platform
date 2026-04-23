import type { PostingItem, PostingQueueStore, PostingStatus, ApprovalStatus, PostingPlatform, PostingContentType } from "./auto-posting.types";

const STORAGE_KEY = "lecipm-auto-posting-queue-v1";

function loadStore(): PostingQueueStore {
  if (typeof window === "undefined") return { posts: {}, autonomyMode: "OFF" };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { posts: {}, autonomyMode: "OFF" };
  try {
    return JSON.parse(raw);
  } catch {
    return { posts: {}, autonomyMode: "OFF" };
  }
}

function saveStore(store: PostingQueueStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function listPostingQueue(): PostingItem[] {
  const store = loadStore();
  return Object.values(store.posts).sort((a, b) => (b.createdAtIso || "").localeCompare(a.createdAtIso || ""));
}

export function enqueuePost(input: {
  contentId: string;
  contentType: PostingContentType;
  platform: PostingPlatform;
  caption: string;
  hashtags: string[];
  mediaUrl?: string;
  scheduledAt?: string;
  createdBy: string;
}): PostingItem {
  const store = loadStore();
  const id = `post_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  
  const newItem: PostingItem = {
    id,
    ...input,
    status: "READY_FOR_APPROVAL",
    approvalStatus: "PENDING",
    createdAtIso: now,
    updatedAtIso: now,
  };
  
  store.posts[id] = newItem;
  saveStore(store);
  return newItem;
}

export function updatePostStatus(id: string, status: PostingStatus, approvalStatus?: ApprovalStatus): PostingItem | null {
  const store = loadStore();
  const post = store.posts[id];
  if (!post) return null;
  
  post.status = status;
  if (approvalStatus) post.approvalStatus = approvalStatus;
  post.updatedAtIso = new Date().toISOString();
  
  saveStore(store);
  return post;
}

export function reschedulePost(id: string, scheduledAt: string): PostingItem | null {
  const store = loadStore();
  const post = store.posts[id];
  if (!post) return null;
  
  post.scheduledAt = scheduledAt;
  post.status = "SCHEDULED";
  post.updatedAtIso = new Date().toISOString();
  
  saveStore(store);
  return post;
}

export function cancelScheduledPost(id: string): boolean {
  const store = loadStore();
  if (store.posts[id]) {
    store.posts[id]!.status = "DRAFT";
    store.posts[id]!.updatedAtIso = new Date().toISOString();
    saveStore(store);
    return true;
  }
  return false;
}

export function retryFailedPost(id: string): boolean {
  const store = loadStore();
  if (store.posts[id] && store.posts[id]!.status === "FAILED") {
    store.posts[id]!.status = "APPROVED";
    store.posts[id]!.updatedAtIso = new Date().toISOString();
    saveStore(store);
    return true;
  }
  return false;
}

export function deletePost(id: string): boolean {
  const store = loadStore();
  if (store.posts[id]) {
    delete store.posts[id];
    saveStore(store);
    return true;
  }
  return false;
}

export function getAutonomyMode() {
  return loadStore().autonomyMode;
}

export function setAutonomyMode(mode: PostingItem["platform"] extends any ? any : any) { // Type check workaround
  const store = loadStore();
  store.autonomyMode = mode;
  saveStore(store);
}
