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
// remove mockMentors import — we'll fetch top mentors from DB

// MOCK POSTS DATA
function getMockPosts(page: number = 1, limit: number = 5) {
  const total = 30;
  const pages = Math.ceil(total / limit);
  const posts = Array.from({ length: limit }).map((_, idx) => {
    const id = `post${(page-1)*limit + idx + 1}`;
    return {
      id,
      content: `Bài viết demo số ${id}. Đây là nội dung mô phỏng cho bài viết trên bảng tin.`,
      createdAt: new Date(Date.now() - (idx * 3600 * 1000)),
      updatedAt: new Date(Date.now() - (idx * 3500 * 1000)),
      images: [],
      published: true,
      author: {
        id: `user${idx+1}`,
        name: `Người dùng ${idx+1}`,
        image: `https://randomuser.me/api/portraits/${idx % 2 === 0 ? 'men' : 'women'}/${30 + idx}.jpg`,
        role: 'MENTEE' as 'MENTEE',
      },
      comments: [
        {
          id: `cmt${id}-1`,
          content: 'Bình luận mẫu 1',
          createdAt: new Date(Date.now() - (idx * 3400 * 1000)),
          authorId: `user${idx+2}`,
          postId: id,
          author: {
            id: `user${idx+2}`,
            name: `Người dùng ${idx+2}`,
            image: `https://randomuser.me/api/portraits/men/${40 + idx}.jpg`,
          }
        },
        {
          id: `cmt${id}-2`,
          content: 'Bình luận mẫu 2',
          createdAt: new Date(Date.now() - (idx * 3300 * 1000)),
          authorId: `user${idx+3}`,
          postId: id,
          author: {
            id: `user${idx+3}`,
            name: `Người dùng ${idx+3}`,
            image: `https://randomuser.me/api/portraits/women/${50 + idx}.jpg`,
          }
        }
      ],
      reactions: [],
    };
  });
  return {
    posts,
    pagination: {
      total,
      pages,
      current: page
    }
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // MOCK SESSION & ROLE
  const session = { user: { role: 'mentee' } };
  const userRole = session.user.role;
  const page = Number(searchParams['page']) || 1;
  const { posts, pagination } = getMockPosts(page);

  // MOCK MENTORS DATA
  const mentors = Array.from({ length: 10 }).map((_, i) => ({
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
    <>
      <RoleAssigner />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* GRID: 1 col on mobile, 4 cols on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* left spacer (can put nav/ads later) */}
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

          {/* Right sidebar: Recommended mentors (sticky on large screens) */}
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
