import type {
  CompetitiveIntel,
  CompetitorProfile,
  GBPData,
  WebsiteAudit,
  TrafficData,
} from "./types";

export interface ReportData {
  businessName: string;
  location: string;
  industry: string;
  date: string;
  intel: CompetitiveIntel;
  competitors: CompetitorProfile[];
  prospect: {
    rating: number;
    reviewCount: number;
    gbpCompleteness: number | null;
  };
  audit: WebsiteAudit | null;
  traffic: TrafficData | null;
  contact: { phone: string; email: string } | null;
}

export function buildReportData(
  businessName: string,
  location: string,
  industry: string,
  intel: CompetitiveIntel,
  competitors: CompetitorProfile[],
  gbp: GBPData | null,
  audit: WebsiteAudit | null = null,
  traffic: TrafficData | null = null
): ReportData {
  return {
    businessName,
    location,
    industry,
    date: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    intel,
    competitors,
    prospect: {
      rating: gbp?.rating ?? 0,
      reviewCount: gbp?.reviewCount ?? 0,
      gbpCompleteness: gbp?.completenessScore ?? null,
    },
    audit,
    traffic,
    contact: null,
  };
}
