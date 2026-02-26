"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
    >
      Sign Out
    </button>
  );
}
