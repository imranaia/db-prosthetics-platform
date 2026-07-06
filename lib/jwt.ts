/**
 * JWT utilities — works in both Edge Runtime (middleware) and Node.js.
 * Uses the `jose` library which is Edge-compatible.
 */
import { SignJWT, jwtVerify } from 'jose';

export interface SessionPayload {
  id: number;
  email?: string;
  role: string;
  hasDoctorProfile?: boolean;
}

export const SESSION_COOKIE  = 'dbp_session';
export const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error('SESSION_SECRET environment variable is not set. Set it before starting the app.');
  }
  return new TextEncoder().encode(s);
}

/** Create a signed JWT containing the user's id, email, and role. */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Verify a JWT and return its payload, or null if invalid/expired. */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id:    payload.id    as number,
      email: payload.email as string | undefined,
      role:  payload.role  as string,
    };
  } catch {
    return null;
  }
}

/** Build cookie options for Set-Cookie. */
export function cookieOptions(token: string) {
  return {
    name:     SESSION_COOKIE,
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax'  as const,
    maxAge:   MAX_AGE_SECONDS,
    path:     '/',
  };
}
