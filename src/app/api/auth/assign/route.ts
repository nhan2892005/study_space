// src/app/api/auth/assign/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

const ALLOWED = ['MENTEE', 'MENTOR', 'ADMIN'];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const roleRaw = url.searchParams.get('role') ?? '';
  const role = roleRaw.toUpperCase();
  if (!ALLOWED.includes(role)) return NextResponse.redirect(new URL('/', req.url));

  const escapedRole = String(role).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Assigning role...</title></head><body>
    <form id="f" method="post" action="${url.pathname}">
      <input type="hidden" name="role" value="${escapedRole}" />
    </form>
    <script>document.getElementById('f').submit();</script>
    <noscript><p>Assigning role... <button onclick="document.getElementById('f').submit()">Continue</button></p></noscript>
  </body></html>`;

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const roleRaw = formData.get('role')?.toString() ?? '';
    const role = roleRaw.toUpperCase();
    if (!ALLOWED.includes(role)) return NextResponse.redirect(new URL('/', req.url));

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.redirect(new URL('/', req.url));

    await prisma.user.upsert({
      where: { email: session.user.email },
      update: { role },
      create: {
        email: session.user.email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role,
      },
    });

    return NextResponse.redirect(new URL('/', req.url));
  } catch (err) {
    console.error('assign role error', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
