/**
 * Host-facing earnings rollup from Supabase BNHUB data (gross paid bookings per `host_user_id`).
 * Automated Connect payouts are not triggered here.
 */
export {
  estimateHostPayoutableFromSupabase as getHostEarningsSummaryFromSupabase,
  type HostPayoutEstimate as HostEarningsSummary,
} from "./get-host-payout-estimate";
