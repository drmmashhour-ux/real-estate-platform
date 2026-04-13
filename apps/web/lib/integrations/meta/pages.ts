/**
 * Resolve Instagram Business Account id + Facebook Page from a user access token.
 */

import { graphGet } from "./graph-client";

export type MetaPageWithInstagram = {
  id: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: { id: string; username?: string };
};

export async function fetchPagesWithInstagram(accessToken: string): Promise<MetaPageWithInstagram[]> {
  const res = await graphGet<{ data?: MetaPageWithInstagram[] }>("/me/accounts", accessToken, {
    fields: "name,access_token,instagram_business_account{id,username}",
  });
  return res.data ?? [];
}

/** Prefer first page that has an Instagram Business Account linked. */
export function pickPrimaryInstagramPage(pages: MetaPageWithInstagram[]): MetaPageWithInstagram | null {
  const withIg = pages.find((p) => p.instagram_business_account?.id);
  return withIg ?? null;
}
