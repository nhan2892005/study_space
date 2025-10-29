import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import MenteeCard from '@/components/mentor/MenteeCard';

export default async function MyMenteesPage() {
  // MOCK DATA DEMO
  const mockConnections = Array.from({ length: 5 }).map((_, i) => ({
    id: `conn${i+1}`,
    mentee: {
      id: `mentee${i+1}`,
      name: `Mentee ${i+1} - ${i % 2 === 0 ? 'Nguyen Van' : 'Tran Thi'}`,
      email: `mentee${i+1}@example.com`,
      image: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${30 + i}.jpg`,
    }
  }));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Danh sách Mentee của tôi</h1>
      <div className="space-y-4">
        {mockConnections.length === 0 ? <div>Chưa có mentee nào</div> : (
          mockConnections.map((c:any) => (
            <MenteeCard key={c.id} connection={c} />
          ))
        )}
      </div>
    </div>
  );
}
