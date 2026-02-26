import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runPipeline } from "@/lib/pipeline";
import type { ProspectInput } from "@/lib/pipeline/types";

export async function GET(
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

  return NextResponse.json(result[0]);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  await db.update(prospects).set(body).where(eq(prospects.id, id));

  return NextResponse.json({ ok: true });
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
  if (prospect.status !== "saved") {
    return NextResponse.json(
      { error: "Prospect already generated" },
      { status: 400 }
    );
  }

  await db
    .update(prospects)
    .set({ status: "pending" })
    .where(eq(prospects.id, id));

  const input: ProspectInput = {
    businessName: prospect.businessName,
    websiteUrl: prospect.websiteUrl ?? undefined,
    location: prospect.location,
    industry: prospect.industry as ProspectInput["industry"],
  };

  runPipeline(input, id).catch((err) => {
    console.error(`[api/prospects] Pipeline failed for ${prospect.slug}:`, err);
  });

  return NextResponse.json({ slug: prospect.slug, status: "pending" });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(prospects).where(eq(prospects.id, id));

  return NextResponse.json({ ok: true });
}
