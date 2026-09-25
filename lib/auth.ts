import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "./types";

// Two shared PINs/passwords, one per role, set as Vercel environment variables:
//   PARENT_PIN, NANNY_PIN, SESSION_SECRET
// In local development they default to 1234 / 0000.

const COOKIE = "nanny_session";
const MAX_AGE_DAYS = 90;
const isDev = process.env.NODE_ENV !== "production";

function secret(): string {
  const s = process.env.SESSION_SECRET ?? (isDev ? "dev-only-secret" : "");
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

export function pinFor(role: Role): string | undefined {
  const pin = role === "parent" ? process.env.PARENT_PIN : process.env.NANNY_PIN;
  if (pin) return pin;
  return isDev ? (role === "parent" ? "1234" : "0000") : undefined;
}

export function authConfigured(): boolean {
  return !!(pinFor("parent") && pinFor("nanny") && (process.env.SESSION_SECRET || isDev));
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPin(role: Role, pin: string): boolean {
  const expected = pinFor(role);
  return !!expected && safeEqual(sign(`pin:${pin}`), sign(`pin:${expected}`));
}

export async function createSession(role: Role): Promise<void> {
  const expires = Date.now() + MAX_AGE_DAYS * 86_400_000;
  const payload = `${role}.${expires}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_DAYS * 86_400,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function getRole(): Promise<Role | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [role, expires, sig] = raw.split(".");
  if (role !== "parent" && role !== "nanny") return null;
  if (!sig || !safeEqual(sig, sign(`${role}.${expires}`))) return null;
  if (Number(expires) < Date.now()) return null;
  return role;
}

export async function requireRole(): Promise<Role> {
  const role = await getRole();
  if (!role) redirect("/login");
  return role;
}

export async function requireParent(): Promise<void> {
  if ((await requireRole()) !== "parent") throw new Error("Only parents can do this");
}
