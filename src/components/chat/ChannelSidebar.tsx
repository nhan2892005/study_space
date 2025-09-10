'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import CreateChannelModal from '@/components/chat/CreateChannelModal';
import { useServer } from '@/contexts/ServerContext';

type ChannelType = 'TEXT' | 'VOICE' | 'VIDEO' | 'STREAMING';

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
}

interface ChannelsByType {
  TEXT: Channel[];
  VOICE: Channel[];
  VIDEO: Channel[];
  STREAMING: Channel[];
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
  const [groupedChannels, setGroupedChannels] = useState<ChannelsByType>({
    TEXT: [],
    VOICE: [],
    VIDEO: [],
    STREAMING: [],
  });

  // Load channels if not already loaded
  useEffect(() => {
    if (!channels[serverId]) {
      loadChannels(serverId);
    }
  }, [serverId, channels, loadChannels]);

  // Group channels by type whenever channels change
  useEffect(() => {
    if (channels[serverId]) {
      const grouped = channels[serverId].reduce((acc, channel) => {
        acc[channel.type].push(channel);
        return acc;
      }, {
        TEXT: [],
        VOICE: [],
        VIDEO: [],
        STREAMING: [],
      } as ChannelsByType);

      setGroupedChannels(grouped);
      
      // If we have channels and no active channel, select the first text channel by default
      if (grouped.TEXT.length > 0 && !activeChannel) {
        setActiveChannel(grouped.TEXT[0]);
        router.push(`/group/${serverId}/${grouped.TEXT[0].id}`);
      }
    }
  }, [serverId, channels, activeChannel, setActiveChannel, router]);

  const handleChannelClick = (channel: Channel) => {
    setActiveChannel(channel);
    router.push(`/group/${serverId}/${channel.id}`);
  };

  const handleCreateChannel = async (data: { name: string; type: ChannelType; description?: string }) => {
    try {
      const response = await fetch(`/api/servers/${serverId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create channel');

      const newChannel: Channel = await response.json();
      
      // Reload channels after creating new one
      await loadChannels(serverId);
      
      // Set the new channel as active
      setActiveChannel(newChannel);
      router.push(`/group/${serverId}/${newChannel.id}`);
      toast.success('Channel created successfully');
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    }
  };

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
        {/* Text Channels */}
        {groupedChannels.TEXT.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">TEXT CHANNELS</h3>
            {groupedChannels.TEXT.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel?.id === channel.id
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                }`}
              >
                # {channel.name}
              </button>
            ))}
          </div>
        )}

        {/* Voice Channels */}
        {groupedChannels.VOICE.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">VOICE CHANNELS</h3>
            {groupedChannels.VOICE.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel?.id === channel.id
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                }`}
              >
                🔊 {channel.name}
              </button>
            ))}
          </div>
        )}

        {/* Video Channels */}
        {groupedChannels.VIDEO.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">VIDEO CHANNELS</h3>
            {groupedChannels.VIDEO.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel?.id === channel.id
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                }`}
              >
                🎥 {channel.name}
              </button>
            ))}
          </div>
        )}

        {/* Streaming Channels */}
        {groupedChannels.STREAMING.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">STREAMING</h3>
            {groupedChannels.STREAMING.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel?.id === channel.id
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                }`}
              >
                📹 {channel.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateChannel}
      />
    </div>
  );
}
