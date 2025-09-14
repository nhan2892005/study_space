'use server';
import { UserRole } from '@prisma/client';
import { cookies } from 'next/headers';

export async function setRole(role: UserRole) {
  cookies().set('temp_role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5, // 5 phút, đủ cho auth flow
    path: '/',
  });
}