'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useServer } from '@/contexts/ServerContext';
import { useMessages } from '@/hooks/useMessages';
import InviteMemberModal from './InviteMemberModal';

interface FileData {
  id: string;
  name: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  size: number;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { activeServer } = useServer();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the custom hook for messages
  const { messages, loading, sendMessage } = useMessages(serverId, channelId);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    fetchChannel();
  }, [serverId, channelId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && selectedFiles.length === 0) || !channelId) return;

    setUploading(true);
    try {
      const success = await sendMessage(message, selectedFiles);
      
      if (success) {
        setMessage('');
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const renderFilePreview = (file: FileData) => {
    switch (file.type) {
      case 'IMAGE':
        return (
          <div className="max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
            <div className="relative">
              <Image
                src={file.url}
                alt={file.name}
                width={300}
                height={200}
                className="object-cover w-full h-48"
                loading="lazy"
              />
            </div>
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
              <div className="truncate">{file.name}</div>
              <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
          </div>
        );
      case 'VIDEO':
        return (
          <div className="max-w-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
            <video
              src={file.url}
              controls
              preload="metadata"
              className="w-full max-h-64"
            >
              Your browser does not support video playback.
            </video>
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
              <div className="truncate">{file.name}</div>
              <div>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
          </div>
        );
      case 'AUDIO':
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114A4.369 4.369 0 005 11a4 4 0 104 4V5.828l8-1.6v5.786A4.369 4.369 0 0016 10a4 4 0 104 4V3z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>
            <audio
              src={file.url}
              controls
              preload="metadata"
              className="w-full"
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        );
      default:
        return (
          <div className="p-4 bg-gray-100 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
              </svg>
              Download
            </a>
          </div>
        );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render welcome screen if no channel is selected
  if (!channelId && activeServer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-700">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to {activeServer.name}!
          </h1>
          {activeServer.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              {activeServer.description}
            </p>
          )}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invite Members
          </button>
        </div>
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
      <div className="h-12 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between px-4 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center">
          <span className="text-gray-500 dark:text-gray-400 mr-2 text-xl">#</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {channel?.name || 'loading...'}
          </h3>
          {channel?.description && (
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {channel.description}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
          title="Invite members"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg, index) => {
              const isNewDay = index === 0 || 
                new Date(messages[index - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
              
              return (
                <div key={msg.id}>
                  {isNewDay && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-full text-xs text-gray-600 dark:text-gray-300">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-600/30 p-2 rounded-lg transition-colors">
                    <Image
                      src={msg.author.image || `https://api.dicebear.com/9.x/adventurer/svg?seed=${msg.author.name}`}
                      alt={msg.author.name}
                      width={40}
                      height={40}
                      className="rounded-full flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {msg.author.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {msg.content && (
                        <p className="text-gray-800 dark:text-gray-200 mb-2 break-words">
                          {msg.content}
                        </p>
                      )}
                      {msg.files && msg.files.length > 0 && (
                        <div className="space-y-2">
                          {msg.files.map((file, fileIndex) => (
                            <div key={`${msg.id}-file-${fileIndex}`}>
                              {renderFilePreview(file)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* File Preview Area */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border-t dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 font-medium">
            Selected files ({selectedFiles.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 dark:text-gray-200 truncate max-w-32">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-600 bg-white dark:bg-gray-800">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors flex-shrink-0"
            title="Attach files"
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
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message #${channel?.name || 'channel'}...`}
              disabled={uploading}
              className="w-full rounded-lg bg-gray-100 dark:bg-gray-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={(!message.trim() && selectedFiles.length === 0) || uploading}
            className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex-shrink-0"
            title="Send message"
          >
            {uploading ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
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
            )}
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