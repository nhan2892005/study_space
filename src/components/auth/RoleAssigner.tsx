"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RoleAssigner() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || undefined;
    if (role && session?.user?.email) {
      fetch('/api/user/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      }).then(() => {
        // Remove role from URL without reloading
        params.delete('role');
        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
        window.history.replaceState({}, '', newUrl);
      });
    }
  }, [session]);

  return null;
}
