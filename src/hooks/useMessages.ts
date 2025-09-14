// src/hooks/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useSocket } from '@/contexts/SocketContext';

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

interface TypingUser {
  userId: string;
  userName: string;
}

export const useMessages = (serverId: string, channelId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  
  const { 
    socket, 
    isConnected, 
    joinChannel, 
    leaveChannel, 
    sendMessage: socketSendMessage, 
    onNewMessage,
    onError,
    onUserTyping,
    onUserStoppedTyping,
    startTyping,
    stopTyping
  } = useSocket();

  const currentChannelRef = useRef<string>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initial fetch of messages from API
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

  // Handle new messages from socket
  useEffect(() => {
    if (!socket || !channelId) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    };

    const handleError = (error: any) => {
      console.error('Socket error:', error);
      setError(error.message);
      toast.error(error.message);
    };

    const handleUserTyping = (data: { userId: string; userName: string; channelId: string }) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => {
          if (prev.some(u => u.userId === data.userId)) {
            return prev;
          }
          return [...prev, { userId: data.userId, userName: data.userName }];
        });
      }
    };

    const handleUserStoppedTyping = (data: { userId: string; channelId: string }) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    };

    // Set up socket event listeners and collect cleanup functions
    const cleanupFunctions: (() => void)[] = [];
    
    const newMessageCleanup = onNewMessage(handleNewMessage);
    if (newMessageCleanup) cleanupFunctions.push(newMessageCleanup);
    
    const errorCleanup = onError(handleError);
    if (errorCleanup) cleanupFunctions.push(errorCleanup);
    
    const typingCleanup = onUserTyping(handleUserTyping);
    if (typingCleanup) cleanupFunctions.push(typingCleanup);
    
    const stoppedTypingCleanup = onUserStoppedTyping(handleUserStoppedTyping);
    if (stoppedTypingCleanup) cleanupFunctions.push(stoppedTypingCleanup);

    return () => {
      // Cleanup all event listeners
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [socket, channelId, onNewMessage, onError, onUserTyping, onUserStoppedTyping]);

  // Join/leave channel when channelId changes
  useEffect(() => {
    if (!socket || !channelId || !serverId) return;

    // Leave previous channel
    if (currentChannelRef.current && currentChannelRef.current !== channelId) {
      leaveChannel(currentChannelRef.current);
    }

    // Join new channel
    joinChannel(channelId, serverId);
    currentChannelRef.current = channelId;

    // Fetch initial messages
    fetchMessages();

    return () => {
      if (channelId) {
        leaveChannel(channelId);
      }
    };
  }, [channelId, serverId, socket, joinChannel, leaveChannel, fetchMessages]);

  // Send message function
  const sendMessage = useCallback(async (
    content: string, 
    files: File[] = []
  ): Promise<boolean> => {
    if (!channelId || !socket) return false;
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
        
        uploadedFiles = files.map((file, index) => ({
          id: '',
          name: file.name,
          url: uploadResult.urls[index],
          type: getFileType(file),
          size: file.size,
        }));
      }

      // Send via socket
      socketSendMessage({
        channelId,
        serverId,
        content: content.trim() || (files.length > 0 ? 'Shared files' : ''),
        files: uploadedFiles,
      });

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [channelId, serverId, socket, socketSendMessage]);

  // Typing indicators
  const handleTyping = useCallback(() => {
    if (!channelId || !socket) return;

    startTyping(channelId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId);
    }, 3000);
  }, [channelId, socket, startTyping, stopTyping]);

  const handleStopTyping = useCallback(() => {
    if (!channelId || !socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    stopTyping(channelId);
  }, [channelId, socket, stopTyping]);

  const getFileType = (file: File): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' => {
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  };

  // Manual refresh fallback
  const refreshMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    messages,
    messagesCount: messages.length,
    latestMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    typingUsers,
    
    // State
    loading,
    error,
    isConnected,
    
    // Actions
    sendMessage,
    refreshMessages,
    handleTyping,
    handleStopTyping,
  };
};