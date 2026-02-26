import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import zipcodes from "zipcodes";

interface LeadInfo {
  id: string;
  businessName: string;
  industry: string;
  status: string;
  websiteUrl: string | null;
}

interface ZipCluster {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  leads: LeadInfo[];
}

export async function GET() {
  const all = await db.select().from(prospects);

  const clusters = new Map<string, ZipCluster>();

  for (const p of all) {
    const match = p.location.match(/\b(\d{5})\b/);
    if (!match) continue;

    const zip = match[1];
    const info = zipcodes.lookup(zip);
    if (!info) continue;

    if (!clusters.has(zip)) {
      clusters.set(zip, {
        zip,
        lat: info.latitude,
        lng: info.longitude,
        city: info.city,
        leads: [],
      });
    }

    clusters.get(zip)!.leads.push({
      id: p.id,
      businessName: p.businessName,
      industry: p.industry,
      status: p.status,
      websiteUrl: p.websiteUrl,
    });
  }

  return NextResponse.json(Array.from(clusters.values()));
}
