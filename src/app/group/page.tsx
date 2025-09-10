import ChatSidebar from '@/components/chat/ChatSidebar';
import ChannelSidebar from '@/components/chat/ChannelSidebar';
import ChatArea from '@/components/chat/ChatArea';

export default function GroupPage() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Server List Sidebar */}
      <ChatSidebar />

      {/* Channel List Sidebar */}
      <ChannelSidebar />
    </div>
  );
}
