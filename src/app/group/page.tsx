import ChatSidebar from '@/components/chat/ChatSidebar';

export default function GroupPage() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Server List Sidebar */}
      <ChatSidebar />
    </div>
  );
}
