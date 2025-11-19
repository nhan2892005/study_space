import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import MenteeCard from '@/components/mentor/MenteeCard';

export default async function MyMenteesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <div className="p-8">Vui lòng đăng nhập</div>;

  // FIX 1: Đổi 'role' thành 'userType'
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email }, 
    select: { id: true, userType: true } 
  });

  if (!user) return <div className="p-8">Người dùng không tồn tại</div>;
  
  // FIX 2: Kiểm tra userType thay vì role
  if (user.userType !== 'MENTOR') return <div className="p-8">Trang này dành cho Mentor</div>;

  const connections = await prisma.menteeConnection.findMany({ 
    where: { mentorId: user.id, status: 'ACCEPTED' }, 
    include: { 
      mentee: { 
        select: { 
          id: true, 
          name: true, 
          email: true, 
          // image: true,  <-- XÓA DÒNG NÀY (DB không có)
        } 
      } 
    } 
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Danh sách Mentee của tôi</h1>
      <div className="space-y-4">
        {connections.length === 0 ? <div>Chưa có mentee nào</div> : (
          connections.map((c: any) => {
            // FIX 3: Map dữ liệu để tạo avatar giả
            const menteeWithAvatar = {
              ...c,
              mentee: {
                ...c.mentee,
                image: `https://api.dicebear.com/9.x/initials/svg?seed=${c.mentee.name}`
              }
            };
            return <MenteeCard key={c.id} connection={menteeWithAvatar} />;
          })
        )}
      </div>
    </div>
  );
}