"use client";

import { useState } from 'react';
import Image from 'next/image';

// Temporary mock data - will be replaced with real data from API
const mockMessages = [
  {
    id: '1',
    content: 'Hello everyone! Welcome to CS101 study group!',
    author: {
      name: 'John Doe',
      image: 'https://api.dicebear.com/9.x/pixel-art/png?seed=John',
    },
    timestamp: new Date('2025-09-08T10:00:00Z'),
  },
  {
    id: '2',
    content: 'Thanks! Quick question about the upcoming assignment...',
    author: {
      name: 'Jane Smith',
      image: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Jane',
    },
    timestamp: new Date('2025-09-08T10:05:00Z'),
  },
];

export default function ChatArea() {
  const [message, setMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement message sending
    setMessage('');
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-700">
      {/* Channel Header */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-600 flex items-center px-4">
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-2">#</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">general</h3>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mockMessages.map((msg) => (
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
                  {msg.timestamp.toLocaleTimeString()}
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
    </div>
  );
}
