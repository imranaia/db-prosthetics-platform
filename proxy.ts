import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/jwt';

const ROLE_PATHS: Record<string, string[]> = {
  // Super admins can also operate the Doctor dashboard (Doctor Mode switch).
  super_admin:    ['/dashboard/super-admin', '/dashboard/doctor'],
  hospital_admin: ['/dashboard/hospital-admin'],
  doctor:         ['/dashboard/doctor'],
  po_specialist:  ['/dashboard/po-specialist'],
  patient:        ['/dashboard/patient'],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // No token — send to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const user = await verifyToken(token);

  // Invalid or expired token — clear cookie and send to login
  if (!user) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.set({ name: SESSION_COOKIE, value: '', maxAge: 0, path: '/' });
    return res;
  }

  const allowedRoots = ROLE_PATHS[user.role];
  const path         = req.nextUrl.pathname;

  // User accessing a dashboard that isn't theirs — redirect to their own
  if (allowedRoots && !allowedRoots.some(root => path.startsWith(root))) {
    return NextResponse.redirect(new URL(allowedRoots[0], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
