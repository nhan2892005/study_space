import { mockMentors } from "@/data/mentors";
import MentorCard from "@/components/mentor/MentorCard";
import PostCard from "@/components/post/PostCard";
import CreatePost from "@/components/post/CreatePost";
import Pagination from "@/components/post/Pagination";
import Navbar from "@/components/navbar/Navbar";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import type { ExtendedPost } from "@/types/post";

async function getPosts(page: number = 1, limit: number = 5) {
  const skip = (page - 1) * limit;
  
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        reactions: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.post.count()
  ]);

  return {
    posts: posts as ExtendedPost[],
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
  const { posts, pagination } = await getPosts(page);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
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
                    {mockMentors.map((mentor) => (
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
              © 2024 Phuc Nhan.
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
