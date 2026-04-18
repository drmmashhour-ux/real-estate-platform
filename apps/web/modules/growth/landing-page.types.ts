export type LandingPageSection = {
  title: string;
  content: string;
};

export type LandingPageTemplate = {
  id: string;
  headline: string;
  subheadline: string;
  sections: LandingPageSection[];
  cta: string;
};
