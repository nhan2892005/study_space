import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import MentorDashboard from '@/components/dashboard/MentorDashboard';
import MenteeDashboard from '@/components/dashboard/MenteeDashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  switch (session.user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MENTOR':
      return <MentorDashboard />;
    case 'MENTEE':
      return <MenteeDashboard />;
    default:
      redirect('/');
  }
}