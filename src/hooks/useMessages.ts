// src/hooks/useMessages.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface FileData {
  id: string;
  name: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  size: number;
}

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'FILE' | 'SYSTEM';
  author: {
    name: string;
    image: string;
  };
  files?: FileData[];
  timestamp: Date;
}

export const useMessages = (serverId: string, channelId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [serverId, channelId]);

  const sendMessage = useCallback(async (
    content: string, 
    files: File[] = []
  ): Promise<boolean> => {
    if (!channelId) return false;
    if (!content.trim() && files.length === 0) return false;

    try {
      let uploadedFiles: FileData[] = [];
      
      // Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });

        const uploadResponse = await fetch('/api/uploads/cloudinary', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }

        const uploadResult = await uploadResponse.json();
        
        // Map uploaded files to FileData format
        uploadedFiles = files.map((file, index) => ({
          id: '', // Will be set by the server
          name: file.name,
          url: uploadResult.urls[index],
          type: getFileType(file),
          size: file.size,
        }));
      }

      const response = await fetch(`/api/servers/${serverId}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content.trim() || (files.length > 0 ? 'Shared files' : ''),
          type: files.length > 0 ? 'FILE' : 'TEXT',
          files: uploadedFiles,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Refresh messages after sending
      await fetchMessages();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [serverId, channelId, fetchMessages]);

  const getFileType = (file: File): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  };

  // Add a new message to the local state (for real-time updates)
  const addMessage = useCallback((newMessage: Message) => {
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // Update a message in the local state
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  // Remove a message from the local state
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Get messages count
  const messagesCount = messages.length;

  // Get latest message
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Auto-refresh messages every 5 seconds when channel is active
  useEffect(() => {
    if (!channelId) return;

    fetchMessages();

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages, channelId]);

  // Clean up when component unmounts or channel changes
  useEffect(() => {
    return () => {
      setMessages([]);
      setError(null);
    };
  }, [channelId]);

  return {
    // Data
    messages,
    messagesCount,
    latestMessage,
    
    // State
    loading,
    error,
    
    // Actions
    sendMessage,
    fetchMessages: fetchMessages,
    refreshMessages: fetchMessages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
  };
};