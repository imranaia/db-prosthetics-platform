import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const ROLE_PATHS: Record<string, string> = {
  super_admin:    '/dashboard/super-admin',
  hospital_admin: '/dashboard/hospital-admin',
  doctor:         '/dashboard/doctor',
  po_specialist:  '/dashboard/po-specialist',
  patient:        '/dashboard/patient',
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role  = token?.role as string | undefined;
    const path  = req.nextUrl.pathname;

    if (!role) return NextResponse.redirect(new URL('/login', req.url));

    const allowedRoot = ROLE_PATHS[role];

    // If a user tries to access another role's dashboard, redirect them to their own
    if (path.startsWith('/dashboard') && allowedRoot && !path.startsWith(allowedRoot)) {
      return NextResponse.redirect(new URL(allowedRoot, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Any valid JWT token is enough to pass the gate;
      // role-level access is checked in the middleware function above
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all dashboard routes
export const config = {
  matcher: ['/dashboard/:path*'],
};
