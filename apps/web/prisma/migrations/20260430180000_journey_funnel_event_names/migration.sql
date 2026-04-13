-- BNHub / platform journey steps (landing → search → listing → checkout → pay)
ALTER TYPE "AnalyticsFunnelEventName" ADD VALUE 'landing_visit';
ALTER TYPE "AnalyticsFunnelEventName" ADD VALUE 'search_used';
ALTER TYPE "AnalyticsFunnelEventName" ADD VALUE 'listing_click';
ALTER TYPE "AnalyticsFunnelEventName" ADD VALUE 'booking_started';
