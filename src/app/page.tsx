import { mockMentors } from "@/data/mentors";
import { mockPosts } from "@/data/posts";
import MentorCard from "@/components/mentor/MentorCard";
import PostCard from "@/components/post/PostCard";
import Navbar from "@/components/navbar/Navbar";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default function Home() {
  const session =  getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'guest';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* For Mentee: Show Recommended Mentors */}
        {userRole === 'mentee' && (
          <section className="mb-12">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Recommended Mentors
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Find the perfect mentor to help you succeed in your studies
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {mockMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          </section>
        )}

        {/* News Feed */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              News Feed
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Stay updated with the latest posts from our community
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {mockPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
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
