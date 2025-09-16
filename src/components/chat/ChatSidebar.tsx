'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CreateServerModal from './CreateServerModal';
import { useServer } from '@/contexts/ServerContext';

interface Server {
  id: string;
  name: string;
  image?: string | null;
  description?: string;
}

export default function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { servers, activeServer, setActiveServer } = useServer();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleServerClick = (serverId: string) => {
    setActiveServer(serverId);
    router.push(`/group/${serverId}`);
  };

  const defaultServerIcon = (serverName: string) => 
    `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(serverName)}`;

  return (
    <div className="w-20 h-screen bg-gray-800 dark:bg-gray-900 flex flex-col items-center py-4 gap-4">
      {/* Home Button */}
      <Link href="/"
        className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-700 hover:bg-blue-600 transition-colors ${
          pathname === '/' ? 'bg-blue-600' : ''
        }`}
      >
        <Image src="https://api.dicebear.com/9.x/thumbs/png?seed=Home" alt="Home" width={24} height={24} />
      </Link>

      <div className="w-12 h-[2px] bg-gray-700 rounded-full mx-auto" />

      {/* Server List */}
      <div className="flex flex-col gap-4 overflow-y-auto scrollbar-hide">
        {servers.map((server) => (
          <button
            key={server.id}
            onClick={() => handleServerClick(server.id)}
            title={server.name}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all transform hover:scale-110 ${
              activeServer?.id === server.id
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Image
              src={server.image ? server.image : defaultServerIcon(server.name)}
              alt={server.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          </button>
        ))}

        {/* Add Server Button */}
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-700 hover:bg-green-600 transition-colors"
        >
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

      <CreateServerModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
