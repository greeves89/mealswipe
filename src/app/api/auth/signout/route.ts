import { NextResponse } from "next/server";
import { COOKIE_OPTIONS } from "@/lib/session";

export async function POST() {
  const res = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  );
  res.cookies.set({ ...COOKIE_OPTIONS, value: "", maxAge: 0 });
  return res;
}
