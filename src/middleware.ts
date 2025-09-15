import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from './constants/navigation';
import { getToken } from 'next-auth/jwt';

// Map public routes to allowed roles (if empty => public)
const routeRoleMap: { [path: string]: string[] | undefined } = {
  [ROUTES.HOME]: undefined,
  [ROUTES.GROUP]: ['MENTEE', 'MENTOR'],
  [ROUTES.MENTORS]: ['MENTEE'],
  [ROUTES.MY_MENTEES]: ['MENTOR'],
  [ROUTES.DASHBOARD]: ['MENTEE', 'MENTOR', 'ADMIN'],
  // settings routes are protected to authenticated users (all roles)
  [ROUTES.SETTINGS.PROFILE]: ['MENTEE', 'MENTOR', 'ADMIN'],
  [ROUTES.SETTINGS.LANGUAGE]: ['MENTEE', 'MENTOR', 'ADMIN'],
};

function getAllowedRolesForPath(pathname: string) {
  // Exact match first
  if (routeRoleMap[pathname] !== undefined) return routeRoleMap[pathname];

  // Allow nested settings paths (e.g., /settings/profile)
  if (pathname.startsWith('/settings')) return routeRoleMap[ROUTES.SETTINGS.PROFILE];

  // For group pages with params, allow if base matches
  if (pathname === '/group' || pathname.startsWith('/group/')) return routeRoleMap[ROUTES.GROUP];

  return undefined; // default public
}

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const allowedRoles = getAllowedRolesForPath(pathname);

  // If route is public, allow
  if (!allowedRoles) return NextResponse.next();

  // Try to get token using NextAuth helper (reads jwt from cookies)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const url = new URL('/', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  const userRole = (token as any).role as string | undefined;

  // If no specific role is required but user is authenticated, allow
  if (!allowedRoles) return NextResponse.next();

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Unauthorized for this role -> redirect to home (or could show 403)
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/group/:path*',
    '/mentor/:path*',
    '/my-mentees',
    '/dashboard/:path*',
    '/settings/:path*',
  ],
};
