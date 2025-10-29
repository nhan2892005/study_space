'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
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
  // Mock mentors for demo
  const mockMentors: Mentor[] = [
    {
      id: 'mentor1',
      name: 'Nguyen Van Mentor',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      role: 'lecturer',
      department: 'Computer Science',
      year: undefined,
      currentMentees: 3,
      maxMentees: 5,
      rating: 4.8,
      totalReviews: 23,
      availableDays: 5,
      expertise: ['AI', 'Web Dev', 'Algorithms'],
      achievements: ['Best Lecturer 2024', 'Top Mentor'],
      contact: { email: 'mentor1@univ.edu' },
      schedule: [ { day: 'Monday', times: ['9:00', '14:00'] }, { day: 'Wednesday', times: ['10:00'] } ],
    },
    {
      id: 'mentor2',
      name: 'Tran Thi Mentor',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      role: 'student',
      department: 'Information Systems',
      year: 4,
      currentMentees: 2,
      maxMentees: 4,
      rating: 4.5,
      totalReviews: 12,
      availableDays: 3,
      expertise: ['Database', 'Project Management'],
      achievements: ['Hackathon Winner'],
      contact: { email: 'mentor2@univ.edu' },
      schedule: [ { day: 'Tuesday', times: ['13:00'] }, { day: 'Thursday', times: ['15:00'] } ],
    },
    {
      id: 'mentor3',
      name: 'Le Van Mentor',
      avatar: 'https://randomuser.me/api/portraits/men/65.jpg',
      role: 'student',
      department: 'Software Engineering',
      year: 3,
      currentMentees: 1,
      maxMentees: 3,
      rating: 4.2,
      totalReviews: 8,
      availableDays: 2,
      expertise: ['Mobile Dev', 'UI/UX'],
      achievements: ['App Award 2025'],
      contact: { email: 'mentor3@univ.edu' },
      schedule: [ { day: 'Friday', times: ['8:00', '16:00'] } ],
    },
    {
      id: 'mentor4',
      name: 'Pham Thi Mentor',
      avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
      role: 'lecturer',
      department: 'Data Science',
      year: undefined,
      currentMentees: 4,
      maxMentees: 6,
      rating: 4.9,
      totalReviews: 30,
      availableDays: 6,
      expertise: ['Machine Learning', 'Big Data'],
      achievements: ['Data Science Award'],
      contact: { email: 'mentor4@univ.edu' },
      schedule: [ { day: 'Monday', times: ['11:00'] }, { day: 'Thursday', times: ['14:00'] } ],
    },
  ];

  // Allow switching between mock mentors for demo
  const [mentorIndex, setMentorIndex] = useState(0);
  const demoMentor = mentor || mockMentors[mentorIndex];

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <Image
              src={demoMentor.avatar}
              alt={`${demoMentor.name}'s avatar`}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {demoMentor.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {demoMentor.role === 'lecturer'
                  ? 'Lecturer'
                  : `${demoMentor.year}th Year Student`}{' '}
                • {demoMentor.department}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-yellow-400">⭐</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {demoMentor.rating.toFixed(1)} ({demoMentor.totalReviews} reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Mentees: {demoMentor.currentMentees}/{demoMentor.maxMentees}</span>
              <span>{demoMentor.availableDays} days/week</span>
            </div>

            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Expertise
              </h4>
              <div className="flex flex-wrap gap-2">
                {demoMentor.expertise.map((skill) => (
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
                href={`/mentor/${demoMentor.id}`}
                className="flex-1 text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Profile
              </Link>
              <button
                onClick={async () => {
                  // Simulate API for demo
                  await new Promise(res => setTimeout(res, 500));
                  alert('Request sent');
                }}
                className="px-3 py-2 bg-green-500 text-white rounded"
              >
                Request
              </button>
              {/* Demo: Chuyển mentor mock */}
              <button
                type="button"
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs"
                onClick={() => setMentorIndex((mentorIndex + 1) % mockMentors.length)}
              >
                Xem mentor khác
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
