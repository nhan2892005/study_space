import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { vectorStore } from '@/lib/rag/vectorStore';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { types } = body; // ['mentors', 'posts', 'faqs']

    const documents: any[] = [];

    // Index mentors
    if (!types || types.includes('mentors')) {
      const mentors = await prisma.user.findMany({
        where: { role: 'MENTOR' },
        include: { 
          mentorProfile: true,
          receivedReviews: {
            include: { reviewer: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      documents.push(...mentors.map(mentor => {
        const reviews = mentor.receivedReviews
          .map(r => `"${r.comment}" - ${r.reviewer.name}`)
          .join('\n');

        return {
          id: `mentor-${mentor.id}`,
          content: `Mentor: ${mentor.name || 'Unknown'}
Email: ${mentor.email}
Khoa: ${mentor.department || 'N/A'}
Chuyên ngành: ${mentor.major || 'N/A'}
Giới thiệu: ${mentor.bio || 'Chưa có giới thiệu'}
Chuyên môn: ${mentor.mentorProfile?.expertise?.join(', ') || 'Chưa cập nhật'}
Đánh giá: ${mentor.mentorProfile?.rating || 0}/5 (${mentor.mentorProfile?.totalReviews || 0} đánh giá)
Số mentee tối đa: ${mentor.mentorProfile?.maxMentees || 0}
Thành tích: ${mentor.achievements || 'Chưa có'}

Một số đánh giá gần đây:
${reviews || 'Chưa có đánh giá'}`,
          metadata: {
            type: 'mentor',
            mentorId: mentor.id,
            name: mentor.name,
            department: mentor?.department || "Computer Science",
            rating: mentor.mentorProfile?.rating || 0,
            expertise: mentor.mentorProfile?.expertise || [],
          },
        };
      }));
    }

    // Index posts
    if (!types || types.includes('posts')) {
      const posts = await prisma.post.findMany({
        take: 200,
        orderBy: { createdAt: 'desc' },
        include: { 
          author: true,
          comments: {
            include: { author: true },
            take: 3,
          },
        },
      });

      documents.push(...posts.map(post => {
        const comments = post.comments
          .map(c => `${c.author.name}: ${c.content}`)
          .join('\n');

        return {
          id: `post-${post.id}`,
          content: `Bài đăng của ${post.author.name}:
${post.content}

Bình luận:
${comments || 'Chưa có bình luận'}`,
          metadata: {
            type: 'post',
            postId: post.id,
            authorId: post.authorId,
            authorName: post.author.name,
            createdAt: post.createdAt.toISOString(),
          },
        };
      }));
    }

    // Index general FAQs
    if (!types || types.includes('general')) {
      const generalInfo = [
        {
          id: 'faq-1',
          content: `Câu hỏi: Làm thế nào để tìm mentor phù hợp?
Trả lời: Bạn có thể xem danh sách mentors trên trang /mentor, lọc theo khoa, chuyên ngành, hoặc đánh giá. Sau đó gửi yêu cầu kết nối với mentor mà bạn quan tâm.`,
          metadata: { type: 'general', category: 'mentor-matching' },
        },
        {
          id: 'faq-2',
          content: `Câu hỏi: Tôi có thể chat với bao nhiêu người cùng lúc?
Trả lời: Bạn có thể tham gia nhiều server và chat với nhiều người. Không có giới hạn về số lượng cuộc trò chuyện.`,
          metadata: { type: 'general', category: 'chat' },
        },
        {
          id: 'faq-3',
          content: `Câu hỏi: Làm thế nào để đánh giá mentor?
Trả lời: Sau khi bạn có kết nối được chấp nhận với mentor, bạn có thể đánh giá mentor trên trang profile của họ.`,
          metadata: { type: 'general', category: 'review' },
        },
      ];

      documents.push(...generalInfo);
    }

    // Index to Pinecone
    const result = await vectorStore.addDocuments(documents);

    return NextResponse.json({
      success: true,
      indexed: result.count,
      dimension: result.dimension,
      breakdown: {
        mentors: documents.filter(d => d.metadata.type === 'mentor').length,
        posts: documents.filter(d => d.metadata.type === 'post').length,
        general: documents.filter(d => d.metadata.type === 'general').length,
      },
    });
  } catch (error: any) {
    console.error('Embedding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to embed documents' },
      { status: 500 }
    );
  }
}

// Get stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await vectorStore.getStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}