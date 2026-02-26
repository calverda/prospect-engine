import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { IntelReport } from "@/components/IntelReport";
import type { CompetitiveIntel, CompetitorProfile } from "@/lib/pipeline/types";
import type { ReportData } from "@/lib/pipeline/report-generator";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await db
    .select()
    .from(prospects)
    .where(eq(prospects.slug, slug))
    .limit(1);

  if (result.length === 0) notFound();

  const prospect = result[0];

  if (!prospect.competitiveIntel) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">
          Report not yet available. Pipeline may still be running.
        </p>
      </div>
    );
  }

  const intel = JSON.parse(prospect.competitiveIntel) as CompetitiveIntel;
  const competitors = prospect.competitorData
    ? (JSON.parse(prospect.competitorData) as CompetitorProfile[])
    : [];
  const gbpData = prospect.gbpData ? JSON.parse(prospect.gbpData) : null;

  const reportData: ReportData = {
    businessName: prospect.businessName,
    location: prospect.location,
    industry: prospect.industry,
    date: new Date(prospect.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    intel,
    competitors,
    prospect: {
      rating: gbpData?.rating ?? 0,
      reviewCount: gbpData?.reviewCount ?? 0,
    },
  };

  // TODO: Track view count
  // await db.update(prospects).set({ reportViewCount: (prospect.reportViewCount ?? 0) + 1 }).where(eq(prospects.slug, slug));

  return <IntelReport data={reportData} />;
}
