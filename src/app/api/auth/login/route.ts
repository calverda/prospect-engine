import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!process.env.AUTH_PASSWORD) {
    return NextResponse.json(
      { error: "Auth not configured" },
      { status: 500 }
    );
  }

  if (password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("auth-token", getAuthToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
