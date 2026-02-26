"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ImportLeads() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/import", { method: "POST", body: form });
      if (!res.ok) throw new Error("Import failed");

      const data = await res.json();
      setResult(data);

      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      alert("Import failed. Check the file format.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={loading}
          className="text-sm text-zinc-600 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-50"
        />
        <button
          onClick={handleImport}
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </div>
      {result && (
        <p className="mt-2 text-xs text-zinc-500">
          Imported {result.imported} new leads
          {result.updated > 0 && `, updated ${result.updated} existing`}
          {result.skipped > 0 && `, skipped ${result.skipped}`}.
        </p>
      )}
    </div>
  );
}
