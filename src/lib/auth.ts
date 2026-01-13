import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-in-production"
);

export interface JWTPayload {
  userId: string;
  email: string;
  [key: string]: unknown;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export function generateResetToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
