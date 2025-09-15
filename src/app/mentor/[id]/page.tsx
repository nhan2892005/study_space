import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import MentorWall from '@/components/mentor/MentorWall';

export default async function MentorPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/mentors/${id}`);
  const data = await res.json();

  if (data?.error) {
    return <div className="p-8">Mentor not found</div>;
  }

  // server component passes serializable props
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <MentorWall mentorData={data} currentUserEmail={session?.user?.email} />
    </div>
  );
}
