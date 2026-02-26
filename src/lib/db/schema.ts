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

  // Phase 3 outputs
  previewUrl: text("preview_url"),
  repoUrl: text("repo_url"),
  revenueGapMonthly: integer("revenue_gap_monthly"),
  revenueGapAnnual: integer("revenue_gap_annual"),

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
