import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Set it in .env.local");
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = "forkly-session";
const EXPIRES_IN = 60 * 60 * 24 * 14; // 14 days (reduced from 30)

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  plan: "free" | "plus" | "family";
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: Request): Promise<SessionUser | null> {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return Promise.resolve(null);
  return verifySession(match[1]);
}

// Default to secure=true; only disable explicitly in dev via COOKIE_SECURE=false
const isCookieSecure = process.env.COOKIE_SECURE !== "false";

export const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: isCookieSecure,
  sameSite: "lax" as const, // "strict" breaks iOS Safari post-login redirects
  maxAge: EXPIRES_IN,
  path: "/",
};
