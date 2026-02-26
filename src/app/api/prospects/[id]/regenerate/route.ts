import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { analyzeAll, resetUsageAccumulator, getAccumulatedUsage } from "@/lib/pipeline/analyzer";
import type { ScrapedData, ProspectInput } from "@/lib/pipeline/types";

async function updateProspect(id: string, data: Record<string, unknown>) {
  await db.update(prospects).set(data).where(eq(prospects.id, id));
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await db
    .select()
    .from(prospects)
    .where(eq(prospects.id, id))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prospect = result[0];

  if (!["complete", "error"].includes(prospect.status)) {
    return NextResponse.json(
      { error: `Cannot regenerate — status is "${prospect.status}"` },
      { status: 400 }
    );
  }

  if (!prospect.crawledSiteData && !prospect.gbpData && !prospect.competitorData) {
    return NextResponse.json(
      { error: "No scraped data available — run full generation first" },
      { status: 400 }
    );
  }

  // Set status to analyzing and clear old results
  await updateProspect(id, {
    status: "analyzing",
    statusMessage: "Regenerating business analysis and competitive intel...",
    errorMessage: null,
    businessAnalysis: null,
    competitiveIntel: null,
    buildBrief: null,
    sitePlan: null,
    previewUrl: null,
    repoUrl: null,
    tokensIn: 0,
    tokensOut: 0,
    apiCost: null,
  });

  // Fire-and-forget: run analysis in background
  runRegeneration(id, prospect).catch((err) => {
    console.error(`[regenerate] Failed for ${prospect.slug}:`, err);
  });

  return NextResponse.json({ status: "analyzing", slug: prospect.slug });
}

async function runRegeneration(
  id: string,
  prospect: { slug: string; crawledSiteData: string | null; gbpData: string | null; competitorData: string | null; auditData: string | null; trafficData: string | null; createdAt: string; businessName: string; websiteUrl: string | null; location: string; industry: string }
) {
  try {
    // Reconstruct scraped data from stored JSON
    const scraped: ScrapedData = {
      crawledSite: prospect.crawledSiteData
        ? JSON.parse(prospect.crawledSiteData)
        : null,
      gbp: prospect.gbpData ? JSON.parse(prospect.gbpData) : null,
      competitors: prospect.competitorData
        ? JSON.parse(prospect.competitorData)
        : [],
      audit: prospect.auditData ? JSON.parse(prospect.auditData) : null,
      traffic: prospect.trafficData ? JSON.parse(prospect.trafficData) : null,
      collectedAt: prospect.createdAt,
    };

    const input: ProspectInput = {
      businessName: prospect.businessName,
      websiteUrl: prospect.websiteUrl ?? undefined,
      location: prospect.location,
      industry: prospect.industry as ProspectInput["industry"],
    };

    resetUsageAccumulator();
    const { analysis, intel, buildBrief } = await analyzeAll(scraped, input);
    const usage = getAccumulatedUsage();

    const revenueGapMonthly = intel.revenueOpportunity?.monthlyHigh ?? null;
    const revenueGapAnnual = intel.revenueOpportunity?.annualHigh ?? null;

    await updateProspect(id, {
      businessAnalysis: JSON.stringify(analysis),
      competitiveIntel: JSON.stringify(intel),
      buildBrief,
      revenueGapMonthly,
      revenueGapAnnual,
      tokensIn: usage.inputTokens,
      tokensOut: usage.outputTokens,
      apiCost: usage.cost.toFixed(4),
      status: "complete",
      statusMessage: "Intel regenerated successfully",
      completedAt: new Date().toISOString(),
    });

    console.log(`[regenerate] Complete for ${prospect.slug}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[regenerate] Error for ${prospect.slug}: ${message}`);

    await updateProspect(id, {
      status: "error",
      statusMessage: "Regeneration failed",
      errorMessage: message,
    });
  }
}
