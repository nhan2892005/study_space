"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Temporary mock data - will be replaced with real data from API
const mockServers = [
  { id: '1', name: 'CS101', image: '/server-icons/cs101.png' },
  { id: '2', name: 'Math Group', image: '/server-icons/math.png' },
  { id: '3', name: 'Physics Lab', image: '/server-icons/physics.png' },
];

export default function ChatSidebar() {
  const pathname = usePathname();
  const [activeServer, setActiveServer] = useState('1');

  return (
    <div className="w-20 h-screen bg-gray-800 dark:bg-gray-900 flex flex-col items-center py-4 gap-4">
      {/* Home Button */}
      <Link
        href="/"
        className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-700 hover:bg-blue-600 transition-colors ${
          pathname === '/' ? 'bg-blue-600' : ''
        }`}
      >
        <Image src="/home.svg" alt="Home" width={24} height={24} />
      </Link>

      <div className="w-12 h-[2px] bg-gray-700 rounded-full mx-auto" />

      {/* Server List */}
      <div className="flex flex-col gap-4">
        {mockServers.map((server) => (
          <button
            key={server.id}
            onClick={() => setActiveServer(server.id)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
              activeServer === server.id
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Image
              src={server.image}
              alt={server.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          </button>
        ))}

        {/* Add Server Button */}
        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-700 hover:bg-green-600 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
