import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ProspectForm } from "@/components/ProspectForm";
import { ProspectCard } from "@/components/ProspectCard";
import { LeadCard } from "@/components/LeadCard";
import { ImportLeads } from "@/components/ImportLeads";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const allProspects = await db
    .select()
    .from(prospects)
    .orderBy(desc(prospects.createdAt));

  const savedLeads = allProspects.filter((p) => p.status === "saved");
  const generated = allProspects.filter((p) => p.status !== "saved");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Calverda Prospect Engine
          </h1>
          <p className="text-sm text-zinc-500">
            Enter a business. Get a complete sales package.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/territory"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Territory Map
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <ProspectForm />

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Saved Leads
              {savedLeads.length > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-400">
                  ({savedLeads.length})
                </span>
              )}
            </h2>
          </div>
          <ImportLeads />
          {savedLeads.length > 0 && (
            <div className="mt-4 grid gap-3">
              {savedLeads.map((lead) => (
                <LeadCard key={lead.id} prospect={lead} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Generated Prospects</h2>
          {generated.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No prospects yet. Generate your first package above.
            </p>
          ) : (
            <div className="grid gap-4">
              {generated.map((prospect) => (
                <ProspectCard key={prospect.id} prospect={prospect} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
