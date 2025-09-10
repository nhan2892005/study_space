'use client';

import { useEffect } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChannelSidebar from '@/components/chat/ChannelSidebar';
import ChatArea from '@/components/chat/ChatArea';
import { useServer } from '@/contexts/ServerContext';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    serverId: string;
    channelId: string;
  };
}

export default function ChannelPage({ params }: Props) {
  const { serverId, channelId } = params;
  const { setActiveServer } = useServer();

  useEffect(() => {
    setActiveServer(serverId);
  }, [serverId, setActiveServer]);

  if (!serverId || !channelId) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ChatSidebar />
      <ChannelSidebar serverId={serverId} />
      <ChatArea serverId={serverId} channelId={channelId} />
    </div>
  );
}
