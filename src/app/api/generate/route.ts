import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { slugify } from "@/lib/utils/format";
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
  const slug = slugify(body.businessName);

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

  // TODO: Kick off pipeline (async, don't await)
  // runPipeline(body) — update DB status at each phase

  return NextResponse.json({ id, slug, status: "pending" });
}
