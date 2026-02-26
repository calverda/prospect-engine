import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  // Single prospect lookup by slug
  if (slug) {
    const result = await db
      .select()
      .from(prospects)
      .where(eq(prospects.slug, slug))
      .limit(1);
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  }

  // List all prospects
  const results = await db
    .select()
    .from(prospects)
    .orderBy(desc(prospects.createdAt));
  return NextResponse.json(results);
}
