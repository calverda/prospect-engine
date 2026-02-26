import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils/format";
import { runPipeline } from "@/lib/pipeline";
import type { ProspectInput } from "@/lib/pipeline/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ProspectInput;

  if (!body.businessName || !body.location || !body.industry) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const id = uuid();
  const baseSlug = slugify(body.businessName);

  // Check for existing slug and append suffix if needed
  const existing = await db
    .select({ slug: prospects.slug })
    .from(prospects)
    .where(eq(prospects.slug, baseSlug))
    .limit(1);
  const slug = existing.length > 0 ? `${baseSlug}-${id.slice(0, 6)}` : baseSlug;

  await db.insert(prospects).values({
    id,
    slug,
    businessName: body.businessName,
    websiteUrl: body.websiteUrl ?? null,
    location: body.location,
    industry: body.industry,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  // Fire-and-forget — pipeline updates DB status as it progresses
  runPipeline(body, id).catch((err) => {
    console.error(`[api/generate] Pipeline failed for ${slug}:`, err);
  });

  return NextResponse.json({ id, slug, status: "pending" });
}
