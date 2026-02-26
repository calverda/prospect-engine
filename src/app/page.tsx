import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProspectForm } from "@/components/ProspectForm";
import { ProspectCard } from "@/components/ProspectCard";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const allProspects = await db
    .select()
    .from(prospects)
    .orderBy(desc(prospects.createdAt));

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
        <LogoutButton />
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <ProspectForm />

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Prospects</h2>
          {allProspects.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No prospects yet. Generate your first package above.
            </p>
          ) : (
            <div className="grid gap-4">
              {allProspects.map((prospect) => (
                <ProspectCard key={prospect.id} prospect={prospect} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
