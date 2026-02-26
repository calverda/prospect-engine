"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const TerritoryMap = dynamic(
  () => import("@/components/TerritoryMap").then((m) => m.TerritoryMap),
  { ssr: false }
);

export default function TerritoryPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Dashboard
          </Link>
          <h1 className="text-xl font-bold tracking-tight">
            Territory Map
          </h1>
        </div>
        <LogoutButton />
      </header>
      <div className="flex-1">
        <TerritoryMap />
      </div>
    </div>
  );
}
