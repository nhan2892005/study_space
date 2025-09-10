'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import CreateChannelModal from '@/components/chat/CreateChannelModal';

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

export default function ChannelSidebar() {
  const params = useParams();
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelsByType>({
    TEXT: [],
    VOICE: [],
    VIDEO: [],
    STREAMING: [],
  });
  const [activeChannel, setActiveChannel] = useState<string>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [serverName, setServerName] = useState('');

  useEffect(() => {
    if (!params.serverId) return;

    const fetchChannels = async () => {
      try {
        const response = await fetch(`/api/servers/${params.serverId}/channels`);
        if (!response.ok) throw new Error('Failed to fetch channels');
        
        const channelsData: Channel[] = await response.json();
        
        // Group channels by type
        const grouped = channelsData.reduce((acc, channel) => {
          acc[channel.type].push(channel);
          return acc;
        }, {
          TEXT: [],
          VOICE: [],
          VIDEO: [],
          STREAMING: [],
        } as ChannelsByType);

        setChannels(grouped);
      } catch (error) {
        console.error('Error fetching channels:', error);
        toast.error('Failed to load channels');
      }
    };

    const fetchServer = async () => {
      try {
        const response = await fetch(`/api/servers/${params.serverId}`);
        if (!response.ok) throw new Error('Failed to fetch server');
        
        const serverData = await response.json();
        setServerName(serverData.name);
      } catch (error) {
        console.error('Error fetching server:', error);
      }
    };

    fetchChannels();
    fetchServer();
  }, [params.serverId]);

  const handleCreateChannel = async (data: { name: string; type: ChannelType; description?: string }) => {
    try {
      const response = await fetch(`/api/servers/${params.serverId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create channel');

      const newChannel: Channel = await response.json();
      const channelType = newChannel.type as keyof ChannelsByType;
      setChannels(prev => ({
        ...prev,
        [channelType]: [...prev[channelType], newChannel],
      }));

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
        <h2 className="text-white font-semibold truncate">{serverName}</h2>
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
        {channels.TEXT.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">TEXT CHANNELS</h3>
            {channels.TEXT.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  router.push(`/group/${params.serverId}/${channel.id}`);
                }}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel === channel.id
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
        {channels.VOICE.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">VOICE CHANNELS</h3>
            {channels.VOICE.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  router.push(`/group/${params.serverId}/${channel.id}`);
                }}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel === channel.id
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
        {channels.VIDEO.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">VIDEO CHANNELS</h3>
            {channels.VIDEO.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  router.push(`/group/${params.serverId}/${channel.id}`);
                }}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel === channel.id
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
        {channels.STREAMING.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-400 text-sm font-medium mb-2">STREAMING</h3>
            {channels.STREAMING.map((channel) => (
              <button
                key={channel.id}
                onClick={() => {
                  setActiveChannel(channel.id);
                  router.push(`/group/${params.serverId}/${channel.id}`);
                }}
                className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 ${
                  activeChannel === channel.id
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
