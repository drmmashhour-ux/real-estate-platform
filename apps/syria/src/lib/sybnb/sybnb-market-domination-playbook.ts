/**
 * ORDER SYBNB-75 — Market domination targets for Hadiah Link (default platform for Syrian stays).
 * City priorities and supply-share bands are strategic anchors — validate inventory census methodology with Ops.
 */

export type Sybnb75CityId = "damascus" | "latakia" | "aleppo";

/** Ordered priority markets — win sequentially without thinning execution quality. */
export const SYBNB75_PRIORITY_CITY_IDS: readonly Sybnb75CityId[] = ["damascus", "latakia", "aleppo"];

/** Goal share of addressable visible hotels live on SYBNB (band — define “visible” consistently week to week). */
export const SYBNB75_HOTEL_VISIBLE_SHARE_MIN_PCT = 70;
export const SYBNB75_HOTEL_VISIBLE_SHARE_MAX_PCT = 80;
