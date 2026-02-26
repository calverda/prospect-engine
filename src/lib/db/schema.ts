import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const prospects = pgTable("prospects", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  businessName: text("business_name").notNull(),
  websiteUrl: text("website_url"),
  location: text("location").notNull(),
  industry: text("industry").notNull(),

  // Pipeline status
  status: text("status").notNull().default("pending"),
  statusMessage: text("status_message"),
  errorMessage: text("error_message"),

  // Phase 1 data (JSON)
  crawledSiteData: text("crawled_site_data"),
  gbpData: text("gbp_data"),
  competitorData: text("competitor_data"),
  auditData: text("audit_data"),
  trafficData: text("traffic_data"),

  // Phase 2 data (JSON)
  businessAnalysis: text("business_analysis"),
  competitiveIntel: text("competitive_intel"),
  buildBrief: text("build_brief"),

  // Site plan (JSON — generated content for website builder)
  sitePlan: text("site_plan"),

  // Lead enrichment data (from Excel import)
  phone: text("phone"),
  contactEmail: text("contact_email"),
  streetAddress: text("street_address"),
  salesPriority: text("sales_priority"),       // High / Medium / Low
  leadScore: text("lead_score"),               // Hot Lead / Warm Lead / Cool Lead / Skip
  siteQuality: text("site_quality"),           // Well Maintained / Acceptable / Needs Update / Needs Overhaul / No Website
  opportunityNotes: text("opportunity_notes"),
  qualityIssues: text("quality_issues"),
  redFlags: text("red_flags"),
  bbbRating: text("bbb_rating"),
  bbbAccredited: text("bbb_accredited"),       // Yes / No
  nySosStatus: text("ny_sos_status"),          // Active / Not Found / Inactive
  googleSeoRank: text("google_seo_rank"),

  // Phase 3 outputs
  previewUrl: text("preview_url"),
  repoUrl: text("repo_url"),
  revenueGapMonthly: integer("revenue_gap_monthly"),
  revenueGapAnnual: integer("revenue_gap_annual"),

  // Token usage tracking
  tokensIn: integer("tokens_in").default(0),
  tokensOut: integer("tokens_out").default(0),
  apiCost: text("api_cost"),    // stored as string to avoid float issues, e.g. "0.14"

  // Engagement tracking
  reportViewCount: integer("report_view_count").default(0),
  previewViewCount: integer("preview_view_count").default(0),
  lastViewedAt: text("last_viewed_at"),

  // Timestamps
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
