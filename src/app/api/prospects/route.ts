import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const industry = searchParams.get("industry");

  let query = db.select().from(prospects).orderBy(desc(prospects.createdAt));

  // TODO: Apply filters for status and industry if provided

  const results = await query;
  return NextResponse.json(results);
}
