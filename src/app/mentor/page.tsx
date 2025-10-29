import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import MentorCard from '@/components/mentor/MentorCard';
import MentorWall from '@/components/mentor/MentorWall';

export default async function MentorIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return <div className="p-8">Vui lòng đăng nhập để xem mentors.</div>;
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user) return <div className="p-8">Người dùng không tồn tại</div>;

  // Only mentees can request mentors; mentors should see their own wall elsewhere
  if (user.role !== 'MENTEE') {
    return <div className="p-8">Trang này dành cho Mentees.</div>;
  }

  // Check if this mentee already has an accepted connection
  const connection = await prisma.menteeConnection.findFirst({ where: { menteeId: user.id, status: 'ACCEPTED' } });
  if (connection) {
    // show mentor wall of the assigned mentor
    const mentorId = connection.mentorId;
    const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/mentors/${mentorId}`);
    const data = await res.json();
    if (data?.error) return <div className="p-8">Mentor not found</div>;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <MentorWall mentorData={data} currentUserEmail={session.user.email} />
      </div>
    );
  }

  // Otherwise list all mentors
  const mentorProfiles = await prisma.mentorProfile.findMany({ include: { user: { select: { id: true, name: true, image: true, department: true, achievements: true, email: true } } } });

  const mentors = await Promise.all(mentorProfiles.map(async (mp:any) => {
    const currentMentees = await prisma.menteeConnection.count({ where: { mentorId: mp.userId, status: 'ACCEPTED' } });
    return {
      id: mp.userId,
      name: mp.user?.name || 'Unknown',
      avatar: mp.user?.image || `https://api.dicebear.com/9.x/avataaars/png?seed=${mp.userId}`,
      role: 'lecturer' as const,
      year: undefined,
      department: mp.user?.department || 'Unknown',
      currentMentees,
      maxMentees: mp.maxMentees,
      rating: mp.rating,
      totalReviews: mp.totalReviews,
      availableDays: Array.isArray(mp.availableDays) ? mp.availableDays.length : 0,
      expertise: mp.expertise || [],
      achievements: mp.user?.achievements || [],
      contact: { email: mp.user?.email || '' },
      schedule: [],
    };
  }));

  const mockMentors = Array.from({ length: 20 }).map((_, i) => ({
    id: `mentor${i+1}`,
    name: `Mentor ${i+1} - ${i % 2 === 0 ? 'Nguyen Van' : 'Tran Thi'}`,
    avatar: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${30 + i}.jpg`,
    role: (i % 3 === 0 ? 'lecturer' : 'student') as 'lecturer' | 'student',
    year: i % 3 === 0 ? undefined : (2 + (i % 4)),
    department: ['Computer Science', 'Information Systems', 'Software Engineering', 'Data Science'][i % 4],
    currentMentees: Math.floor(Math.random() * 5),
    maxMentees: 3 + (i % 4),
    rating: 4 + Math.random(),
    totalReviews: 5 + Math.floor(Math.random() * 30),
    availableDays: 2 + (i % 5),
    expertise: [
      'AI', 'Web Dev', 'Algorithms', 'Database', 'Project Management', 'Mobile Dev', 'UI/UX', 'Machine Learning', 'Big Data'
    ].filter((_, idx) => idx % (i % 5 + 1) === 0),
    achievements: [
      'Best Lecturer 2024', 'Top Mentor', 'Hackathon Winner', 'App Award 2025', 'Data Science Award'
    ].filter((_, idx) => idx % (i % 3 + 1) === 0),
    contact: { email: `mentor${i+1}@univ.edu` },
    schedule: [],
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Danh sách Mentors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockMentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}
      </div>
    </div>
  );
}
