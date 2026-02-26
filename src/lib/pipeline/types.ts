// ── INPUT ──

export interface ProspectInput {
  businessName: string;
  websiteUrl?: string;
  location: string;
  industry: IndustryKey;
}

export type IndustryKey =
  | "hvac"
  | "plumbing"
  | "electrician"
  | "landscaping"
  | "dental"
  | "behavioral_health"
  | "pest_control";

export type PipelineStatus =
  | "pending"
  | "scraping"
  | "analyzing"
  | "building"
  | "deploying"
  | "complete"
  | "error";

// ── PHASE 1: SCRAPED DATA ──

export interface ScrapedData {
  crawledSite: CrawledSite | null;
  gbp: GBPData | null;
  competitors: CompetitorProfile[];
  audit: WebsiteAudit | null;
  traffic: TrafficData | null;
  collectedAt: string;
}

export interface CrawledSite {
  url: string;
  pages: CrawledPage[];
  brandInfo: {
    businessName: string;
    tagline: string | null;
    primaryColor: string | null;
    logoUrl: string | null;
    favicon: string | null;
  };
  contactInfo: {
    phone: string | null;
    email: string | null;
    address: string | null;
    hours: string | null;
  };
  services: ExtractedService[];
  aboutContent: string | null;
  testimonials: string[];
  images: { url: string; alt: string; context: string }[];
  techStack: string[];
  seoMeta: {
    title: string;
    description: string;
    ogImage: string | null;
    schema: unknown | null;
  };
}

export interface CrawledPage {
  url: string;
  title: string;
  headings: string[];
  bodyText: string;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
}

export interface ExtractedService {
  name: string;
  description: string;
  pageUrl: string | null;
}

export interface GBPData {
  found: boolean;
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  reviews: ReviewData[];
  photoCount: number;
  hours: string[];
  isOpen: boolean | null;
  categories: string[];
  mapsUrl: string;
  completenessScore: number;
}

export interface ReviewData {
  author: string;
  rating: number;
  text: string;
  time: string;
}

export interface WebsiteAudit {
  found: boolean;
  url: string;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
  };
  metrics: {
    firstContentfulPaint: string;
    largestContentfulPaint: string;
    totalBlockingTime: string;
    cumulativeLayoutShift: string;
  };
  seoIssues: { id: string; title: string }[];
  mobileReady: boolean;
  hasHTTPS: boolean;
}

export interface TrafficData {
  domain: string;
  indexedPages: number;
  estimatedMonthlyTraffic: number;
  trafficValue: number;
  topKeywords: string[];
}

export interface CompetitorProfile {
  name: string;
  rating: number;
  reviewCount: number;
  website: string | null;
  address: string;
  mapPackPosition: number;
  homepageWordCount: number | null;
  serviceCount: number | null;
  hasSchema: boolean | null;
  hasBlog: boolean | null;
}

// ── PHASE 2: ANALYSIS ──

export interface BusinessAnalysis {
  businessSummary: string;
  differentiators: string[];
  brandVoice: string;
  siteSections: {
    hero: {
      headline: string;
      subheadline: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    services: {
      name: string;
      headline: string;
      description: string;
      icon: string;
    }[];
    about: {
      headline: string;
      paragraphs: string[];
    };
    whyChooseUs: {
      title: string;
      description: string;
    }[];
    serviceArea: {
      headline: string;
      description: string;
      towns: string[];
    };
    cta: {
      headline: string;
      description: string;
      buttonText: string;
    };
    footer: {
      description: string;
    };
  };
  seo: {
    title: string;
    description: string;
    h1: string;
    keywords: string[];
  };
  designNotes: {
    suggestedPrimaryColor: string;
    suggestedAccentColor: string;
    tone: string;
    layoutStyle: string;
  };
}

export interface CompetitiveIntel {
  marketSnapshot: string;
  mapPackAnalysis: string;
  prospectPosition: string;
  keyFindings: string[];
  revenueOpportunity: {
    monthlyLow: number;
    monthlyHigh: number;
    annualLow: number;
    annualHigh: number;
    methodology: string;
  };
  topRecommendations: string[];
  urgencyNote: string;
}

// ── PHASE 3: BUILD ──

export interface BuildResult {
  repoUrl: string;
  previewUrl: string;
  slug: string;
}

// ── FULL PIPELINE RESULT ──

export interface PipelineResult {
  slug: string;
  scraped: ScrapedData;
  analysis: BusinessAnalysis;
  intel: CompetitiveIntel;
  build: BuildResult;
}
