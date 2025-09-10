'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import InviteMemberModal from './InviteMemberModal';

interface Message {
  id: string;
  content: string;
  author: {
    name: string;
    image: string;
  };
  timestamp: Date;
}

interface Server {
  id: string;
  name: string;
  description?: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface ChatAreaProps {
  serverId: string;
  channelId?: string;
}

export default function ChatArea({ serverId, channelId }: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [server, setServer] = useState<Server | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}`);
        if (!response.ok) throw new Error('Failed to fetch server');
        const data = await response.json();
        setServer(data);
      } catch (error) {
        console.error('Error fetching server:', error);
        toast.error('Failed to load server');
      }
    };

    fetchServer();
  }, [serverId]);

  useEffect(() => {
    if (!channelId) return;

    const fetchChannel = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/channels/${channelId}`);
        if (!response.ok) throw new Error('Failed to fetch channel');
        const data = await response.json();
        setChannel(data);
      } catch (error) {
        console.error('Error fetching channel:', error);
        toast.error('Failed to load channel');
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      }
    };

    fetchChannel();
    fetchMessages();
  }, [serverId, channelId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !channelId) return;

    try {
      const response = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Render welcome screen if no channel is selected
  if (!channelId && server) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to {server.name}!
        </h1>
        {server.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-8">{server.description}</p>
        )}
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Invite Members
        </button>
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          serverId={serverId}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-700">
      {/* Channel Header */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between px-4">
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-2">#</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {channel?.name || 'loading...'}
          </h3>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3">
            <Image
              src={msg.author.image}
              alt={msg.author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {msg.author.name}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-200">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-600">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        serverId={serverId}
      />
    </div>
  );
}
