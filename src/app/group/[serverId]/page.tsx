import ChatSidebar from '@/components/chat/ChatSidebar';
import ChannelSidebar from '@/components/chat/ChannelSidebar';
import ChatArea from '@/components/chat/ChatArea';
import { notFound } from 'next/navigation';

type Props = {
  params: {
    serverId: string;
    channelId?: string;
  };
};

export default function ServerPage({ params }: Props) {
  if (!params.serverId) {
    notFound();
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ChatSidebar />
      <ChannelSidebar serverId={params.serverId} />
      <ChatArea serverId={params.serverId} channelId={params.channelId} />
    </div>
  );
}
