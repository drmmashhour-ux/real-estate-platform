"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import type { LocaleCode } from "@/lib/i18n/locales";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { InvestmentWelcomeModal } from "@/components/onboarding/InvestmentWelcomeModal";
import { FeedbackFloatButton } from "@/components/feedback/FeedbackFloatButton";
import { ProductHealthProvider } from "@/components/analytics/ProductHealthProvider";
import { ReturnVisitTracker } from "@/components/analytics/ReturnVisitTracker";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { TrafficPageViewBeacon } from "@/components/traffic/TrafficPageViewBeacon";
import { OrganicAttributionLocalMirror } from "@/components/organic/OrganicAttributionLocalMirror";
import { GoogleAnalyticsLoader } from "@/components/analytics/GoogleAnalyticsLoader";
import { PlausibleLoader } from "@/components/analytics/PlausibleLoader";
import { ProductAnalyticsPageView } from "@/components/analytics/ProductAnalyticsPageView";
import { MetaPixelLoader } from "@/components/analytics/MetaPixelLoader";
import { GrowthConversionLayer } from "@/components/growth/GrowthConversionLayer";
import { PlatformVisitTracker } from "@/components/analytics/PlatformVisitTracker";
import { InvestmentFunnelLogger } from "@/components/analytics/InvestmentFunnelLogger";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { InvestmentMvpEngagement } from "@/components/investment/InvestmentMvpEngagement";
import { ProductInsightsProvider } from "@/components/product-insights/ProductInsightsProvider";
import { InvestmentProgressProvider } from "@/components/investment/InvestmentProgressProvider";
import { StagingEnvironmentBanner } from "@/components/staging/StagingEnvironmentBanner";
import { DemoStagingWelcomeModal } from "@/components/demo/DemoStagingWelcomeModal";
import { DemoModeFetchToast } from "@/components/demo/DemoModeFetchToast";
import { DemoPageViewTracker } from "@/components/demo/DemoPageViewTracker";
import { DemoProvider } from "@/components/demo/DemoProvider";
import { PostHogPageView, PostHogProvider } from "@/components/analytics/PostHogClient";
import { AccessibilityPreferencesProvider } from "@/components/accessibility/AccessibilityPreferencesContext";
import { PlatformAssistantProvider } from "@/components/ai/PlatformAssistantContext";
import { PlatformAssistantLazy } from "@/components/ai/PlatformAssistantLazy";
import { ListingNavigationClickTracker } from "@/components/analytics/ListingNavigationClickTracker";

export function AppProviders({
  children,
  allowedLocales,
}: {
  children: ReactNode;
  allowedLocales?: LocaleCode[];
}) {
  return (
    <I18nProvider allowedLocales={allowedLocales}>
      <AccessibilityPreferencesProvider>
      <PostHogProvider>
        <DemoProvider>
        <StagingEnvironmentBanner />
        <Suspense fallback={null}>
          <DemoStagingWelcomeModal />
        </Suspense>
        <GoogleAnalyticsLoader />
        <PlausibleLoader />
        <MetaPixelLoader />
        <Suspense fallback={null}>
          <PostHogPageView />
        </Suspense>
        <Suspense fallback={null}>
          <ProductAnalyticsPageView />
        </Suspense>
        <Suspense fallback={null}>
          <InvestmentWelcomeModal />
        </Suspense>
        <Suspense fallback={null}>
          <OnboardingModal />
        </Suspense>
        <Suspense fallback={null}>
          <FeedbackFloatButton showLauncherButton={false} />
        </Suspense>
        <Suspense fallback={null}>
          <TrafficPageViewBeacon />
        </Suspense>
        <Suspense fallback={null}>
          <ListingNavigationClickTracker />
        </Suspense>
        <Suspense fallback={null}>
          <PlatformVisitTracker />
        </Suspense>
        <Suspense fallback={null}>
          <InvestmentFunnelLogger />
        </Suspense>
        <Suspense fallback={null}>
          <GrowthConversionLayer />
        </Suspense>
        <OrganicAttributionLocalMirror />
        <ToastProvider>
          <Suspense fallback={null}>
            <DemoPageViewTracker />
          </Suspense>
          <DemoModeFetchToast />
          <ProductHealthProvider>
            <ProductInsightsProvider>
              <InvestmentProgressProvider>
                <Suspense fallback={null}>
                  <ReturnVisitTracker />
                </Suspense>
                <Suspense fallback={null}>
                  <InvestmentMvpEngagement />
                </Suspense>
                <CompareProvider>
                  <PlatformAssistantProvider>
                    {children}
                    <Suspense fallback={null}>
                      <PlatformAssistantLazy />
                    </Suspense>
                  </PlatformAssistantProvider>
                </CompareProvider>
              </InvestmentProgressProvider>
            </ProductInsightsProvider>
          </ProductHealthProvider>
        </ToastProvider>
        </DemoProvider>
      </PostHogProvider>
      </AccessibilityPreferencesProvider>
    </I18nProvider>
  );
}
