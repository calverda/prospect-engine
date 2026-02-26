import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ACTIVE_STATUSES = ["pending", "scraping", "analyzing", "building", "deploying"];

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

  if (!ACTIVE_STATUSES.includes(prospect.status)) {
    return NextResponse.json(
      { error: `Cannot cancel — status is "${prospect.status}"` },
      { status: 400 }
    );
  }

  // If analysis was already completed, reset to "complete" so user can
  // retry just the build. Otherwise reset to "error".
  const hasAnalysis = !!prospect.businessAnalysis;

  await db
    .update(prospects)
    .set({
      status: hasAnalysis ? "complete" : "error",
      statusMessage: "Cancelled by user",
      errorMessage: hasAnalysis ? null : "Cancelled by user",
    })
    .where(eq(prospects.id, id));

  console.log(`[cancel] Prospect ${prospect.slug} cancelled (had analysis: ${hasAnalysis})`);

  return NextResponse.json({ status: hasAnalysis ? "complete" : "error" });
}
