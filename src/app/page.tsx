import MentorCard from "@/components/mentor/MentorCard";
import PostCard from "@/components/post/PostCard";
import CreatePost from "@/components/post/CreatePost";
import Pagination from "@/components/post/Pagination";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { ExtendedPost } from "@/types/post";
import RoleAssigner from '@/components/auth/RoleAssigner';

async function getPosts(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            userType: true,
            department: true 
          }
        },
        images: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' } // Nên sắp xếp comment cũ trước
        },
        reactions: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.post.count()
  ]);

  const formattedPosts = posts.map((post) => ({
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    images: post.images.map((img) => img.imageUrl),
    author: {
      ...post.author,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(post.author.name || 'User')}`, 
      role: post.author.userType
    },

    comments: post.comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      author: {
        ...comment.author,
        image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(comment.author.name || 'User')}`
      }
    }))
  }));

  return {
    posts: formattedPosts as unknown as ExtendedPost[],
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page
    }
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || 'guest';
  const page = Number(searchParams['page']) || 1;
  const { posts, pagination } = await getPosts(page, 10);

  const mentorProfiles = await prisma.mentorProfile.findMany({
    orderBy: [{ rating: 'desc' }, { totalReviews: 'desc' }],
    take: 10,
    include: { 
      user: { 
        select: { 
          id: true, 
          name: true, 
          department: true, 
          email: true 
        } 
      },
      chuyenMon: true
    }
  });

  // Map dữ liệu Mentors
  const mentors = await Promise.all(mentorProfiles.map(async (mp:any) => {
    const currentMentees = await prisma.menteeConnection.count({ where: { mentorId: mp.userId, status: 'ACCEPTED' } });
    
    // Lấy list bằng cấp từ bảng ChuyenMon
    const skills = mp.chuyenMon ? mp.chuyenMon.map((cm: any) => cm.bangCap) : [];

    return {
      id: mp.userId,
      name: mp.user?.name || 'Unknown',
      // Tạo avatar giả vì DB không có cột image
      avatar: `https://api.dicebear.com/9.x/avataaars/png?seed=${mp.userId}`,
      role: 'lecturer' as const,
      year: undefined,
      department: mp.user?.department || 'Unknown',
      currentMentees,
      maxMentees: 10, // Hardcode hoặc thêm vào DB sau
      rating: Number(mp.rating), // Convert Decimal to Number
      totalReviews: mp.totalReviews,
      availableDays: 3, // Mock data
      expertise: skills, // Dùng dữ liệu thật từ bảng ChuyenMon
      achievements: [], // DB chưa có bảng achievements, để mảng rỗng
      contact: { email: mp.user?.email || '' },
      schedule: [],
    };
  }));

  return (
    <>
      <RoleAssigner />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* GRID: 1 col on mobile, 4 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* left spacer */}
          <div className="hidden lg:block" />

          {/* Feed: takes 2 middle columns */}
          <section className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bảng tin
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Kết nối với cộng đồng học tập của chúng ta
              </p>
            </div>

            {/* Create Post */}
            <CreatePost />

            {/* Posts list */}
            <div className="space-y-6 mt-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8">
              <Pagination {...pagination} />
            </div>
          </section>

          {/* Right sidebar: Recommended mentors */}
          <aside className="lg:col-span-1">
            {userRole.toString().toLowerCase() === 'mentee' && (
              <div className="relative">
                <div className="sticky top-20">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Những Mentors có thể hợp với bạn
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Chọn Mentor phù hợp để đồng hành cùng bạn.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {mentors.map((mentor) => (
                      <MentorCard key={mentor.id} mentor={mentor} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 items-center text-sm text-gray-500 dark:text-gray-400">
            <a
              className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/file.svg"
                alt="File icon"
                width={16}
                height={16}
              />
              Project for Software Engineering course
            </a>
            <a
              className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
              href="https://github.com/nhan2892005/study_space"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/window.svg"
                alt="Window icon"
                width={16}
                height={16}
              />
              Source code
            </a>
            <a
              className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white"
              href="https://github.com/nhan2892005/study_space"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/globe.svg"
                alt="Globe icon"
                width={16}
                height={16}
              />
              © 2025 Phuc Nhan.
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}