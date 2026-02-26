import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { slugify } from "@/lib/utils/format";
import type { IndustryKey } from "@/lib/pipeline/types";

const TYPE_MAP: Record<string, IndustryKey> = {
  "General Contractor": "general_contractor",
  "Hvac Contractor": "hvac",
  "Mason": "masonry",
  "Fence Contractor": "fence",
  "Solar Contractor": "solar",
  "Pool Contractor": "pool",
  "Paving Contractor": "paving",
  "Windows/Doors": "windows_doors",
  "Abatement Contractor": "general_contractor",
  "Demolition Contractor": "general_contractor",
  "Fire Suppression": "general_contractor",
  "Sign Contractor": "general_contractor",
};

interface ExcelRow {
  ID?: number;
  Contractor_Type?: string;
  Company_Name?: string;
  Phone?: string;
  Street_Address?: string;
  City?: string;
  State?: string;
  Zip_Code?: string | number;
  Website?: string;
  Google_SEO_Rank?: string;
  Has_Website?: string;
  Sales_Priority?: string;
  Opportunity_Notes?: string;
  Site_Quality?: string;
  Quality_Issues?: string;
  Lead_Score?: string;
  Contact_Email?: string;
  NY_SOS_Status?: string;
  BBB_Rating?: string;
  BBB_Accredited?: string;
  Red_Flags?: string;
  // Legacy column name
  SEO?: string;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  // Get existing prospects to handle duplicates and updates
  const existing = await db
    .select({ id: prospects.id, name: prospects.businessName })
    .from(prospects);
  const existingMap = new Map(
    existing.map((e) => [e.name.toLowerCase(), e.id])
  );

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const companyName = row.Company_Name?.trim();
    if (!companyName) {
      skipped++;
      continue;
    }

    const contractorType = row.Contractor_Type?.trim() ?? "";
    const industry = TYPE_MAP[contractorType] ?? "general_contractor";

    const city = row.City?.trim() ?? "";
    const state = row.State?.trim() ?? "";
    const zip = row.Zip_Code ? String(row.Zip_Code).trim() : "";
    const location = [city, state].filter(Boolean).join(", ") + (zip ? ` ${zip}` : "");

    let website = row.Website?.trim() ?? null;
    if (website === "") website = null;

    // Enrichment fields
    const enrichment = {
      phone: row.Phone?.trim() || null,
      contactEmail: row.Contact_Email?.trim() || null,
      streetAddress: row.Street_Address?.trim() || null,
      salesPriority: row.Sales_Priority?.trim() || null,
      leadScore: row.Lead_Score?.trim() || null,
      siteQuality: row.Site_Quality?.trim() || null,
      opportunityNotes: row.Opportunity_Notes?.trim() || null,
      qualityIssues: row.Quality_Issues?.trim() || null,
      redFlags: row.Red_Flags?.trim() || null,
      bbbRating: row.BBB_Rating?.trim() || null,
      bbbAccredited: row.BBB_Accredited?.trim() || null,
      nySosStatus: row.NY_SOS_Status?.trim() || null,
      googleSeoRank: (row.Google_SEO_Rank ?? row.SEO)?.trim() || null,
    };

    // If prospect already exists, update enrichment data
    const existingId = existingMap.get(companyName.toLowerCase());
    if (existingId) {
      await db
        .update(prospects)
        .set(enrichment)
        .where(eq(prospects.id, existingId));
      updated++;
      continue;
    }

    const id = uuid();
    const baseSlug = slugify(companyName);

    const slugCheck = await db
      .select({ slug: prospects.slug })
      .from(prospects)
      .where(eq(prospects.slug, baseSlug))
      .limit(1);
    const slug = slugCheck.length > 0 ? `${baseSlug}-${id.slice(0, 6)}` : baseSlug;

    await db.insert(prospects).values({
      id,
      slug,
      businessName: companyName,
      websiteUrl: website,
      location: location || "Long Island, NY",
      industry,
      status: "saved",
      createdAt: new Date().toISOString(),
      ...enrichment,
    });

    existingMap.set(companyName.toLowerCase(), id);
    imported++;
  }

  return NextResponse.json({ imported, updated, skipped });
}
