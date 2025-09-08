"use client";

import { useState } from 'react';

// Temporary mock data - will be replaced with real data from API
const mockChannels = {
  text: [
    { id: '1', name: 'general', type: 'TEXT' },
    { id: '2', name: 'homework-help', type: 'TEXT' },
    { id: '3', name: 'announcements', type: 'TEXT' },
  ],
  voice: [
    { id: '4', name: 'Study Room 1', type: 'VOICE' },
    { id: '5', name: 'Study Room 2', type: 'VOICE' },
  ],
  streaming: [
    { id: '6', name: 'Live Lecture', type: 'STREAMING' },
    { id: '7', name: 'Code Review', type: 'STREAMING' },
  ],
};

export default function ChannelSidebar() {
  const [activeChannel, setActiveChannel] = useState('1');

  return (
    <div className="w-64 h-screen bg-gray-700 dark:bg-gray-800">
      {/* Server Header */}
      <div className="h-12 border-b border-gray-600 flex items-center px-4">
        <h2 className="text-white font-semibold">CS101 Server</h2>
      </div>

      {/* Channel List */}
      <div className="p-4">
        {/* Text Channels */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-gray-400 text-sm mb-2">
            <span>TEXT CHANNELS</span>
            <button className="hover:text-white">+</button>
          </div>
          {mockChannels.text.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
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

        {/* Voice Channels */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-gray-400 text-sm mb-2">
            <span>VOICE CHANNELS</span>
            <button className="hover:text-white">+</button>
          </div>
          {mockChannels.voice.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
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

        {/* Streaming Channels */}
        <div>
          <div className="flex items-center justify-between text-gray-400 text-sm mb-2">
            <span>STREAMING</span>
            <button className="hover:text-white">+</button>
          </div>
          {mockChannels.streaming.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
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
      </div>
    </div>
  );
}
