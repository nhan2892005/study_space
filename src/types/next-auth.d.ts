import 'next-auth';
import { UserRole } from '@/types/user';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    }
  }
}
