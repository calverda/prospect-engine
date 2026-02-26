import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildSite } from "@/lib/pipeline/builder";

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

  // Fire-and-forget: update status and run build async
  await updateProspect(id, {
    status: "building",
    statusMessage: "Creating GitHub repo from template...",
  });

  // Run build in background — status updates via DB polling
  runBuild(id, prospect.slug, prospect.sitePlan).catch((err) => {
    console.error(`[build] Failed for ${prospect.slug}:`, err);
  });

  return NextResponse.json({ status: "building", slug: prospect.slug });
}

async function runBuild(id: string, slug: string, sitePlan: string) {
  try {
    await updateProspect(id, {
      status: "building",
      statusMessage: "Building preview site...",
    });

    const result = await buildSite(sitePlan, slug);

    await updateProspect(id, {
      status: "deploying",
      statusMessage: "Deploying to Vercel...",
    });

    // Short delay to let the status message show
    await new Promise((r) => setTimeout(r, 1000));

    await updateProspect(id, {
      status: "complete",
      statusMessage: "Site built and deployed",
      previewUrl: result.previewUrl,
      repoUrl: result.repoUrl,
    });

    console.log(`[build] Complete for ${slug}: ${result.previewUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[build] Error for ${slug}: ${message}`);

    await updateProspect(id, {
      status: "error",
      statusMessage: "Build failed",
      errorMessage: message,
    });
  }
}
