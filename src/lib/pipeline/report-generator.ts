import type { CompetitiveIntel, CompetitorProfile, GBPData } from "./types";

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
  };
}

export function buildReportData(
  businessName: string,
  location: string,
  industry: string,
  intel: CompetitiveIntel,
  competitors: CompetitorProfile[],
  gbp: GBPData | null
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
    },
  };
}
