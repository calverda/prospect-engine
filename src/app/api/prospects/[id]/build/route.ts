import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildSite } from "@/lib/pipeline/builder";

// Build needs time: GitHub template creation + Vercel deploy
export const maxDuration = 300;

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

  if (!prospect.sitePlan) {
    return NextResponse.json(
      { error: "No site plan — run Plan Website first" },
      { status: 400 }
    );
  }

  if (prospect.previewUrl) {
    return NextResponse.json(
      { error: "Site already built", previewUrl: prospect.previewUrl },
      { status: 400 }
    );
  }

  try {
    await updateProspect(id, {
      status: "building",
      statusMessage: "Creating GitHub repo from template...",
      errorMessage: null,
    });

    const buildResult = await buildSite(prospect.sitePlan, prospect.slug);

    await updateProspect(id, {
      status: "deploying",
      statusMessage: "Deploying to Vercel...",
    });

    await updateProspect(id, {
      status: "complete",
      statusMessage: "Site built and deployed",
      previewUrl: buildResult.previewUrl,
      repoUrl: buildResult.repoUrl,
    });

    console.log(`[build] Complete for ${prospect.slug}: ${buildResult.previewUrl}`);
    return NextResponse.json({
      status: "complete",
      previewUrl: buildResult.previewUrl,
      repoUrl: buildResult.repoUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[build] Error for ${prospect.slug}: ${message}`);

    await updateProspect(id, {
      status: "error",
      statusMessage: "Build failed",
      errorMessage: message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
