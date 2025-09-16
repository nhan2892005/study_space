'use client';

import Image from 'next/image';
import Link from 'next/link';
interface Mentor {
  id: string;
  name: string;
  avatar: string;
  role: 'lecturer' | 'student';
  year?: number; // for student mentors
  department: string;
  currentMentees: number;
  maxMentees: number;
  rating: number;
  totalReviews: number;
  availableDays: number;
  expertise: string[];
  achievements: string[];
  contact: {
    email: string;
    phone?: string;
  };
  schedule: {
    day: string;
    times: string[];
  }[];
}

interface MentorCardProps {
  mentor: Mentor;
}

export default function MentorCard({ mentor }: MentorCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <Image
            src={mentor.avatar}
            alt={`${mentor.name}'s avatar`}
            width={64}
            height={64}
            className="rounded-full"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mentor.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {mentor.role === 'lecturer'
                ? 'Lecturer'
                : `${mentor.year}th Year Student`}{' '}
              • {mentor.department}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-yellow-400">⭐</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {mentor.rating.toFixed(1)} ({mentor.totalReviews} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>Mentees: {mentor.currentMentees}/{mentor.maxMentees}</span>
            <span>{mentor.availableDays} days/week</span>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Expertise
            </h4>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex gap-2">
            <Link
              href={`/mentor/${mentor.id}`}
              className="flex-1 text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Profile
            </Link>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/mentors/${mentor.id}`, { method: 'POST' });
                  const data = await res.json();
                  if (res.ok) alert('Request sent');
                  else alert(data?.error || 'Failed');
                } catch (err) {
                  alert('Network error');
                }
              }}
              className="px-3 py-2 bg-green-500 text-white rounded"
            >
              Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
