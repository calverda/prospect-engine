import { collectAllData } from "./scraper";
import { analyzeAll } from "./analyzer";
import type { ProspectInput, PipelineResult } from "./types";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function updateProspect(id: string, data: Record<string, unknown>) {
  await db.update(prospects).set(data).where(eq(prospects.id, id));
}

export async function runPipeline(
  input: ProspectInput,
  prospectId: string
): Promise<PipelineResult> {
  console.log("\n" + "=".repeat(60));
  console.log("  CALVERDA PROSPECT ENGINE");
  console.log(`  Target: ${input.businessName}`);
  console.log(`  Location: ${input.location}`);
  console.log(`  Industry: ${input.industry}`);
  console.log("=".repeat(60));

  const startTime = Date.now();

  try {
    // Phase 1: Scrape
    await updateProspect(prospectId, {
      status: "scraping",
      statusMessage: "Crawling website, scraping GBP, scanning competitors...",
    });

    const scraped = await collectAllData(input);

    await updateProspect(prospectId, {
      crawledSiteData: scraped.crawledSite ? JSON.stringify(scraped.crawledSite) : null,
      gbpData: scraped.gbp ? JSON.stringify(scraped.gbp) : null,
      competitorData: scraped.competitors.length > 0 ? JSON.stringify(scraped.competitors) : null,
      auditData: scraped.audit ? JSON.stringify(scraped.audit) : null,
      trafficData: scraped.traffic ? JSON.stringify(scraped.traffic) : null,
    });

    // Phase 2: Analyze
    await updateProspect(prospectId, {
      status: "analyzing",
      statusMessage: "Running business analysis and competitive intel via Claude...",
    });

    const { analysis, intel, buildBrief } = await analyzeAll(scraped, input);

    const revenueGapMonthly = intel.revenueOpportunity?.monthlyHigh ?? null;
    const revenueGapAnnual = intel.revenueOpportunity?.annualHigh ?? null;

    await updateProspect(prospectId, {
      businessAnalysis: JSON.stringify(analysis),
      competitiveIntel: JSON.stringify(intel),
      buildBrief,
      revenueGapMonthly,
      revenueGapAnnual,
    });

    // Phase 3: Build — skipped for POC
    const slug = input.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    await updateProspect(prospectId, {
      status: "complete",
      statusMessage: `Completed in ${elapsed}s (build phase skipped)`,
      completedAt: new Date().toISOString(),
    });

    console.log("\n" + "=".repeat(60));
    console.log(`  COMPLETE in ${elapsed}s`);
    console.log("=".repeat(60) + "\n");

    return {
      slug,
      scraped,
      analysis,
      intel,
      build: { previewUrl: "", repoUrl: "", slug },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] Fatal error: ${message}`);

    await updateProspect(prospectId, {
      status: "error",
      statusMessage: "Pipeline failed",
      errorMessage: message,
    });

    throw err;
  }
}
