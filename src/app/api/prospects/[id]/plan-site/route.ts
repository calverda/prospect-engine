import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateSitePlan } from "@/lib/pipeline/analyzer";
import type { ScrapedData, BusinessAnalysis } from "@/lib/pipeline/types";

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

  if (prospect.status !== "complete") {
    return NextResponse.json(
      { error: "Prospect must be complete before planning a site" },
      { status: 400 }
    );
  }

  if (!prospect.businessAnalysis) {
    return NextResponse.json(
      { error: "No business analysis data available" },
      { status: 400 }
    );
  }

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

  const analysis: BusinessAnalysis = JSON.parse(prospect.businessAnalysis);

  try {
    const sitePlan = await generateSitePlan(scraped, analysis);

    await db
      .update(prospects)
      .set({ sitePlan })
      .where(eq(prospects.id, id));

    return NextResponse.json({ sitePlan: JSON.parse(sitePlan) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[plan-site] Failed for ${prospect.slug}: ${message}`);
    return NextResponse.json(
      { error: `Site plan generation failed: ${message}` },
      { status: 500 }
    );
  }
}
