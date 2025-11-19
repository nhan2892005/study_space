'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import CreateChannelModal from '@/components/chat/CreateChannelModal';
import { useServer } from '@/contexts/ServerContext';

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface Props {
  serverId: string;
}

export default function ChannelSidebar({ serverId }: Props) {
  const router = useRouter();
  const { 
    activeServer, 
    channels, 
    activeChannel, 
    setActiveChannel, 
    loadChannels 
  } = useServer();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load channels if not already loaded
  useEffect(() => {
    if (!channels[serverId]) {
      loadChannels(serverId);
    }
  }, [serverId, channels, loadChannels]);

  // Auto-select first channel if none selected
  useEffect(() => {
    const serverChannels = channels[serverId] || [];
    if (serverChannels.length > 0 && !activeChannel) {
      setActiveChannel(serverChannels[0]);
      router.push(`/group/${serverId}/${serverChannels[0].id}`);
    }
  }, [serverId, channels, activeChannel, setActiveChannel, router]);

  const handleChannelClick = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/group/${serverId}/${channel.id}`);
  };

  const serverChannels = channels[serverId] || [];

  return (
    <div className="w-64 h-screen bg-gray-700 dark:bg-gray-800">
      {/* Server Header */}
      <div className="h-12 border-b border-gray-600 flex items-center justify-between px-4">
        <h2 className="text-white font-semibold truncate">{activeServer?.name}</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Channel List */}
      <div className="p-4">
        {serverChannels.length > 0 ? (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2 uppercase">Channels</h3>
            {serverChannels.map((channel: any) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel?.id === channel.id
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                }`}
              >
                <span className="text-lg">#</span> {channel.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center mt-4">
            No channels yet.
          </div>
        )}
      </div>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        serverId={serverId}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}